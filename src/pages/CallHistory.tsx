import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Phone, Clock, AlertTriangle, X, Volume2, Copy, Download, Play, Pause } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface CallData {
  call_id: string;
  agent_id: string;
  call_status: string;
  start_timestamp: number;
  end_timestamp: number;
  duration_ms: number;
  transcript: string;
  transcript_object: Array<{
    role: string;
    content: string;
    words: any[];
    metadata: any;
  }>;
  recording_url: string;
  disconnection_reason: string;
  call_type: string;
  call_analysis: {
    call_summary: string;
    user_sentiment: string;
    call_successful: boolean;
    agent_task_completion_rating: string;
  };
}

interface CallDetailsProps {
  call: CallData;
  onClose: () => void;
}

const getBadgeStyles = (type: string, sentiment: boolean = false) => {
  const baseStyles = "px-2 py-1 text-xs rounded-full inline-flex items-center justify-center font-medium";
  
  if (sentiment) {
    switch (type) {
      case 'Positive':
        return `${baseStyles} bg-green-50 text-green-700`;
      case 'Negative':
        return `${baseStyles} bg-red-50 text-red-700`;
      case 'Neutral':
        return `${baseStyles} bg-gray-50 text-gray-700`;
      default:
        return `${baseStyles} bg-gray-50 text-gray-700`;
    }
  }

  switch (type) {
    case 'Successful':
    case 'true':
      return `${baseStyles} bg-green-50 text-green-700`;
    case 'Unsuccessful':
    case 'false':
      return `${baseStyles} bg-red-50 text-red-700`;
    case 'User_Hangup':
    case 'Agent_Hangup':
      return `${baseStyles} bg-blue-50 text-blue-700`;
    default:
      return `${baseStyles} bg-gray-50 text-gray-700`;
  }
};

