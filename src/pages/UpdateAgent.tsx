import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Edit2, Speech } from 'lucide-react';
import { VoiceLanguageSelector } from '../components/agent/VoiceLanguageSelector';
import { WelcomeMessage } from '../components/agent/WelcomeMessage';
import { ModelSelector } from '../components/agent/ModelSelector';
import { PromptEditor } from '../components/agent/PromptEditor';
import { KnowledgeBaseSidebar } from '../components/agent/KnowledgeBaseSidebar';
import { WebSocketCall } from '../components/agent/WebSocketCall';

interface Voice {
  voice_id: string;
  name: string;
  provider: string;
  preview_url?: string;
  language?: string;
  category?: string;
}

interface AgentData {
  id: string;
  name: string;
  config: {
    prompt: string;
    voice: {
      provider: string;
      voice_id: string;
      model: string;
      settings: Record<string, any>;
    };
    flow: {
      user_start_first: boolean;
      interruption: {
        allowed: boolean;
        keep_interruption_message: boolean;
        first_messsage: boolean;
      };
      response_delay: number;
      auto_fill_responses: {
        response_gap_threshold: number;
        messages: string[];
      };
      agent_terminate_call: {
        enabled: boolean;
        instruction: string;
        messages: string[];
      };
      voicemail: {
        action: string;
        message: string;
        continue_on_voice_activity: boolean;
      };
      call_transfer: {
        phone: string;
        instruction: string;
        messages: string[];
      };
      auto_fill_responses: {
        response_gap_threshold: number;
        messages: string[];
      };
      inactivity_handling: {
        idle_time: number;
        message: string;
      };
      dtmf_dial: {
        enabled: boolean;
        instruction: string;
      };
    };
    first_message: string;
    tools: Array<{
      name: string;
      description: string;
    }>;
    millis_functions: any[];
    app_functions: any[];
    language: string;
    vad_threshold: number;
    llm: {
      model: string;
      temperature: number;
      history_settings: {
        history_message_limit: number;
        history_tool_result_limit: number;
      };
    };
    session_timeout: {
      max_duration: number;
      max_idle: number;
      message: string;
    };
    privacy_settings: {
      opt_out_data_collection: boolean;
      do_not_call_detection: boolean;
    };
    speech_to_text: {
      provider: string;
      multilingual: boolean;
    };
    call_settings: {
      enable_recording: boolean;
    };
  };
  created_at: number;
}

