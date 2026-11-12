import type { ApiResponse } from '@/types';
import { handleUnauthorizedSession } from "./auth-session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
  details?: unknown;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("biotech_token");
        localStorage.removeItem("biotech_user");
      } catch {
        // O armazenamento local pode estar desabilitado no navegador
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    // credentials "include" envia o cookie HttpOnly do JWT, mesmo em requisições cross-origin
    const config: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      const responseData: unknown = await response.json().catch(() => ({}));
      const data = responseData as ApiErrorResponse;

      if (response.status === 401) {
        const isPublicAuthRequest =
          endpoint === "/auth/login" ||
          endpoint === "/auth/register" ||
          endpoint === "/auth/logout";

        if (!isPublicAuthRequest) {
          await handleUnauthorizedSession();
        }

        return {
          error: isPublicAuthRequest
            ? typeof data.message === "string"
              ? data.message
              : Array.isArray(data.message)
                ? data.message.join(", ")
                : "Credenciais inválidas"
            : "Sessão expirada. Faça login novamente.",
          status: 401,
        };
      }

      if (!response.ok) {
        const message =
          (typeof data.message === "string"
            ? data.message
            : Array.isArray(data.message)
              ? data.message.join(", ")
              : null) ||
          data.error ||
          (Array.isArray(data.details) ? data.details.join(", ") : null) ||
          "Erro na requisição";
        return {
          error: message,
          status: response.status,
        };
      }

      return {
        data: responseData as T,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        status: 500,
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
