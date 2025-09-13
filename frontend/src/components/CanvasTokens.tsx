'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Token, DragState, CanvasViewport } from '@/types';

interface CanvasTokensProps {
  tableId: string;
  tokens: Record<string, Token>;
  roomDoc?: any; // Add roomDoc prop for Yjs integration
}

export function CanvasTokens({ tableId, tokens, roomDoc }: CanvasTokensProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [localTokens, setLocalTokens] = useState<Record<string, Token>>({});
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedToken: null,
    offset: { x: 0, y: 0 },
  });
  const [viewport] = useState<CanvasViewport>({
    x: 0,
    y: 0,
    zoom: 1,
  });
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  // Helper to update token position in Yjs
  const updateTokenInYjs = useCallback((tokenId: string, updates: Partial<Token>) => {
    if (!roomDoc?.doc) return;
    
    const tokensMap = roomDoc.doc.getMap('tokens');
    const currentToken = tokensMap.get(tokenId) as Token;
    if (currentToken) {
      tokensMap.set(tokenId, { ...currentToken, ...updates });
    }
  }, [roomDoc]);

  // Use Yjs tokens when available, otherwise use local state
  const activeTokens = Object.keys(tokens).length > 0 ? tokens : localTokens;

  // Debounced API call for token updates
  const debouncedUpdateToken = useCallback((tokenId: string, updates: Partial<Token>) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        await api.updateToken(tableId, tokenId, updates);
      } catch (error: any) {
        // Silently handle "Token not found" errors for local tokens
        if (error?.status === 404 && error?.message?.includes('Token not found')) {
          console.warn(`Token ${tokenId} not found on server, skipping update`);
          return;
        }
        console.error('Failed to update token:', error);
      }
    }, 100);
  }, [tableId]);

  // Handle token creation
  const handleCreateToken = useCallback(async () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Create token at center of canvas
    const x = (rect.width / 2 - viewport.x) / viewport.zoom;
    const y = (rect.height / 2 - viewport.y) / viewport.zoom;

    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    try {
      // Create token directly on server instead of using temporary local ID
      const newToken = await api.createToken(tableId, {
        name: `Token ${Object.keys(activeTokens).length + 1}`,
        x,
        y,
        color,
      });

      // Add to local state only if using local tokens
      if (Object.keys(tokens).length === 0) {
        setLocalTokens(prev => ({
          ...prev,
          [newToken.id]: newToken
        }));
      } else if (roomDoc?.doc) {
        // Add to Yjs for real-time sync
        const tokensMap = roomDoc.doc.getMap('tokens');
        tokensMap.set(newToken.id, newToken);
      }
    } catch (error) {
      console.error('Failed to create token:', error);
    }
  }, [tableId, activeTokens, viewport, tokens]);

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent, tokenId: string) => {
    e.stopPropagation();
    
    const token = activeTokens[tokenId];
    if (!token || token.locked) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = e.clientX;
    const clientY = e.clientY;
    const tokenX = token.x * viewport.zoom + viewport.x;
    const tokenY = token.y * viewport.zoom + viewport.y;

    setDragState({
      isDragging: true,
      draggedToken: tokenId,
      offset: {
        x: clientX - tokenX,
        y: clientY - tokenY,
      },
    });

    setSelectedToken(tokenId);
  }, [activeTokens, viewport]);

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.draggedToken) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - dragState.offset.x - viewport.x) / viewport.zoom;
      const y = (e.clientY - dragState.offset.y - viewport.y) / viewport.zoom;

      // Update Yjs state immediately for responsive UI and real-time sync
      if (Object.keys(tokens).length > 0 && dragState.draggedToken) {
        updateTokenInYjs(dragState.draggedToken, { x, y });
      }

      // Update local state immediately for responsive UI (fallback when no Yjs)
      if (Object.keys(tokens).length === 0 && dragState.draggedToken) {
        setLocalTokens(prev => {
          const tokenId = dragState.draggedToken!;
          return {
            ...prev,
            [tokenId]: {
              ...prev[tokenId],
              x,
              y
            }
          };
        });
      }

      // Update token position via API (debounced)
      if (dragState.draggedToken) {
        debouncedUpdateToken(dragState.draggedToken, { x, y });
      }
    };

    const handleMouseUp = () => {
      setDragState({
        isDragging: false,
        draggedToken: null,
        offset: { x: 0, y: 0 },
      });
    };

    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, viewport, debouncedUpdateToken, updateTokenInYjs, tokens]);

  // Handle token deletion
  const handleDeleteToken = useCallback(async (tokenId: string) => {
    try {
      await api.deleteToken(tableId, tokenId);
      if (selectedToken === tokenId) {
        setSelectedToken(null);
      }
      
      // Remove from local state if using local tokens
      if (Object.keys(tokens).length === 0) {
        setLocalTokens(prev => {
          const newState = { ...prev };
          delete newState[tokenId];
          return newState;
        });
      } else if (roomDoc?.doc) {
        // Remove from Yjs for real-time sync
        const tokensMap = roomDoc.doc.getMap('tokens');
        tokensMap.delete(tokenId);
      }
    } catch (error: any) {
      // Handle "Token not found" errors gracefully
      if (error?.status === 404 && error?.message?.includes('Token not found')) {
        console.warn(`Token ${tokenId} not found on server, removing from local state`);
        if (selectedToken === tokenId) {
          setSelectedToken(null);
        }
        if (Object.keys(tokens).length === 0) {
          setLocalTokens(prev => {
            const newState = { ...prev };
            delete newState[tokenId];
            return newState;
          });
        } else if (roomDoc?.doc) {
          // Remove from Yjs for real-time sync
          const tokensMap = roomDoc.doc.getMap('tokens');
          tokensMap.delete(tokenId);
        }
        return;
      }
      console.error('Failed to delete token:', error);
    }
  }, [tableId, selectedToken, tokens]);

  // Handle token lock toggle
  const handleToggleLock = useCallback(async (tokenId: string) => {
    const token = activeTokens[tokenId];
    if (!token) return;

    const updates = { locked: !token.locked };

    // Update local state immediately
    if (Object.keys(tokens).length === 0) {
      setLocalTokens(prev => ({
        ...prev,
        [tokenId]: {
          ...prev[tokenId],
          ...updates
        }
      }));
    } else {
      // Update Yjs for real-time sync
      updateTokenInYjs(tokenId, updates);
    }

    try {
      await api.updateToken(tableId, tokenId, updates);
    } catch (error: any) {
      // Handle "Token not found" errors gracefully
      if (error?.status === 404 && error?.message?.includes('Token not found')) {
        console.warn(`Token ${tokenId} not found on server, keeping local state`);
        return;
      }
      console.error('Failed to toggle token lock:', error);
      // Revert local state if API fails
      if (Object.keys(tokens).length === 0) {
        setLocalTokens(prev => ({
          ...prev,
          [tokenId]: {
            ...prev[tokenId],
            locked: !updates.locked
          }
        }));
      }
    }
  }, [tableId, activeTokens, tokens]);

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden">
      {/* Create Token Button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={handleCreateToken}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Criar Token
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full"
        style={{
          backgroundImage: `
            radial-gradient(circle, #374151 1px, transparent 1px)
          `,
          backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
          backgroundPosition: `${viewport.x % (20 * viewport.zoom)}px ${viewport.y % (20 * viewport.zoom)}px`,
        }}
      >
        {/* Tokens */}
        {Object.entries(activeTokens).map(([id, token]) => (
          <div
            key={id}
            className={`absolute w-12 h-12 rounded-full border-2 cursor-move transition-all duration-75 ${
              token.locked 
                ? 'border-gray-400 cursor-not-allowed' 
                : 'border-white hover:border-yellow-400'
            } ${
              selectedToken === id ? 'ring-2 ring-yellow-400' : ''
            }`}
            style={{
              left: token.x * viewport.zoom + viewport.x - 24,
              top: token.y * viewport.zoom + viewport.y - 24,
              backgroundColor: token.color || '#3b82f6',
              transform: dragState.draggedToken === id ? 'scale(1.1)' : 'scale(1)',
              zIndex: dragState.draggedToken === id ? 1000 : 1,
            }}
            onMouseDown={(e) => handleMouseDown(e, id)}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedToken(id);
            }}
          >
            {/* Token name */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white whitespace-nowrap bg-black bg-opacity-50 px-1 rounded">
              {token.name}
            </div>
            
            {/* Lock indicator */}
            {token.locked && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Token Controls */}
      {selectedToken && activeTokens[selectedToken] && (
        <div className="absolute top-16 left-4 bg-gray-800 border border-gray-600 rounded-lg p-4 min-w-48">
          <h3 className="text-sm font-medium text-white mb-2">
            {activeTokens[selectedToken].name}
          </h3>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleToggleLock(selectedToken)}
              className={`flex-1 px-3 py-1 text-xs rounded ${
                activeTokens[selectedToken].locked
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {activeTokens[selectedToken].locked ? 'Unlock' : 'Lock'}
            </button>
            
            <button
              onClick={() => handleDeleteToken(selectedToken)}
              className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Delete
            </button>
          </div>
          
          <button
            onClick={() => setSelectedToken(null)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-xs"
          >
            ×
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
        Use o botão "Criar Token" • Arraste para mover • Clique no token para selecioná-lo
      </div>

      {/* Connection Status */}
      <div className="absolute top-4 right-4 text-xs text-gray-400">
        {Object.keys(activeTokens).length} tokens loaded
      </div>
    </div>
  );
}