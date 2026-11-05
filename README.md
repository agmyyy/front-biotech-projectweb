## Sobre o Projeto

Trata-se uma plataforma web que combina uma interface de chat intuitiva com um sistema multi-agente simulado para responder perguntas sobre biotecnologia. Os usuários podem realizar perguntas e receber respostas estruturadas contendo resumo, sugestões, justificativas e fontes de referência tudo com uma animação de typewriter em tempo real.

---

## Funcionalidades

- **Autenticação JWT** — Cadastro e login com tokens baseados em cookie
- **Chat Inteligente** — Interface de busca com respostas estruturadas (resumo, sugestões, justificativas, fontes)
- **Streaming com Typewriter** — Exibição progressiva da resposta com animação palavra por palavra
- **Gerenciamento de Sessões** — Criação, listagem e exclusão de sessões de conversa (botão “X” no hover com confirmação inline)
- **Feedback com Estrelas** — Sistema de avaliação de respostas (1 a 5 estrelas)
- **Sidebar Colapsável** — Navegação lateral com histórico de conversas
- **Rotas Protegidas** — Middleware de autenticação no client-side

---

## Stack Tecnológica

| Camada       | Tecnologia                | Versão         |
| ------------ | ------------------------- | -------------- |
| **Frontend** | Next.js (App Router)      | 16.1.6         |
|              | React                     | 19.2.3         |
|              | Tailwind CSS              | 4.x            |
|              | Radix UI / shadcn         | New York style |
|              | Framer Motion             | 12.34.3        |
| **Backend**  | NestJS                    | 11.0.0         |
|              | Passport + JWT            | 0.7 / 11.0     |
|              | Zod (validação)           | 3.24.0         |
| **Shared**   | Schemas Zod + TypeScript  | Dual CJS/ESM   |
| **Infra**    | npm Workspaces (Monorepo) | —              |

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- npm >= 9

---

## Instalação e Configuração

### 1. Clonar o repositório

```bash
git clone https://github.com/agmyyy/front-biotech-projectweb.git
cd front-biotech-projectweb
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
# Backend
cp backend/.env.example backend/.env
```

Edite o `backend/.env` conforme necessário:

```env
PORT=3001
JWT_SECRET=sua-chave-secreta-aqui
JWT_EXPIRES_IN=24h
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 4. Build do pacote shared

```bash
npm run build -w shared
```

### 5. Iniciar o projeto

```bash
# Backend (porta 3001)
npm run start:dev -w backend

# Frontend (porta 3000)
npm run dev -w frontend
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Estrutura do Projeto

```
├── frontend/                  # Aplicação Next.js
│   ├── src/
│   │   ├── app/               # Rotas (App Router)
│   │   │   ├── login/         # Página de login
│   │   │   ├── cadastro/      # Página de cadastro
│   │   │   └── (private)/     # Rotas protegidas
│   │   │       └── dashboard/ # Dashboard principal
│   │   ├── components/        # Componentes React
│   │   │   ├── chat/          # Bubble de chat (input, resultado, loading)
│   │   │   ├── dashboard/     # Orquestrador principal
│   │   │   ├── feedback/      # Rating por estrelas
│   │   │   ├── search/        # Barra de busca
│   │   │   ├── sidebar/       # Sidebar colapsável
│   │   │   └── ui/            # Primitivas (Button, Input, Card)
│   │   ├── services/          # Cliente HTTP e serviços
│   │   ├── hooks/             # Custom hooks (search, chat, typewriter)
│   │   ├── types/             # Definições TypeScript
│   │   ├── constants/         # Cores e fontes
│   │   ├── lib/               # Utilitários
│   │   └── middleware.ts      # Guard de autenticação
│   └── public/                # Assets estáticos
│
├── backend/                   # API NestJS
│   ├── prisma/                # Schema e migrations (PostgreSQL)
│   └── src/
│       ├── auth/              # Módulo de autenticação (JWT)
│       ├── queries/           # Módulo de queries e sessões
│       ├── mas/               # Sistema Multi-Agente (mock)
│       ├── feedback/          # Módulo de feedback
│       ├── lib/               # Cliente Prisma (PostgreSQL)
│       └── common/            # Guards, pipes, filters, logs
│
├── shared/                    # Pacote compartilhado
│   ├── schemas/               # Schemas Zod (auth, query, feedback)
│   ├── dto/                   # Funções de validação
│   └── types/                 # Tipos TypeScript derivados
│
└── package.json               # Configuração do monorepo
```

---

## Endpoints da API

