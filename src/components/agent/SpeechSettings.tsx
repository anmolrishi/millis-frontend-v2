import React, { useState } from 'react';
import { Plus, Settings, Info } from 'lucide-react';
import { Switch } from '../ui/Switch';
import { Slider } from '../ui/Slider';

interface PronunciationEntry {
  word: string;
  alphabet: string;
  phoneme: string;
}

interface SpeechSettingsProps {
  ambientSound?: string;
  responsiveness?: number;
  interruptionSensitivity?: number;
  enableBackchannel?: boolean;
  backchannelWords?: string[];
  pronunciationDictionary?: PronunciationEntry[];
  onUpdate: (key: string, value: any) => void;
}

const backgroundSoundOptions = [
  { value: 'none', label: 'None' },
  { value: 'coffee-shop', label: 'Coffee Shop' },
  { value: 'office', label: 'Office' },
  { value: 'restaurant', label: 'Restaurant' },
];

export function SpeechSettings({
  ambientSound = 'none',
  responsiveness = 0.7,
  interruptionSensitivity = 1,
  enableBackchannel = true,
  backchannelWords = ['yeah', 'uh-huh'],
  pronunciationDictionary = [],
  onUpdate,
}: SpeechSettingsProps) {
  const [showAddPronunciation, setShowAddPronunciation] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newPhoneme, setNewPhoneme] = useState('');
  const interruptionValue =
    typeof interruptionSensitivity === 'boolean'
      ? 1
      : interruptionSensitivity || 1;

  const handleAddPronunciation = () => {
    if (newWord && newPhoneme) {
      const newEntry = {
        word: newWord,
        alphabet: 'ipa',
        phoneme: newPhoneme,
      };
      onUpdate('pronunciation_dictionary', [
        ...(pronunciationDictionary || []),
        newEntry,
      ]);
      setNewWord('');
      setNewPhoneme('');
      setShowAddPronunciation(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Background Sound */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Background sound</label>
        <div className="flex items-center space-x-2">
          <select
            value={ambientSound}
            onChange={(e) => onUpdate('ambient_sound', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
          >
            {backgroundSoundOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Responsiveness */}
      <div className="space-y-2">
        <div>
          <h4 className="text-sm font-medium">Responsiveness</h4>
          <div className="flex items-center justify-between">
            <Slider
              value={[responsiveness]}
              onValueChange={(value) => onUpdate('responsiveness', value[0])}
              min={0}
              max={1}
              step={0.1}
              className="w-[200px]"
            />
            <span className="text-sm text-gray-600 ml-4">
              {responsiveness.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Interruption Sensitivity */}
      <div className="space-y-2">
        <div>
          <h4 className="text-sm font-medium">Interruption sensitivity</h4>
          <p className="text-xs text-gray-500">
            Control how sensitive AI can be interrupted by human speech
          </p>
          <div className="flex items-center justify-between">
            <Slider
              value={[interruptionValue]}
              onValueChange={(value) =>
                onUpdate('interruption_sensitivity', value[0])
              }
              min={0}
              max={1}
              step={0.1}
              className="w-[200px]"
            />
            <span className="text-sm text-gray-600 ml-4">
              {interruptionValue.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Enable Backchanneling */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Enable backchanneling</h4>
            <p className="text-xs text-gray-500">
              Enables the agent to use affirmations like 'yeah' or 'uh-huh'
              during conversations, indicating active listening and engagement.
            </p>
          </div>
          <Switch
            checked={enableBackchannel}
            onCheckedChange={(checked) =>
              onUpdate('enable_backchannel', checked)
            }
          />
        </div>
        {enableBackchannel && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-2">Backchannel words:</div>
            <div className="flex flex-wrap gap-2">
              {backchannelWords.map((word, index) => (
                <div
                  key={index}
                  className="bg-white px-2 py-1 rounded text-sm border"
                >
                  {word}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pronunciation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Pronunciation</h4>
            <p className="text-xs text-gray-500">
              Guide the model to pronounce a word, name, or phrase in a specific
              way.{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Learn more
              </a>
            </p>
          </div>
          <button
            onClick={() => setShowAddPronunciation(true)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
          >
            <Plus size={16} />
            <span className="text-sm">Add</span>
          </button>
        </div>

        {/* Pronunciation Dictionary */}
        {pronunciationDictionary.length > 0 && (
          <div className="mt-2 space-y-2">
            {pronunciationDictionary.map((entry, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded-lg text-sm">
                <div className="font-medium">{entry.word}</div>
                <div className="text-gray-500">{entry.phoneme}</div>
              </div>
            ))}
          </div>
        )}

        {/* Add Pronunciation Form */}
        {showAddPronunciation && (
          <div className="mt-2 p-3 border rounded-lg space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Word</label>
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                IPA Phoneme
              </label>
              <input
                type="text"
                value={newPhoneme}
                onChange={(e) => setNewPhoneme(e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddPronunciation(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPronunciation}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
