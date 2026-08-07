export interface MockMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  suggestions?: string[];
  justifications?: string[];
  sources?: string[];
  clarifications?: string[];
}

export interface MockSession {
  id: string;
  title: string;
  messages: MockMessage[];
  createdAt: string;
  updatedAt: string;
}

const globalForMock = globalThis as unknown as { mockSessions?: MockSession[] };

const mockSessions: MockSession[] = globalForMock.mockSessions ?? [
  {
    id: "1",
    title: "Pesquisa sobre plantas medicinais",
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Protetor solar vegano",
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

if (process.env.NODE_ENV !== "production") {
  globalForMock.mockSessions = mockSessions;
}

export const mockStore = {
  list(): MockSession[] {
    return mockSessions;
  },

  find(id: string): MockSession | null {
    return mockSessions.find((s) => s.id === id) || null;
  },

  create(title: string): MockSession {
    const now = new Date().toISOString();
    const newSession: MockSession = {
      id: crypto.randomUUID(),
      title,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    mockSessions.unshift(newSession);
    return newSession;
  },

  update(
    id: string,
    patch: { title?: string; messages?: MockMessage[] },
  ): MockSession | null {
    const session = mockSessions.find((s) => s.id === id);
    if (!session) return null;

    if (patch.title !== undefined) {
      session.title = patch.title;
    }

    if (patch.messages && patch.messages.length > 0) {
      session.messages.push(...patch.messages);
    }

    session.updatedAt = new Date().toISOString();
    return session;
  },

  delete(id: string): boolean {
    const index = mockSessions.findIndex((s) => s.id === id);
    if (index === -1) return false;

    mockSessions.splice(index, 1);
    return true;
  },
};
