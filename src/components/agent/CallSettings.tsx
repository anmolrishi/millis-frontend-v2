import React from 'react';
import { Switch } from '../ui/Switch';
import { Slider } from '../ui/Slider';

interface CallSettingsProps {
  voicemailDetection: boolean;
  endCallAfterSilence: number;
  maxCallDuration: number;
  beginMessageDelay: number;
  onUpdate: (key: string, value: any) => void;
}

export function CallSettings({
  voicemailDetection = false,
  endCallAfterSilence = 600000, // 10 minutes in ms
  maxCallDuration = 3600000, // 1 hour in ms
  beginMessageDelay = 1000, // 1 second in ms
  onUpdate
}: CallSettingsProps) {
  return (
    <div className="space-y-6 p-4">
      {/* Voicemail Detection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Voicemail Detection</h4>
            <p className="text-xs text-gray-500">Hang up or leave a voicemail if a voicemail is detected</p>
          </div>
          <Switch
            checked={voicemailDetection}
            onCheckedChange={(checked) => onUpdate('enable_voicemail_detection', checked)}
          />
        </div>
      </div>

      {/* End Call on Silence */}
      <div className="space-y-2">
        <div>
          <h4 className="text-sm font-medium">End Call on Silence</h4>
          <div className="flex items-center justify-between">
            <Slider
              value={[endCallAfterSilence / 60000]} // Convert to minutes
              onValueChange={(value) => onUpdate('end_call_after_silence_ms', value[0] * 60000)}
              min={1}
              max={30}
              step={1}
              className="w-[200px]"
            />
            <span className="text-sm text-gray-600 ml-4">
              {(endCallAfterSilence / 60000).toFixed(1)} m
            </span>
          </div>
        </div>
      </div>

      {/* Max Call Duration */}
      <div className="space-y-2">
        <div>
          <h4 className="text-sm font-medium">Max Call Duration</h4>
          <div className="flex items-center justify-between">
            <Slider
              value={[maxCallDuration / 3600000]} // Convert to hours
              onValueChange={(value) => onUpdate('max_call_duration_ms', value[0] * 3600000)}
              min={0.5}
              max={4}
              step={0.5}
              className="w-[200px]"
            />
            <span className="text-sm text-gray-600 ml-4">
              {(maxCallDuration / 3600000).toFixed(2)} h
            </span>
          </div>
        </div>
      </div>

      {/* Pause Before Speaking */}
      <div className="space-y-2">
        <div>
          <h4 className="text-sm font-medium">Pause Before Speaking</h4>
          <p className="text-xs text-gray-500">The duration before the assistant starts speaking at the beginning of the call.</p>
          <div className="flex items-center justify-between">
            <Slider
              value={[beginMessageDelay / 1000]} // Convert to seconds
              onValueChange={(value) => onUpdate('begin_message_delay_ms', value[0] * 1000)}
              min={0}
              max={5}
              step={0.1}
              className="w-[200px]"
            />
            <span className="text-sm text-gray-600 ml-4">
              {(beginMessageDelay / 1000).toFixed(1)} s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}