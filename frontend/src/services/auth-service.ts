import { apiClient } from "./api-client";
import type { User } from "@/types";

// O token agora vive em cookie HttpOnly definido pelo servidor, então o front recebe apenas o usuário
export interface AuthResponse {
  user: User;
}

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/register", data);

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error("Falha ao criar conta");
    }

    return response.data;
  },

  async login(data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", data);

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error("Falha ao fazer login");
    }

    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>("/auth/profile");

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error("Usuário não encontrado");
    }

    return response.data;
  },

  // Retorna false quando o servidor não confirmou o logout; sem essa confirmação o cookie continuaria válido
  async logout(): Promise<boolean> {
    const response = await apiClient.post("/auth/logout", {});

    if (response.error) {
      return false;
    }

    try {
      localStorage.removeItem("biotech_user");
    } catch {
      // localStorage indisponível
    }

    return true;
  },
};
