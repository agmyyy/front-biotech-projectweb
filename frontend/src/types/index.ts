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

export interface SearchRequest {
  query: string;
  sessionId?: string;
}

export interface SearchResponse {
  summary: string;
  suggestions: string[];
  justifications: string[];
  sources: string[];
  clarifications?: string[];
  sessionId: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface FeedbackRating {
  rating: number;
  searchId: string;
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
