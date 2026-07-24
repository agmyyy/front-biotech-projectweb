export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  rating?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchRequest {
  query: string;
  sessionId?: string;
}

export interface SearchResponse {
  searchId?: string;
  answer: string;
  sources?: string[];
  sessionId: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface FeedbackRating {
  rating: number;
  sessionId: string;
  messageId: string;
}

export interface SidebarState {
  isCollapsed: boolean;
  activeSessionId?: string;
}
