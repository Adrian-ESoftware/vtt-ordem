'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage, DiceRoll, TextMessage } from '@/types';

interface ChatDisplayProps {
  messages: ChatMessage[];
}

export function ChatDisplay({ messages }: ChatDisplayProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    if (message.t === 'roll') {
      const payload = message.payload as DiceRoll;
      const { expression, result, breakdown, timestamp } = payload;
      
      return (
        <div key={`${message.at}-${index}`} className="mb-3 p-3 bg-blue-900 bg-opacity-30 rounded border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 text-sm">🎲</span>
              <span className="text-white font-medium">Dice Roll</span>
            </div>
            <span className="text-gray-400 text-xs">
              {formatTimestamp(timestamp || message.at)}
            </span>
          </div>
          
          <div className="text-sm">
            <div className="text-gray-300">
              <span className="font-mono">{expression}</span>
            </div>
            
            {breakdown && breakdown !== result?.toString() && (
              <div className="text-gray-400 text-xs mt-1">
                {breakdown}
              </div>
            )}
            
            <div className="text-white font-bold text-lg mt-1">
              Result: {result}
            </div>
          </div>
        </div>
      );
    }

    if (message.t === 'msg') {
      const payload = message.payload as TextMessage;
      const { text, user } = payload;
      
      return (
        <div key={`${message.at}-${index}`} className="mb-3 p-3 bg-gray-800 bg-opacity-50 rounded">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white font-medium">
              {user || 'Unknown User'}
            </span>
            <span className="text-gray-400 text-xs">
              {formatTimestamp(message.at)}
            </span>
          </div>
          
          <div className="text-gray-300 text-sm">
            {text}
          </div>
        </div>
      );
    }

    // Fallback for unknown message types
    return (
      <div key={`${message.at}-${index}`} className="mb-3 p-3 bg-gray-700 bg-opacity-50 rounded">
        <div className="flex items-center justify-between mb-1">
          <span className="text-yellow-400 text-sm">Unknown Message</span>
          <span className="text-gray-400 text-xs">
            {formatTimestamp(message.at)}
          </span>
        </div>
        
        <pre className="text-gray-300 text-xs overflow-x-auto">
          {JSON.stringify(message.payload, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-medium text-white">Chat & Rolls</h3>
        <div className="text-gray-400 text-sm">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🎲</div>
            <div>No messages yet</div>
            <div className="text-sm mt-1">
              Roll some dice to get started!
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Future: Input for sending messages */}
      <div className="p-4 border-t border-gray-700 bg-gray-800 bg-opacity-50">
        <div className="text-gray-500 text-sm text-center">
          Chat messages coming soon...
        </div>
      </div>
    </div>
  );
}