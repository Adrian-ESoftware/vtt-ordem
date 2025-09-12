'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRoomDoc } from '@/hooks/useRoomDoc';
import { api } from '@/lib/api';
import { CanvasTokens } from '@/components/CanvasTokens';
import { ChatDisplay } from '@/components/ChatDisplay';
import type { TableSnapshot, TableInfo, Token, ChatMessage } from '@/types';

export default function TablePage() {
  const params = useParams();
  const tableId = params.id as string;
  
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<TableSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Reactive state from Yjs
  const [tokens, setTokens] = useState<Record<string, Token>>({});
  const [chat, setChat] = useState<ChatMessage[]>([]);

  // Initialize room doc after getting initial data
  const roomDoc = useRoomDoc({
    roomId: tableId,
    initialSnapshot: initialSnapshot || undefined,
  });

  // Get initial data
  useEffect(() => {
    const getInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get table info first
        let tableInfoRes;
        try {
          tableInfoRes = await api.getTable(tableId);
          setTableInfo({ ...tableInfoRes, id: tableInfoRes.id.toString() });
        } catch (error: unknown) {
          // If table doesn't exist (404), create it
          if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 404) {
            console.log('Table not found, creating new table...');
            try {
              const newTable = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/tables`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: `Table ${tableId}` })
              });
              
              if (newTable.ok) {
                const tableData = await newTable.json();
                setTableInfo({ ...tableData, id: tableData.id.toString() });
              } else {
                throw new Error('Failed to create table');
              }
            } catch (createError) {
              console.error('Failed to create table:', createError);
              setError('Failed to create or access table');
              return;
            }
          } else {
            throw error;
          }
        }

        // Get table snapshot (currently returns empty state)
        try {
          const snapshotRes = await api.getTableSnapshot(tableId);
          setInitialSnapshot({
            tokens: snapshotRes.tokens,
            chat: snapshotRes.chat.map(msg => ({
              t: msg.message_type as "roll" | "msg",
              payload: msg.payload,
              at: new Date(msg.timestamp).getTime(),
              id: msg.id,
              user: msg.user
            }))
          });
        } catch (snapshotError) {
          console.warn('Failed to get table snapshot, using empty state:', snapshotError);
          setInitialSnapshot({
            tokens: {},
            chat: [],
          });
        }
      } catch (err) {
        console.error('Error getting initial data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load table');
      } finally {
        setLoading(false);
      }
    };

    if (tableId) {
      getInitialData();
    }
  }, [tableId]);

  // Subscribe to Yjs changes
  useEffect(() => {
    if (!roomDoc.doc) return;

    const unsubscribeTokens = roomDoc.onTokensChange(setTokens);
    const unsubscribeChat = roomDoc.onChatChange(setChat);

    // Get initial state
    setTokens(roomDoc.getTokens());
    setChat(roomDoc.getChat());

    return () => {
      unsubscribeTokens();
      unsubscribeChat();
    };
  }, [roomDoc.doc]); // Only depend on doc, not the entire roomDoc object

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading table...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {tableInfo?.name || `Table ${tableId}`}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <div className={`flex items-center gap-2 ${roomDoc.isConnected ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${roomDoc.isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                {roomDoc.isConnected ? 'Connected' : 'Disconnected'}
              </div>
              <div className="text-gray-400 text-sm">
                {Object.keys(tokens).length} tokens
              </div>
            </div>
          </div>
          
          {/* Dice Roller */}
          {/* Dice Roller - Coming Soon */}
          <div className="text-gray-400 text-sm">Dice Roller</div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <CanvasTokens 
            tableId={tableId}
            tokens={tokens}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Chat Display */}
          <div className="flex-1 overflow-hidden">
            <ChatDisplay messages={chat} />
          </div>
        </div>
      </div>
    </div>
  );
}