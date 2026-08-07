export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  rating?: number;
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
  type: "chunk" | "done" | "error";
  content?: string;
  sources?: string[];
  suggestions?: string[];
  justifications?: string[];
  clarifications?: string[];
  sessionId?: string;
  message?: string;
}
