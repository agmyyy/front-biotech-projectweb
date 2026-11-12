/**
 * Prisma falso em memória para os testes de integração.
 * Espelha o subconjunto da API do Prisma usado pela aplicação, permitindo que
 * os testes rodem sem PostgreSQL e sem ler o .env (regra do AGENTS.md).
 */

type Select = Record<string, boolean> | undefined;

type UserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  sessionVersion: number;
  createdAt: Date;
};

type SessionRecord = {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

type MessageRecord = {
  id: string;
  content: string;
  role: string;
  sessionId: string;
  createdAt: Date;
};

type RatingRecord = {
  id: string;
  score: number;
  messageId: string;
};

// Banco compartilhado pelos mocks de um mesmo arquivo de teste
export const db = {
  users: [] as UserRecord[],
  sessions: [] as SessionRecord[],
  messages: [] as MessageRecord[],
  ratings: [] as RatingRecord[],
};

// Zera o estado entre os testes para que cada um comece do zero
export function resetDb(): void {
  db.users.length = 0;
  db.sessions.length = 0;
  db.messages.length = 0;
  db.ratings.length = 0;
}

let idCounter = 0;

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}

// Devolve só os campos do select, como o Prisma faria; sem select, o objeto inteiro
function project<T extends Record<string, unknown>>(
  record: T,
  select: Select,
): Partial<T> {
  if (!select) return { ...record };
  const projected: Record<string, unknown> = {};
  for (const [field, enabled] of Object.entries(select)) {
    if (enabled) projected[field] = record[field];
  }
  return projected as Partial<T>;
}

// Erro com o mesmo código que o Prisma usa para violação de unique
function uniqueViolation(): Error {
  return Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
}

// Subconjunto do client transacional exposto pelo $transaction do Prisma
type TransactionClient = {
  session: { findUnique: jest.Mock; update: jest.Mock };
  message: { create: jest.Mock };
};

// Anotação explícita quebra a referência circular do $transaction com o prisma
type InMemoryPrisma = {
  user: { create: jest.Mock; findUnique: jest.Mock; updateMany: jest.Mock };
  session: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  message: { create: jest.Mock; findMany: jest.Mock; findFirst: jest.Mock };
  rating: { create: jest.Mock };
  $transaction: jest.Mock;
};

export function createInMemoryPrisma() {
  const prisma: InMemoryPrisma = {
    user: {
      create: jest.fn(
        async ({
          data,
          select,
        }: {
          data: { name: string; email: string; password: string };
          select?: Select;
        }) => {
          if (db.users.some((user) => user.email === data.email)) {
            throw uniqueViolation();
          }
          const user: UserRecord = {
            id: nextId("user"),
            sessionVersion: 0,
            createdAt: new Date(),
            ...data,
          };
          db.users.push(user);
          return project(user, select);
        },
      ),
      findUnique: jest.fn(
        async ({
          where,
          select,
        }: {
          where: { id?: string; email?: string };
          select?: Select;
        }) => {
          const user = db.users.find((candidate) =>
            where.email
              ? candidate.email === where.email
              : candidate.id === where.id,
          );
          return user ? project(user, select) : null;
        },
      ),
      updateMany: jest.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string; sessionVersion?: number };
          data: { sessionVersion: { increment: number } };
        }) => {
          const matched = db.users.filter(
            (user) =>
              user.id === where.id &&
              (where.sessionVersion === undefined ||
                user.sessionVersion === where.sessionVersion),
          );
          for (const user of matched) {
            user.sessionVersion += data.sessionVersion.increment;
          }
          return { count: matched.length };
        },
      ),
    },
    session: {
      create: jest.fn(
        async ({ data }: { data: { title: string; userId: string } }) => {
          // Timestamps com offset garantem a ordenação mesmo no mesmo milissegundo
          const baseTime = Date.now() + db.sessions.length;
          const session: SessionRecord = {
            id: nextId("session"),
            createdAt: new Date(baseTime),
            updatedAt: new Date(baseTime),
            ...data,
          };
          db.sessions.push(session);
          return session;
        },
      ),
      findFirst: jest.fn(
        async ({ where }: { where: { id: string; userId?: string } }) => {
          const session = db.sessions.find(
            (candidate) =>
              candidate.id === where.id &&
              (where.userId === undefined ||
                candidate.userId === where.userId),
          );
          return session ? { ...session } : null;
        },
      ),
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        const session = db.sessions.find(
          (candidate) => candidate.id === where.id,
        );
        return session ? { ...session } : null;
      }),
      findMany: jest.fn(async ({ where }: { where: { userId: string } }) =>
        db.sessions
          .filter((session) => session.userId === where.userId)
          .map((session) => ({ ...session })),
      ),
      update: jest.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<SessionRecord>;
        }) => {
          const session = db.sessions.find(
            (candidate) => candidate.id === where.id,
          );
          if (!session) {
            throw Object.assign(new Error("Record not found"), {
              code: "P2025",
            });
          }
          Object.assign(session, data);
          return { ...session };
        },
      ),
      delete: jest.fn(async ({ where }: { where: { id: string } }) => {
        const index = db.sessions.findIndex(
          (candidate) => candidate.id === where.id,
        );
        if (index === -1) {
          throw Object.assign(new Error("Record not found"), { code: "P2025" });
        }
        const [removed] = db.sessions.splice(index, 1);
        return removed;
      }),
    },
    message: {
      create: jest.fn(
        async ({
          data,
        }: {
          data: { content: string; role: string; sessionId: string };
        }) => {
          const message: MessageRecord = {
            id: nextId("message"),
            createdAt: new Date(Date.now() + db.messages.length),
            ...data,
          };
          db.messages.push(message);
          return message;
        },
      ),
      findMany: jest.fn(async ({ where }: { where: { sessionId: string } }) =>
        db.messages
          .filter((message) => message.sessionId === where.sessionId)
          .map((message) => ({
            ...message,
            rating:
              db.ratings.find((rating) => rating.messageId === message.id) ??
              null,
          })),
      ),
      findFirst: jest.fn(
        async ({
          where,
        }: {
          where: { id: string; session?: { userId: string } };
        }) => {
          const message = db.messages.find((candidate) => {
            if (candidate.id !== where.id) return false;
            if (!where.session?.userId) return true;
            const session = db.sessions.find(
              (item) => item.id === candidate.sessionId,
            );
            return session?.userId === where.session.userId;
          });
          return message ? { ...message } : null;
        },
      ),
    },
    rating: {
      create: jest.fn(
        async ({ data }: { data: { score: number; messageId: string } }) => {
          if (db.ratings.some((item) => item.messageId === data.messageId)) {
            throw uniqueViolation();
          }
          const rating: RatingRecord = { id: nextId("rating"), ...data };
          db.ratings.push(rating);
          return rating;
        },
      ),
    },
    // Recebe o próprio mock como "tx", simulando a transação do Prisma
    $transaction: jest.fn(
      async (fn: (tx: TransactionClient) => Promise<unknown>) => fn(prisma),
    ),
  };

  return prisma;
}
