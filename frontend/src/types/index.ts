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
  rating?: number;
  suggestions?: string[];
  justifications?: string[];
  sources?: string[];
  clarifications?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type SearchRequest = SharedSearchInput;
export type SearchResponse = SharedSearchResponse;
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

export interface StreamChunk {
  type:
    | "chunk"
    | "done"
    | "error"
    | "suggestion_chunk"
    | "suggestion_done"
    | "justification_chunk"
    | "justification_done"
    | "source_chunk"
    | "source_done";
  content?: string;
  sources?: string[];
  suggestions?: string[];
  justifications?: string[];
  clarifications?: string[];
  sessionId?: string;
  message?: string;
}
