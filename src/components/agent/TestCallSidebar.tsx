import React from 'react';
import { Mic } from 'lucide-react';

interface TestCallSidebarProps {
  isCallActive: boolean;
  onToggleCall: () => void;
}

export function TestCallSidebar({ isCallActive, onToggleCall }: TestCallSidebarProps) {
  return (
    <div className="w-60 border-l border-gray-200 bg-white p-6">
      <div className="flex flex-col items-center">
        <div className="relative mb-6">
          <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center">
            <Mic className="text-white" size={40} />
          </div>
          {isCallActive && (
            <div className="absolute inset-0 animate-pulse">
              <div className="w-32 h-32 bg-blue-400 rounded-full opacity-50"></div>
            </div>
          )}
        </div>

        <div className="space-y-4 w-full">
          <button
            onClick={onToggleCall}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
              isCallActive 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isCallActive ? 'End Test Call' : 'Test your agent'}
          </button>
        </div>
      </div>
    </div>
  );
}