### Autenticação

| Método | Rota                 | Autenticado | Descrição                                                 |
| ------ | -------------------- | :---------: | --------------------------------------------------------- |
| `POST` | `/api/auth/register` |     Não     | Cadastro de usuário                                       |
| `POST` | `/api/auth/login`    |     Não     | Login do usuário                                          |
| `POST` | `/api/auth/logout`   |     Não     | Encerra a sessão em todos os dispositivos (revoga o JWT)  |
| `GET`  | `/api/auth/profile`  |     Sim     | Perfil do usuário logado                                  |

> **Rate limit:** `register` e `login` aceitam no máximo **5 requisições por minuto por IP** (resposta 429 acima disso); as demais rotas têm limite global de 100 req/min.

### Queries

| Método | Rota           | Autenticado | Descrição                                                                    |
| ------ | -------------- | :---------: | ---------------------------------------------------------------------------- |
| `POST` | `/api/queries` |     Sim     | Enviar query e receber resposta estruturada                                  |
| `GET`  | `/api/queries` |     Sim     | Listar mensagens da sessão (`sessionId` obrigatório na query string)         |

### Sessões

| Método   | Rota                         | Autenticado | Descrição                    |
| -------- | ---------------------------- | :---------: | ---------------------------- |
| `GET`    | `/api/sessions`              |     Sim     | Listar sessões do usuário    |
| `GET`    | `/api/sessions/:id`          |     Sim     | Obter sessão por ID          |
| `POST`   | `/api/sessions`              |     Sim     | Criar nova sessão            |
| `PATCH`  | `/api/sessions/:id`          |     Sim     | Atualizar título da sessão   |
| `DELETE` | `/api/sessions/:id`          |     Sim     | Excluir sessão do usuário (remove queries vinculadas; 404 se não for o dono) |

> As mensagens (pergunta e resposta) são criadas automaticamente pelo fluxo de `POST /api/queries`.

> **Excluir chat:** passe o mouse sobre a conversa na sidebar para revelar o botão “X” (`ChatList`). Clicar abre um toast de pergunta (`Excluir "título"?`, com botões **Excluir**/**Manter**) que fica na tela até você decidir; **Manter** dispensa o toast sem excluir. Ao confirmar, o mesmo toast vira "Excluindo…" e depois o resultado (`Chat excluído` ou `Não foi possível excluir`), visível por no mínimo 3s, no padrão visual da app (fundo `aside`, texto `green-1`). Se era a sessão ativa e a exclusão teve sucesso, limpa a conversa e a URL (`/dashboard`).

### Feedback

| Método | Rota            | Autenticado | Descrição                 |
| ------ | --------------- | :---------: | ------------------------- |
| `POST` | `/api/feedback` |     Sim     | Enviar avaliação (1-5 estrelas) |

---

## Variáveis de Ambiente

| Variável              | Descrição                                  | Padrão                                        |
| --------------------- | ------------------------------------------ | --------------------------------------------- |
| `PORT`                | Porta do servidor backend                  | `3001`                                        |
| `JWT_SECRET`          | Chave secreta para tokens JWT              | —                                             |
| `JWT_EXPIRES_IN`      | Tempo de expiração do token                | `24h`                                         |
| `CORS_ORIGINS`        | Origens permitidas (separadas por vírgula) | `http://localhost:3000,http://localhost:3001` |
| `NEXT_PUBLIC_API_URL` | URL da API no frontend                     | `http://localhost:3001/api`                   |

---

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Build do shared (necessário antes de rodar backend/frontend)
npm run build -w shared

# Desenvolvimento
npm run start:dev -w backend
npm run dev -w frontend

# Build de produção
npm run build -w frontend
npm run build -w backend

# Lint
npm run lint -w frontend
```

---

## Melhorias Futuras

- [x] Banco de dados real via Prisma ORM (PostgreSQL) — substituiu o armazenamento in-memory
- [x] Hashing de senhas com scrypt (salt único + parâmetros versionados no hash)
- [x] Rate limiting nas rotas de auth com `@nestjs/throttler`
- [x] Headers de segurança da API com `helmet`
- [x] Log de auditoria de autenticação (registro, login, logout)
- [ ] Testes unitários e de integração (Jest)
- [ ] Integração com modelo de IA real para respostas
- [ ] Alterar avaliação de resposta (`PATCH /api/feedback`)
- [ ] Deploy automatizado (CI/CD)
- [ ] Página de recuperação de senha
- [ ] Perfil do usuário com upload de avatar
