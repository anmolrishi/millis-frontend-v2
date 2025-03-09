import React from 'react';

interface PromptEditorProps {
  prompt: string;
  onChange: (prompt: string) => void;
}

export function PromptEditor({ prompt, onChange }: PromptEditorProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">Prompt</label>
      <textarea
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg h-[300px] focus:ring-2 focus:ring-blue-500"
        placeholder="Enter agent prompt"
      />
    </div>
  );
}
