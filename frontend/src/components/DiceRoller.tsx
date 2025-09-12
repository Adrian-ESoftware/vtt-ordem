'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface DiceRollerProps {
  tableId: string;
}

export function DiceRoller({ tableId }: DiceRollerProps) {
  const [expression, setExpression] = useState('1d20');
  const [isRolling, setIsRolling] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRoll = async (rollExpression?: string) => {
    const expr = rollExpression || expression;
    if (!expr.trim()) return;

    setIsRolling(true);
    try {
      // For now, calculate dice locally since backend doesn't support it yet
      const result = calculateDiceRoll(expr);
      console.log(`🎲 Rolled ${expr}: ${result.total} (${result.breakdown})`);
      
      // Try to send to API (will currently be mocked)
      await api.rollDice(tableId, expr);
      
      setExpression('1d20'); // Reset to default after roll
    } catch (error) {
      console.error('Failed to roll dice:', error);
    } finally {
      setIsRolling(false);
    }
  };

  // Simple dice calculator for local functionality
  const calculateDiceRoll = (expr: string) => {
    // Basic dice notation parser (simplified)
    const cleanExpr = expr.toLowerCase().replace(/\s/g, '');
    
    // Handle basic patterns like 1d20, 3d6+2, etc.
    const dicePattern = /(\d*)d(\d+)([+-]\d+)?/g;
    let total = 0;
    let breakdown = '';
    
    let match;
    while ((match = dicePattern.exec(cleanExpr)) !== null) {
      const count = parseInt(match[1] || '1');
      const sides = parseInt(match[2]);
      const modifier = match[3] ? parseInt(match[3]) : 0;
      
      const rolls = [];
      for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
      }
      
      const rollSum = rolls.reduce((sum, roll) => sum + roll, 0);
      const subtotal = rollSum + modifier;
      total += subtotal;
      
      breakdown += `[${rolls.join('+')}]${modifier !== 0 ? `${modifier >= 0 ? '+' : ''}${modifier}` : ''} `;
    }
    
    return { total, breakdown: breakdown.trim() };
  };

  const quickRolls = [
    { label: 'd4', expression: '1d4' },
    { label: 'd6', expression: '1d6' },
    { label: 'd8', expression: '1d8' },
    { label: 'd10', expression: '1d10' },
    { label: 'd12', expression: '1d12' },
    { label: 'd20', expression: '1d20' },
    { label: 'd100', expression: '1d100' },
  ];

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        🎲 Dice Roller
      </button>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 min-w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">🎲 Dice Roller</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>

      {/* Custom Expression */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Custom Expression
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="e.g., 1d20+5, 3d6, 2d8+1d4"
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRoll();
              }
            }}
          />
          <button
            onClick={() => handleRoll()}
            disabled={isRolling || !expression.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            {isRolling ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Roll'
            )}
          </button>
        </div>
        <div className="mt-1 text-xs text-gray-400">
          Examples: 1d20+5, 3d6, 2d8+1d4, 1d20+3+2
        </div>
      </div>

      {/* Quick Rolls */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Quick Rolls
        </label>
        <div className="grid grid-cols-4 gap-2">
          {quickRolls.map((roll) => (
            <button
              key={roll.expression}
              onClick={() => handleRoll(roll.expression)}
              disabled={isRolling}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
            >
              {roll.label}
            </button>
          ))}
        </div>
      </div>

      {/* Common Modifiers */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Common D20 Rolls
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Advantage', expression: '2d20kh1' },
            { label: 'Disadvantage', expression: '2d20kl1' },
            { label: 'D20 + 5', expression: '1d20+5' },
            { label: 'D20 + 10', expression: '1d20+10' },
          ].map((roll) => (
            <button
              key={roll.expression}
              onClick={() => handleRoll(roll.expression)}
              disabled={isRolling}
              className="px-3 py-2 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
            >
              {roll.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}