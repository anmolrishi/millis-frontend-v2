import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Speech, PhoneOff } from 'lucide-react';
import Millis from '@millisai/web-sdk';

interface WebSocketCallProps {
  agentId: string;
  onCallStateChange?: (isActive: boolean) => void;
  onTranscriptUpdate?: (transcript: { role: string; content: string }) => void;
}

export function WebSocketCall({ agentId, onCallStateChange, onTranscriptUpdate }: WebSocketCallProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'none'>('none');
  
  const msClient = useRef<any>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyserNode = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    return () => {
      stopCall();
    };
  }, []);

  const startCall = async () => {
    setIsConnecting(true);

    try {
      // Initialize Millis client
      msClient.current = Millis.createClient({
        publicKey: 'mnCNFbmEfKFuXRCggRpHu54nAyaHXDPx'
      });

      // Set up event listeners
      msClient.current.on('onopen', () => {
        console.log('WebSocket connection opened');
        setConnectionQuality('good');
      });

      msClient.current.on('onready', () => {
        console.log('Client is ready');
        setIsCallActive(true);
        onCallStateChange?.(true);
        setIsConnecting(false);
      });

      msClient.current.on('onaudio', (audio: Uint8Array) => {
        // Audio is automatically handled by the SDK
      });

      msClient.current.on('analyzer', (analyzer: AnalyserNode) => {
        analyserNode.current = analyzer;
      });

      msClient.current.on('ontranscript', (text: string, payload: { is_final?: boolean }) => {
        if (payload.is_final) {
          onTranscriptUpdate?.({
            role: 'user',
            content: text.trim()
          });
        }
      });

      msClient.current.on('onresponsetext', (text: string, payload: { is_final?: boolean }) => {
        if (payload.is_final) {
          onTranscriptUpdate?.({
            role: 'assistant',
            content: text.trim()
          });
        }
      });

      msClient.current.on('onsessionended', () => {
        stopCall();
      });

      msClient.current.on('onclose', () => {
        stopCall();
      });

      msClient.current.on('onerror', (error: any) => {
        console.error('WebSocket error:', error);
        setConnectionQuality('poor');
      });

      // Start the conversation
      await msClient.current.start({
        agent: {
          agent_id: agentId
        }
      });

    } catch (error) {
      console.error('Error starting call:', error);
      setIsConnecting(false);
      stopCall();
    }
  };

  const stopCall = () => {
    if (msClient.current) {
      msClient.current.stop();
      msClient.current = null;
    }

    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }

    setIsCallActive(false);
    setConnectionQuality('none');
    onCallStateChange?.(false);
    setIsConnecting(false);
  };

  const toggleMute = () => {
    if (msClient.current) {
      if (isMuted) {
        msClient.current.unmute();
      } else {
        msClient.current.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <button
        onClick={isCallActive ? stopCall : startCall}
        disabled={isConnecting}
        className={`
          relative z-0 w-full py-3 px-6 rounded-lg flex items-center justify-center space-x-3
          transition-all duration-300 text-white font-medium
          ${isConnecting ? 'bg-yellow-500 animate-pulse' : 
            isCallActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}
          disabled:opacity-50 shadow-lg hover:shadow-xl
          transform hover:scale-[1.02] active:scale-[0.98]
        `}
      >
        {isCallActive && (
          <button
            onClick={toggleMute}
            className={`absolute right-3 p-2 rounded-full transition-all duration-300
              ${isMuted ? 'bg-red-400 text-white' : 'bg-white/20 text-white'}
              hover:bg-opacity-90 transform hover:scale-110 active:scale-95
            `}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}

        {isConnecting ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
        ) : isCallActive ? (
          <PhoneOff size={20} />
        ) : (
          <Speech size={20} />
        )}
        <span>
          {isConnecting ? 'Connecting...' : isCallActive ? 'End Call' : 'Start Test Call'}
        </span>

        {connectionQuality !== 'none' && (
          <div className={`
            absolute left-3 w-2 h-2 rounded-full
            ${connectionQuality === 'good' ? 'bg-green-400 animate-pulse' : 'bg-red-400 animate-[pulse_0.5s_ease-in-out_infinite]'}
          `} />
        )}
      </button>
    </div>
  );
}