'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { Token, ChatMessage, TableSnapshot } from '@/types';

interface UseRoomDocOptions {
  roomId: string;
  initialSnapshot?: TableSnapshot;
}

interface RoomDocHelpers {
  // Read helpers
  getTokens: () => Record<string, Token>;
  getChat: () => ChatMessage[];
  getToken: (id: string) => Token | undefined;
  
  // State
  doc: Y.Doc;
  provider: WebsocketProvider | null;
  isConnected: boolean;
  
  // Event handlers
  onTokensChange: (callback: (tokens: Record<string, Token>) => void) => () => void;
  onChatChange: (callback: (chat: ChatMessage[]) => void) => () => void;
}

export function useRoomDoc({ roomId, initialSnapshot }: UseRoomDocOptions): RoomDocHelpers {
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Get WebSocket URL from environment
  const getWebSocketUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    
    const wsUrl = process.env.NEXT_PUBLIC_SYNC_WS || 
                  `ws://${window.location.hostname}:1234`;
    return wsUrl;
  }, []);

  // Initialize Y.Doc
  useEffect(() => {
    if (!roomId) return;

    const doc = new Y.Doc();
    docRef.current = doc;

    return () => {
      doc.destroy();
      docRef.current = null;
    };
  }, [roomId]);

  // Hydrate with initial snapshot
  useEffect(() => {
    if (!docRef.current || !initialSnapshot || isHydrated) return;

    const doc = docRef.current;
    const tokensMap = doc.getMap('tokens');
    const chatArray = doc.getArray('chat');

    doc.transact(() => {
      // Clear existing data
      tokensMap.clear();
      chatArray.delete(0, chatArray.length);

      // Hydrate tokens
      Object.entries(initialSnapshot.tokens).forEach(([id, token]) => {
        tokensMap.set(id, token);
      });

      // Hydrate chat
      initialSnapshot.chat.forEach((message) => {
        chatArray.push([message]);
      });
    });

    setIsHydrated(true);
  }, [initialSnapshot, isHydrated]);

  // Setup WebSocket provider
  useEffect(() => {
    if (!docRef.current || !roomId) return;

    const doc = docRef.current;
    const wsUrl = getWebSocketUrl();
    
    if (!wsUrl || typeof window === 'undefined') return;

    try {
      const provider = new WebsocketProvider(wsUrl, roomId, doc, {
        params: { protocol: 'yjs' }
      });

      providerRef.current = provider;

      // Connection status handlers
      provider.on('status', (event: { status: string }) => {
        setIsConnected(event.status === 'connected');
      });

      provider.on('connection-close', () => {
        setIsConnected(false);
      });

      provider.on('connection-error', (event: Event) => {
        console.warn('WebSocket connection error:', event);
        setIsConnected(false);
      });

      return () => {
        provider.destroy();
        providerRef.current = null;
      };
    } catch (error) {
      console.warn('Failed to create WebSocket provider:', error);
      setIsConnected(false);
    }
  }, [roomId, getWebSocketUrl]);

  // Read helpers
  const getTokens = useCallback((): Record<string, Token> => {
    if (!docRef.current) return {};
    const tokensMap = docRef.current.getMap('tokens');
    const tokens: Record<string, Token> = {};
    tokensMap.forEach((token, id) => {
      tokens[id] = token as Token;
    });
    return tokens;
  }, []);

  const getChat = useCallback((): ChatMessage[] => {
    if (!docRef.current) return [];
    const chatArray = docRef.current.getArray('chat');
    return chatArray.toArray() as ChatMessage[];
  }, []);

  const getToken = useCallback((id: string): Token | undefined => {
    if (!docRef.current) return undefined;
    const tokensMap = docRef.current.getMap('tokens');
    return tokensMap.get(id) as Token | undefined;
  }, []);

  // Event handlers for reactive updates
  const onTokensChange = useCallback((callback: (tokens: Record<string, Token>) => void) => {
    if (!docRef.current) return () => {};

    const tokensMap = docRef.current.getMap('tokens');
    const handler = () => {
      callback(getTokens());
    };

    tokensMap.observe(handler);
    
    return () => {
      tokensMap.unobserve(handler);
    };
  }, [getTokens]);

  const onChatChange = useCallback((callback: (chat: ChatMessage[]) => void) => {
    if (!docRef.current) return () => {};

    const chatArray = docRef.current.getArray('chat');
    const handler = () => {
      callback(getChat());
    };

    chatArray.observe(handler);
    
    return () => {
      chatArray.unobserve(handler);
    };
  }, [getChat]);

  return {
    doc: docRef.current!,
    provider: providerRef.current,
    isConnected,
    getTokens,
    getChat,
    getToken,
    onTokensChange,
    onChatChange,
  };
}