export function UpdateAgent() {
  const { agentId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [transcripts, setTranscripts] = useState<Array<{ role: string; content: string }>>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempAgentName, setTempAgentName] = useState('');
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Function to determine if a field belongs to LLM data
  const isLLMField = (key: string) => {
    return ['general_prompt', 'general_tools', 'begin_message'].includes(key);
  };

  // Function to update LLM data
  const updateLLM = async (llmData: any) => {
    if (!user || !agentData?.config?.llm) return;

    try {
      const response = await fetch('/api/update-llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          workspace_id: '1',
          llm_data: {
            ...llmData,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update LLM');
      }
    } catch (error) {
      console.error('Error updating LLM:', error);
      throw error;
    }
  };

  // Function to update Agent data
  const updateAgent = async (agentDataToUpdate: any) => {
    if (!user || !agentId) return;

    try {
      const response = await fetch('https://03279385-3d79-446e-89a3-82d7a644a6e3-00-7h1owk45iklh.sisko.replit.dev/api/update-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          workspace_id: '1',
          agent_data: agentDataToUpdate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update agent');
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  };

  const handleUpdateAgent = async (key: string, value: any) => {
    if (!agentData) return;

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    let updatedData = { ...agentData };

    // Update the local state first
    switch (key) {
      case 'agent_name':
        updatedData.name = value;
        break;
      case 'voice':
        updatedData.config.voice = {
          ...updatedData.config.voice,
          voice_id: value.voice_id,
          provider: value.provider,
          model: value.model || updatedData.config.voice.model,
          settings: {},
        };
        break;
      case 'language':
        updatedData.config.language = value;
        break;
      case 'model':
        updatedData.config.llm.model = value;
        break;
      case 'general_prompt':
      case 'prompt':
        updatedData.config.prompt = value;
        break;
      case 'first_message':
        updatedData.config.first_message = value;
        break;
      case 'tools':
        updatedData.config.tools = value;
        break;
      case 'flow_agent_terminate_call':
        updatedData.config.flow.agent_terminate_call = value;
        break;
      case 'flow_call_transfer':
        updatedData.config.flow.call_transfer = value;
        break;
      case 'flow_dtmf_dial':
        updatedData.config.flow.dtmf_dial = value;
        break;
      case 'session_data_webhook':
        updatedData.config.session_data_webhook = value;
        break;
      case 'extra_prompt_webhook':
        updatedData.config.extra_prompt_webhook = value;
        break;
      default:
        console.warn('Unhandled update key:', key);
        return;
    }

    setAgentData(updatedData);

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        // Send the complete agent data structure to the backend
        const updatePayload = {
          id: agentId, // Backend expects id, not agent_id
          name: updatedData.name,
          config: updatedData.config,
        };

        await updateAgent(updatePayload);
      } catch (error) {
        setAgentData(agentData);
        console.error('Failed to update:', error);
      }
    }, 500);
  };

  const handleNameEdit = () => {
    setTempAgentName(agentData?.name || '');
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (!agentData) return;

    try {
      await handleUpdateAgent('agent_name', tempAgentName);
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating agent name:', error);
    }
  };

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('https://03279385-3d79-446e-89a3-82d7a644a6e3-00-7h1owk45iklh.sisko.replit.dev/api/list-voices');
        const data = await response.json();
        if (data.success) {
          setVoices(data.voices);
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
      }
    };

    fetchVoices();

    // Cleanup function to clear any pending timeouts
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!user || !agentId) return;
      setLoading(true);
      try {
        const response = await fetch(`https://03279385-3d79-446e-89a3-82d7a644a6e3-00-7h1owk45iklh.sisko.replit.dev/api/get-agent?agent_id=${agentId}`);
        const data = await response.json();
        if (data.success) {
          // Transform the data to match our expected format
          const transformedData = {
            ...data.agent,
            id: agentId, // Ensure we have the id field
          };
          setAgentData(data.agent);
        } else {
          throw new Error(data.error || 'Failed to fetch agent data');
        }
      } catch (error) {
        console.error('Error fetching agent:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [agentId, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    );
  }

  if (!agentData) {
    return (
      <div className="flex items-center justify-center h-full">
        Agent not found
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden bg-[#f3f4f6]">
        <div className="flex-[0.6] overflow-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
            {/* Combined Agent Configuration Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-4">
              {/* Agent Name Section */}
              <div className="flex items-center space-x-2 mb-2">
                {isEditingName ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={tempAgentName}
                      onChange={(e) => setTempAgentName(e.target.value)}
                      className="text-2xl font-semibold px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter agent name"
                      autoFocus
                    />
                    <button
                      onClick={handleNameSave}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-semibold text-gray-900">
                      {agentData.name || 'Single Prompt Agent'}
                    </h1>
                    <button
                      onClick={handleNameEdit}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 -mt-1">
                Configure your AI agent's personality and behavior
              </p>

              {/* Divider */}
              <div className="border-t border-gray-100 my-2"></div>

              {/* Voice & Language Section */}
              <div className="flex gap-4">
                <div className="flex-[2.85]">
                  <VoiceLanguageSelector
                    voices={voices}
                    selectedVoiceId={agentData.config.voice.voice_id}
                    selectedLanguage={agentData.config.language}
                    onVoiceChange={(voice) => handleUpdateAgent('voice', voice)}
                    onLanguageChange={(language) =>
                      handleUpdateAgent('language', language)
                    }
                  />
                </div>
                <div className="flex-[1.1]">
                  <ModelSelector
                    selectedModel={agentData.config.llm.model}
                    onChange={(model) => handleUpdateAgent('model', model)}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100"></div>

              {/* Initial Greeting Section */}
              <WelcomeMessage
                message={agentData.config.first_message}
                onChange={(message) =>
                  handleUpdateAgent('first_message', message)
                }
              />
            </div>

            {/* Conversation Style Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow mt-3">
              <h2 className="text-sm font-medium text-gray-900 mb-2">
                Conversation Style
              </h2>
              <PromptEditor
                prompt={agentData.config.prompt}
                onChange={(prompt) => handleUpdateAgent('prompt', prompt)}
              />
            </div>
          </div>
        </div>

        <div className="flex-[0.4] border-l border-gray-200 bg-white overflow-hidden">
          <KnowledgeBaseSidebar
            agentData={agentData}
            onUpdateAgent={handleUpdateAgent}
          />
        </div>

        <div className="flex-[0.4] border-l border-gray-200 bg-white overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="bg-blue-600 text-white p-2 rounded-lg mr-2">
                <Speech size={16} />
              </span>
              Test Your Agent
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Experience your agent's conversational abilities and refine its responses in real-time.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {transcripts.map((transcript, index) => (
                <div
                  key={index}
                  className={`flex ${
                    transcript.role === 'assistant' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      transcript.role === 'assistant'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{transcript.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <WebSocketCall
              agentId={agentId!}
              onCallStateChange={setIsCallActive}
              onTranscriptUpdate={(transcript) => {
                setTranscripts(prev => [...prev, transcript]);
                // Auto-scroll to bottom
                const transcriptDiv = document.querySelector('.overflow-y-auto');
                if (transcriptDiv) transcriptDiv.scrollTop = transcriptDiv.scrollHeight;
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}