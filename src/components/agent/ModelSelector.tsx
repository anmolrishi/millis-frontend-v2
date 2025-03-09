import React from 'react';
import { ChevronDown } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onChange: (model: string) => void;
}

const models = [
  { id: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo' },
  { id: 'gpt-4-turbo', name: 'gpt-4-turbo' },
  { id: 'gpt-4o', name: 'gpt-4o' },
  { id: 'gpt-4o-mini', name: 'gpt-4o-mini' },
  { id: 'llama-3-70b', name: 'llama-3-70b' },
  { id: 'llama-3-1-8b', name: 'llama-3-1-8b' },
  { id: 'llama-3-1-70b', name: 'llama-3-1-70b' },
  { id: 'llama-3-1-405b', name: 'llama-3-1-405b' },
  { id: 'mistral-large-2407', name: 'mistral-large-2407' },
  { id: 'deepseek-v3', name: 'deepseek-v3' }
];

export function ModelSelector({ selectedModel, onChange }: ModelSelectorProps) {
  return (
    <div className="relative">
      <select
        value={selectedModel}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-3 pr-10 py-[0.4375rem] border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-3 top-[calc(50%-1px)] transform -translate-y-1/2 text-gray-400"
        size={16}
      />
    </div>
  );
}