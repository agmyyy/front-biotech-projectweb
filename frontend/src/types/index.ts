import type {
  User as SharedUser,
  SearchInput as SharedSearchInput,
  SearchResponse as SharedSearchResponse,
  FeedbackInput as SharedFeedbackInput,
} from "@shared/schemas";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  rating?: { score: number } | null;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type SearchRequest = SharedSearchInput;
// searchId é o id da mensagem do assistente, usado para avaliar a resposta
export type SearchResponse = SharedSearchResponse & { searchId?: string };
export type FeedbackRating = SharedFeedbackInput;
export type User = SharedUser;

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface SidebarState {
  isCollapsed: boolean;
  activeSessionId?: string;
}

