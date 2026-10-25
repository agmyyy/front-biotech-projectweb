interface Session {
  id: string;
  title: string;
  messages: any[];
  createdAt: string;
  updatedAt: string;
}

class MockStore {
  private sessions: Session[] = [
    {
      id: "session-1",
      title: "Sessão Inicial",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  list(): Session[] {
    return this.sessions;
  }

  find(id: string): Session | undefined {
    return this.sessions.find((s) => s.id === id);
  }

  create(title: string): Session {
    const session: Session = {
      id: crypto.randomUUID(),
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.sessions.push(session);
    return session;
  }

  update(
    id: string,
    patch: { title?: string; messages?: any[] },
  ): Session | undefined {
    const idx = this.sessions.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;

    this.sessions[idx] = {
      ...this.sessions[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return this.sessions[idx];
  }

  delete(id: string): boolean {
    const idx = this.sessions.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.sessions.splice(idx, 1);
    return true;
  }
}

export const mockStore = new MockStore();
