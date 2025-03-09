import React from 'react';

interface WelcomeMessageProps {
  message: string;
  onChange: (message: string) => void;
}

export function WelcomeMessage({ message, onChange }: WelcomeMessageProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">Begin Message</label>
      <textarea
        value={message}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg h-20 focus:ring-2 focus:ring-blue-500"
        placeholder="Enter begin message"
      />
    </div>
  );
}
