## Sobre o Projeto

O projeto é uma plataforma web que combina uma interface de chat intuitiva com um sistema multi-agente simulado para responder perguntas sobre biotecnologia. Os usuários podem realizar perguntas e receber respostas estruturadas contendo resumo, sugestões, justificativas e fontes de referência tudo com uma animação de typewriter em tempo real.

---

## Funcionalidades

- **Autenticação JWT** — Cadastro e login com tokens baseados em cookie
- **Chat Inteligente** — Interface de busca com respostas estruturadas (resumo, sugestões, justificativas, fontes)
- **Streaming com Typewriter** — Exibição progressiva da resposta com animação palavra por palavra
- **Gerenciamento de Sessões** — Criação, listagem e exclusão de sessões de conversa
- **Feedback com Estrelas** — Sistema de avaliação de respostas (1 a 5 estrelas)
- **Sidebar Colapsável** — Navegação lateral com histórico de conversas
- **Rotas Protegidas** — Middleware de autenticação no client-side
- **WebSocket Gateway** — Infraestrutura para comunicação em tempo real

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
|              | Socket.io                 | 4.8.0          |
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
│   └── src/
│       ├── auth/              # Módulo de autenticação (JWT)
│       ├── queries/           # Módulo de queries e sessões
│       ├── mas/               # Sistema Multi-Agente (mock)
│       ├── feedback/          # Módulo de feedback
│       ├── events/            # WebSocket Gateway
│       ├── database/          # Armazenamento in-memory
│       └── common/            # Guards, pipes, filters
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

| Método | Rota                 | Autenticado | Descrição                |
| ------ | -------------------- | :---------: | ------------------------ |
| `POST` | `/api/auth/register` |     Não     | Cadastro de usuário      |
| `POST` | `/api/auth/login`    |     Não     | Login do usuário         |
| `GET`  | `/api/auth/profile`  |     Sim     | Perfil do usuário logado |

### Queries

| Método   | Rota               | Autenticado | Descrição                                   |
| -------- | ------------------ | :---------: | ------------------------------------------- |
| `POST`   | `/api/queries`     |     Sim     | Enviar query e receber resposta estruturada |
| `GET`    | `/api/queries`     |     Sim     | Listar queries (filtro opcional por sessão) |
| `GET`    | `/api/queries/:id` |     Não     | Obter query por ID                          |
| `DELETE` | `/api/queries/:id` |     Não     | Excluir query                               |

### Sessões

| Método   | Rota                         | Autenticado | Descrição                    |
| -------- | ---------------------------- | :---------: | ---------------------------- |
| `GET`    | `/api/sessions`              |     Sim     | Listar sessões do usuário    |
| `GET`    | `/api/sessions/:id`          |     Sim     | Obter sessão por ID          |
| `POST`   | `/api/sessions`              |     Sim     | Criar nova sessão            |
| `PATCH`  | `/api/sessions/:id`          |     Sim     | Atualizar título da sessão   |
| `POST`   | `/api/sessions/:id/messages` |     Sim     | Adicionar mensagens à sessão |
| `DELETE` | `/api/sessions/:id`          |     Sim     | Excluir sessão               |

### Feedback

| Método | Rota                      | Autenticado | Descrição                       |
| ------ | ------------------------- | :---------: | ------------------------------- |
| `POST` | `/api/feedback`           |     Sim     | Enviar avaliação (1-5 estrelas) |
| `GET`  | `/api/feedback/:searchId` |     Não     | Obter feedback de uma query     |

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

- [ ] Integração com banco de dados real via Prisma ORM
- [ ] Hashing de senhas com bcrypt
- [ ] Conexão WebSocket no frontend para atualizações em tempo real
- [ ] Testes unitários e de integração (Jest)
- [ ] Integração com modelo de IA real para respostas
- [ ] Deploy automatizado (CI/CD)
- [ ] Página de recuperação de senha
- [ ] Perfil do usuário com upload de avatar
