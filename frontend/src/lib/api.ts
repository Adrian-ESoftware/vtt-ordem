/**
 * API utilities for VTT Frontend
 */

const API_BASE_URL = 'http://localhost:8000';

export interface Token {
  id: string;
  name: string;
  x: number;
  y: number;
  color?: string;
  locked?: boolean;
}

export interface Table {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DiceRoll {
  expression: string;
  result: number;
  breakdown: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  message_type: string;
  payload: any;
  timestamp: string;
  user?: string;
}

export interface TableSnapshot {
  tokens: Record<string, Token>;
  chat: ChatMessage[];
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new ApiError(response.status, `API Error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Health check
  async getHealth(): Promise<{ ok: boolean }> {
    return fetchApi<{ ok: boolean }>('/health');
  },

  // Tables
  async createTable(name: string): Promise<Table> {
    return fetchApi<Table>('/tables', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async getTable(id: number | string): Promise<Table> {
    return fetchApi<Table>(`/tables/${id}`);
  },

  async getTables(): Promise<Table[]> {
    return fetchApi<Table[]>('/tables');
  },

  async deleteTable(id: number): Promise<void> {
    await fetchApi(`/tables/${id}`, {
      method: 'DELETE',
    });
  },

  // Table snapshot
  async getTableSnapshot(tableId: number | string): Promise<TableSnapshot> {
    return fetchApi<TableSnapshot>(`/tables/${tableId}/snapshot`);
  },

  // Tokens
  async createToken(tableId: number | string, token: Omit<Token, 'id'>): Promise<Token> {
    return fetchApi<Token>(`/tables/${tableId}/tokens`, {
      method: 'POST',
      body: JSON.stringify(token),
    });
  },

  async updateToken(tableId: number | string, tokenId: string, updates: Partial<Token>): Promise<Token> {
    return fetchApi<Token>(`/tables/${tableId}/tokens/${tokenId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteToken(tableId: number | string, tokenId: string): Promise<void> {
    await fetchApi(`/tables/${tableId}/tokens/${tokenId}`, {
      method: 'DELETE',
    });
  },

  async getTokens(tableId: number | string): Promise<Token[]> {
    return fetchApi<Token[]>(`/tables/${tableId}/tokens`);
  },

  // Dice rolls
  async rollDice(tableId: number | string, expression: string): Promise<DiceRoll> {
    return fetchApi<DiceRoll>(`/tables/${tableId}/rolls`, {
      method: 'POST',
      body: JSON.stringify({ expression }),
    });
  },

  // Chat
  async getChat(tableId: number | string): Promise<ChatMessage[]> {
    return fetchApi<ChatMessage[]>(`/tables/${tableId}/chat`);
  },
};

// Debounce utility for API calls
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}