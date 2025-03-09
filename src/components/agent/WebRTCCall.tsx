import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Speech, PhoneOff } from 'lucide-react';

interface WebRTCCallProps {
  agentId: string;
  onCallStateChange?: (isActive: boolean) => void;
}

export function WebRTCCall({ agentId, onCallStateChange }: WebRTCCallProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'none'>('none');
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      stopCall();
    };
  }, []);

  useEffect(() => {
    audioElement.current = new Audio();
    audioElement.current.autoplay = true;
    audioElement.current.volume = 1;
    
    return () => {
      if (audioElement.current) {
        audioElement.current.srcObject = null;
      }
    };
  }, []);

  const initializeWebRTC = async () => {
    try {
      peerConnection.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ],
        // Optimize for audio
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        // Prioritize latency over quality
        iceCandidatePoolSize: 0
      });

      // Optimize audio constraints
      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          latency: 0,
          channelCount: 1
        }
      });

      localStream.current.getTracks().forEach(track => {
        if (peerConnection.current) {
          peerConnection.current.addTrack(track, localStream.current!);
        }
      });

      peerConnection.current.ontrack = (event) => {
        if (!remoteStream.current) {
          remoteStream.current = new MediaStream();
        }
        remoteStream.current.addTrack(event.track);
        
        if (audioElement.current) {
          audioElement.current.srcObject = remoteStream.current;
        }
      };

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      const response = await fetch('/api/webrtc/offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          offer: {
            sdp: offer.sdp,
            type: offer.type
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send WebRTC offer');
      }

      const { answer } = await response.json();

      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));

      // Handle ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          // Send candidate to Millis AI
          fetch('/api/webrtc/ice-candidate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              agent_id: agentId,
              candidate: event.candidate
            })
          });
        }
      };

      peerConnection.current.onconnectionstatechange = () => {
        if (peerConnection.current?.connectionState === 'connected') {
          setIsConnecting(false);
          setIsCallActive(true);
          onCallStateChange?.(true);
        }
      };

      // Monitor connection quality
      peerConnection.current.oniceconnectionstatechange = () => {
        const state = peerConnection.current?.iceConnectionState;
        switch (state) {
          case 'connected':
            setConnectionQuality('good');
            break;
          case 'disconnected':
          case 'failed':
            setConnectionQuality('poor');
            break;
        }
      };

    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      setIsConnecting(false);
      stopCall();
    }
  };

  const startCall = async () => {
    setIsConnecting(true);
    await initializeWebRTC();
  };

  const stopCall = () => {
    localStream.current?.getTracks().forEach(track => track.stop());

    // Clean up remote stream
    if (remoteStream.current) {
      remoteStream.current.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    
    if (audioElement.current) {
      audioElement.current.srcObject = null;
    }

    // Reset refs
    peerConnection.current = null;
    localStream.current = null;
    remoteStream.current = null;

    setIsCallActive(false);
    setConnectionQuality('none');
    setIsConnecting(false);
    setIsMuted(false);
    onCallStateChange?.(false);
  };

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100%-76px)]">
      {/* Call animation rings */}
      <div className="relative">
        {/* Mute button */}
        {isCallActive && (
          <button
            onClick={toggleMute}
            className={`
              absolute -top-4 right-0 p-3 rounded-full transition-all duration-300 z-20
              ${isMuted ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-600'}
              hover:bg-opacity-90 transform hover:scale-110 active:scale-95
              shadow-md hover:shadow-lg
            `}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}

        {isCallActive && (
          <>
            <div className="absolute inset-0 w-32 h-32 rounded-full bg-green-500/10 animate-[ping_2s_ease-in-out_infinite]" />
            <div className="absolute inset-0 w-32 h-32 rounded-full bg-green-500/20 animate-[pulse_3s_ease-in-out_infinite]" />
            <div className="absolute inset-0 w-32 h-32 rounded-full bg-green-500/30 animate-[pulse_4s_ease-in-out_infinite]" />
          </>
        )}
        {isConnecting && (
          <>
            <div className="absolute inset-0 w-32 h-32 rounded-full bg-yellow-500/10 animate-[ping_1.5s_ease-in-out_infinite]" />
            <div className="absolute inset-0 w-32 h-32 rounded-full bg-yellow-500/20 animate-[pulse_2s_ease-in-out_infinite]" />
          </>
        )}
        <button
          onClick={isCallActive ? stopCall : startCall}
          disabled={isConnecting}
          className={`
            relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300
            ${isConnecting ? 'bg-yellow-500 animate-pulse' : 
              isCallActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
            ${isConnecting ? 'cursor-wait' : 'cursor-pointer'}
            disabled:opacity-50 shadow-xl hover:shadow-2xl
            transform hover:scale-105 active:scale-95
            z-10
          `}
        >
          <div className="relative">
            {isConnecting ? (
              <div className="animate-[spin_1s_linear_infinite] rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            ) : isCallActive ? (
              <PhoneOff className="text-white" size={40} />
            ) : (
              <Speech className="text-white" size={48} />
            )}
          </div>
        </button>
        
        {/* Connection quality indicator */}
        {connectionQuality !== 'none' && (
          <div className={`
            absolute top-0 right-0 w-6 h-6 rounded-full border-2 border-white
            ${connectionQuality === 'good' ? 'bg-green-400 animate-pulse' : 'bg-red-400 animate-[pulse_0.5s_ease-in-out_infinite]'}
            z-20
          `} />
        )}
      </div>

    </div>
  );
}