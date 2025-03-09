import React from 'react';
import { ChevronDown } from 'lucide-react';
import { languages } from '../../config/languages';

interface Voice {
  voice_id: string;
  name: string;
  provider: string;
  model?: string;
  preview_url?: string;
  language?: string;
  category?: string;
}

interface VoiceLanguageSelectorProps {
  voices: Voice[];
  selectedVoiceId: string;
  selectedLanguage: string;
  onVoiceChange: (voice: {
    voice_id: string;
    provider: string;
    model?: string;
  }) => void;
  onLanguageChange: (language: string) => void;
}

export function VoiceLanguageSelector({
  voices,
  selectedVoiceId,
  selectedLanguage,
  onVoiceChange,
  onLanguageChange,
}: VoiceLanguageSelectorProps) {
  // Filter to only show ElevenLabs voices
  const elevenLabsVoices = voices.filter(
    (voice) => voice.provider === 'elevenlabs'
  );

  return (
    <div className="flex items-center gap-4">
      <div className="flex-[1.425]">
        <div className="relative">
          <div className="flex items-center space-x-2">
            <img
              src={`https://ui-avatars.com/api/?name=${
                elevenLabsVoices.find((v) => v.voice_id === selectedVoiceId)
                  ?.name || 'Agent'
              }`}
              className="w-6 h-6 rounded-full"
              alt="Voice avatar"
            />
            <select
              value={selectedVoiceId}
              onChange={(e) => {
                const selectedVoice = elevenLabsVoices.find(
                  (v) => v.voice_id === e.target.value
                );
                if (selectedVoice) {
                  onVoiceChange({
                    voice_id: selectedVoice.voice_id,
                    provider: selectedVoice.provider,
                    model:
                      selectedVoice.provider === 'elevenlabs'
                        ? 'eleven_turbo_v2_5'
                        : undefined,
                  });
                }
              }}
              className="w-full pl-2 pr-8 py-[0.4375rem] border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="">Select a voice</option>
              {elevenLabsVoices.map((voice) => (
                <option key={voice.voice_id} value={voice.voice_id}>
                  {voice.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-[calc(50%-1px)] transform -translate-y-1/2 text-gray-400"
              size={16}
            />
          </div>
        </div>
      </div>

      <div className="flex-[1.425]">
        <div className="relative">
          <div className="flex items-center space-x-2">
            {languages.find((l) => l.code === selectedLanguage)?.flag && (
              <span className="text-lg">
                {languages.find((l) => l.code === selectedLanguage)?.flag}
              </span>
            )}
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="w-full pl-2 pr-8 py-[0.4375rem] border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                  {lang.region ? ` (${lang.region})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-[calc(50%-1px)] transform -translate-y-1/2 text-gray-400"
              size={16}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
