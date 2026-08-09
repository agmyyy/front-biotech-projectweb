import { apiClient } from "./api-client";
import type { User } from "@/types";

export interface AuthResponse {
  user: User;
  token: string;
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

    apiClient.setToken(response.data.token);

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

    apiClient.setToken(response.data.token);

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

  logout() {
    apiClient.setToken(null);
  },

  setToken(token: string) {
    apiClient.setToken(token);
  },

  getToken(): string | null {
    return apiClient.getToken();
  },
};
