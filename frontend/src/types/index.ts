/**
 * Types and contracts for VTT Frontend
 */

export interface Token {
  id: string;
  name: string;
  x: number;
  y: number;
  color?: string;
  locked?: boolean;
}

export interface ChatMessage {
  t: "roll" | "msg";
  payload: DiceRoll | TextMessage | Record<string, unknown>;
  at: number;
  id?: string;
  user?: string;
}

export interface TextMessage {
  text: string;
  user?: string;
}

export interface DiceRoll {
  expression: string;
  result: number;
  breakdown: string;
  timestamp: number;
}

export interface TableSnapshot {
  tokens: Record<string, Token>;
  chat: Array<ChatMessage>;
  // Future: sheets, layers, initiative
}

export interface TableInfo {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateTokenRequest {
  name: string;
  x: number;
  y: number;
  color?: string;
}

export interface UpdateTokenRequest {
  name?: string;
  x?: number;
  y?: number;
  color?: string;
  locked?: boolean;
}

export interface DiceRollRequest {
  expression: string;
}

// Yjs helper types
export type YjsUpdateHandler = (update: Uint8Array) => void;
export type YjsAwarenessHandler = (states: Record<string, unknown>) => void;

// UI State types
export interface DragState {
  isDragging: boolean;
  draggedToken: string | null;
  offset: { x: number; y: number };
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}