function CallDetails({ call, onClose }: CallDetailsProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeTimeoutRef = useRef<NodeJS.Timeout>();
  const [audioProgress, setAudioProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [isVolumeSliderHovered, setIsVolumeSliderHovered] = useState(false);

  const formatTimestamp = (timestamp: number) => {
    return format(new Date(timestamp), 'MM/dd/yyyy HH:mm');
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCopyCallId = () => {
    navigator.clipboard.writeText(call.call_id);
  };

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(call.transcript || '');
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleVolumeMouseEnter = () => {
    setIsVolumeHovered(true);
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
  };

  const handleVolumeMouseLeave = () => {
    if (!isVolumeSliderHovered) {
      volumeTimeoutRef.current = setTimeout(() => {
        setIsVolumeHovered(false);
      }, 500);
    }
  };

  const handleSliderMouseEnter = () => {
    setIsVolumeSliderHovered(true);
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
  };

  const handleSliderMouseLeave = () => {
    setIsVolumeSliderHovered(false);
    volumeTimeoutRef.current = setTimeout(() => {
      if (!isVolumeHovered) {
        setIsVolumeHovered(false);
      }
    }, 500);
  };

  const handleDownloadAudio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (call.recording_url) {
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = call.recording_url;
      link.download = `call-${call.call_id}.wav`; // Suggested filename
      link.target = '_blank'; // Open in new tab if download fails
      link.rel = 'noopener noreferrer';
      
      // Append to document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
          e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Handle navigation
        console.log('Navigate with:', e.key);
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (volumeTimeoutRef.current) {
        clearTimeout(volumeTimeoutRef.current);
      }
    };
  }, [onClose]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, []);

  return (
    <div className="fixed inset-y-0 right-0 w-[440px] bg-white shadow-lg overflow-y-auto">
      <div className="p-3 flex items-center justify-between border-b">
        <div className="text-xs text-gray-500">
          Use <kbd className="px-1 py-0.5 bg-gray-100 rounded">↑</kbd>{' '}
          <kbd className="px-1 py-0.5 bg-gray-100 rounded">↓</kbd>{' '}
           to navigate
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="p-4">
        {/* Call Header */}
        <div className="mb-4">
          <h2 className="text-base font-medium mb-1">
            {format(new Date(call.start_timestamp), 'MM/dd/yyyy HH:mm')} {call.call_type}
          </h2>
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center space-x-2">
              <span>Agent</span>
              <span className="text-gray-400">{call.agent_id}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Call ID</span>
              <span className="text-gray-400">{call.call_id}</span>
              <button 
                onClick={handleCopyCallId}
                className="text-gray-400 hover:text-gray-600"
              >
                <Copy size={12} />
              </button>
            </div>
            <div>
              Duration: {formatTimestamp(call.start_timestamp)} - {formatTimestamp(call.end_timestamp)}
            </div>
          </div>
        </div>

        {/* Audio Player */}
        {call.recording_url && (
          <div className="bg-gray-50 p-2 rounded mb-4">
            <audio 
              ref={audioRef}
              src={call.recording_url}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
            />
            <div className="flex items-center space-x-2">
              <button 
                onClick={handlePlayPause}
                className="p-1 text-gray-600 hover:text-gray-800"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <div className="flex-1 h-1 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-blue-600 rounded-full" 
                  style={{ width: `${audioProgress}%` }} 
                />
              </div>
              <div className="relative"
                onMouseEnter={handleVolumeMouseEnter}
                onMouseLeave={handleVolumeMouseLeave}
              >
                <button className="p-1 text-gray-600 hover:text-gray-800">
                  <Volume2 size={16} />
                </button>
                {isVolumeHovered && (
                  <div 
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white p-2 rounded shadow-lg"
                    onMouseEnter={handleSliderMouseEnter}
                    onMouseLeave={handleSliderMouseLeave}
                  >
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                )}
              </div>
              <button 
                onClick={handleDownloadAudio}
                className="p-1 text-gray-600 hover:text-gray-800"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Conversation Analysis */}
        <div className="mb-4">
          <h3 className="text-xs font-medium mb-2">Conversation Analysis</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Call Successful</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700">
                {call.call_analysis.call_successful ? 'Complete' : 'Incomplete'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">User Sentiment</span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                call.call_analysis.user_sentiment === 'Positive' 
                  ? 'bg-green-50 text-green-700'
                  : call.call_analysis.user_sentiment === 'Negative'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-gray-50 text-gray-700'
              }`}>
                {call.call_analysis.user_sentiment}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Disconnection Reason</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700">
                {call.disconnection_reason.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-4">
          <h3 className="text-xs font-medium mb-2">Summary</h3>
          <p className="text-xs text-gray-600">
            {call.call_analysis.call_summary}
          </p>
        </div>

        {/* Transcript */}
        <div>
          <h3 className="text-xs font-medium mb-2 flex items-center justify-between">
            Transcription
            <button 
              onClick={handleCopyTranscript}
              className="text-gray-400 hover:text-gray-600"
            >
              <Copy size={14} />
            </button>
          </h3>
          <div className="space-y-3">
            {call.transcript_object.map((entry, index) => (
              <div key={index} className="flex items-start">
                <div className="w-12 flex-shrink-0">
                  <div className="text-xs font-medium text-gray-500 capitalize">
                    {entry.role}:
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800">{entry.content}</p>
                  {entry.metadata?.tool_calls && (
                    <div className="mt-1 text-xs text-blue-600">
                      &gt; Tool Invocation: {entry.metadata.tool_calls[0]?.name}
                    </div>
                  )}
                </div>
                <div className="w-8 flex-shrink-0 text-right">
                  <span className="text-xs text-gray-400">
                    {formatDuration(entry.metadata?.timestamp || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CallHistory() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<CallData | null>(null);
  const [stats, setStats] = useState({
    totalCalls: 0,
    avgDuration: 0,
    negativeSentimentRatio: 0
  });

  useEffect(() => {
    const fetchCalls = async () => {
      if (!user) return;

      try {
        const callsRef = collection(db, 'users', user.uid, 'workspaces', '1', 'call_history');
        const q = query(callsRef, orderBy('start_timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const callsData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          call_id: doc.id
        })) as CallData[];

        setCalls(callsData);

        // Calculate stats
        const total = callsData.length;
        const avgDuration = callsData.reduce((acc, call) => acc + call.duration_ms, 0) / total;
        const negativeCalls = callsData.filter(call => 
          call.call_analysis?.user_sentiment === 'Negative'
        ).length;
        const negativeRatio = (negativeCalls / total) * 100;

        setStats({
          totalCalls: total,
          avgDuration: avgDuration,
          negativeSentimentRatio: negativeRatio
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching calls:', error);
        setLoading(false);
      }
    };

    fetchCalls();
  }, [user]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m${seconds}s`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Call History</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Phone className="text-gray-400" size={20} />
              <h3 className="text-sm font-medium text-gray-600">Total Calls</h3>
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.totalCalls}</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="text-gray-400" size={20} />
              <h3 className="text-sm font-medium text-gray-600">Avg Call Duration</h3>
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{formatDuration(stats.avgDuration)}</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="text-gray-400" size={20} />
              <h3 className="text-sm font-medium text-gray-600">Negative Sentiment Ratio</h3>
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{stats.negativeSentimentRatio.toFixed(2)}%</p>
        </div>
      </div>

      {/* Calls Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Call Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Sentiment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Call Successful
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disconnection Reason
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {calls.map((call) => (
                <tr 
                  key={call.call_id}
                  onClick={() => setSelectedCall(call)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDistanceToNow(new Date(call.start_timestamp), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(call.duration_ms)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getBadgeStyles(call.call_analysis?.user_sentiment, true)}>
                      {call.call_analysis?.user_sentiment || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getBadgeStyles(call.call_analysis?.call_successful ? 'Successful' : 'Unsuccessful')}>
                      {call.call_analysis?.call_successful ? 'Successful' : 'Unsuccessful'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getBadgeStyles(call.disconnection_reason)}>
                      {call.disconnection_reason.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Call Details Sidebar */}
      {selectedCall && (
        <CallDetails
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </div>
  );
}