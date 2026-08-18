import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface MockChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  rating?: number;
  suggestions?: string[];
  justifications?: string[];
  sources?: string[];
  clarifications?: string[];
}

export interface MockSession {
  id: string;
  title: string;
  userId: string;
  messages: MockChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface MockQuery {
  id: string;
  query: string;
  sessionId: string;
  userId: string;
  summary?: string;
  suggestions: string[];
  justifications: string[];
  sources: string[];
  clarifications: string[];
  status: "pending" | "processing" | "completed" | "error";
  createdAt: string;
}

export interface MockFeedback {
  id: string;
  rating: number;
  searchId: string;
  userId: string;
  createdAt: string;
}

@Injectable()
export class MockService {
  private users: MockUser[] = [
    {
      id: "user-1",
      name: "Maria",
      email: "agmy@biotech.com",
      password: "senha123",
      avatarUrl: undefined,
      createdAt: new Date().toISOString(),
    },
    {
      id: "user-2",
      name: "Ana",
      email: "a@gmail.com",
      password: "senha321",
      avatarUrl: undefined,
      createdAt: new Date().toISOString(),
    },
  ];

  private sessions: MockSession[] = [
    {
      id: "session-1",
      title: "Sessão Inicial",
      userId: "user-1",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private queries: MockQuery[] = [];
  private feedbacks: MockFeedback[] = [];

  findAllUsers() {
    return this.users;
  }

  findUserByEmail(email: string) {
    return this.users.find((u) => u.email === email);
  }

  findUserById(id: string) {
    return this.users.find((u) => u.id === id);
  }

  createUser(data: Omit<MockUser, "id" | "createdAt">) {
    const user: MockUser = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    return user;
  }

  findAllSessions(userId: string) {
    return this.sessions.filter((s) => s.userId === userId);
  }

  findSessionById(id: string) {
    return this.sessions.find((s) => s.id === id);
  }

  createSession(data: { title: string; userId: string }) {
    const session: MockSession = {
      id: uuidv4(),
      title: data.title,
      userId: data.userId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.sessions.push(session);
    return session;
  }

  appendMessages(
    sessionId: string,
    newMessages: MockChatMessage[],
  ): MockSession | null {
    const idx = this.sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return null;
    this.sessions[idx] = {
      ...this.sessions[idx],
      messages: newMessages,
      updatedAt: new Date().toISOString(),
    };
    return this.sessions[idx];
  }

  updateSession(id: string, data: Partial<MockSession>) {
    const idx = this.sessions.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.sessions[idx] = {
      ...this.sessions[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.sessions[idx];
  }

  deleteSession(id: string) {
    const idx = this.sessions.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.sessions.splice(idx, 1);
    return true;
  }

  findAllQueries(userId: string, sessionId?: string) {
    let queries = this.queries.filter((q) => q.userId === userId);
    if (sessionId) {
      queries = queries.filter((q) => q.sessionId === sessionId);
    }
    return queries;
  }

  findQueryById(id: string) {
    return this.queries.find((q) => q.id === id);
  }

  createQuery(
    data: Omit<
      MockQuery,
      | "id"
      | "createdAt"
      | "suggestions"
      | "justifications"
      | "sources"
      | "clarifications"
      | "status"
    >,
  ) {
    const query: MockQuery = {
      id: uuidv4(),
      ...data,
      suggestions: [],
      justifications: [],
      sources: [],
      clarifications: [],
      status: "completed",
      createdAt: new Date().toISOString(),
    };
    this.queries.push(query);
    return query;
  }

  deleteQuery(id: string) {
    const idx = this.queries.findIndex((q) => q.id === id);
    if (idx === -1) return false;
    this.queries.splice(idx, 1);
    return true;
  }

  addClarification(queryId: string, clarification: string) {
    const query = this.findQueryById(queryId);
    if (!query) return null;
    query.clarifications.push(clarification);
    return query;
  }

  createFeedback(data: Omit<MockFeedback, "id" | "createdAt">) {
    const feedback: MockFeedback = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.feedbacks.push(feedback);
    return feedback;
  }

  findFeedbackBySearchId(searchId: string) {
    return this.feedbacks.filter((f) => f.searchId === searchId);
  }
}
