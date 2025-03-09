import React, { useState, useEffect } from 'react';
import { Plus, Info, Settings, ChevronDown, ChevronUp, X } from 'lucide-react';
import { CallSettings } from './CallSettings';
import { SpeechSettings } from './SpeechSettings';
import { Functions } from './Functions';
import { Dialog } from '../Dialog';
import { useAuth } from '../../hooks/useAuth';

interface KnowledgeBase {
  knowledge_base_id: string;
  knowledge_base_name: string;
  status: string;
  created_at: Date;
}

interface KnowledgeBaseSidebarProps {
  agentData: any;
  onUpdateAgent: (key: string, value: any) => void;
}

export function KnowledgeBaseSidebar({
  agentData,
  onUpdateAgent,
}: KnowledgeBaseSidebarProps) {
  const { user } = useAuth();
  const [isCallSettingsOpen, setIsCallSettingsOpen] = useState(false);
  const [isSpeechSettingsOpen, setIsSpeechSettingsOpen] = useState(false);
  const [isFunctionsOpen, setIsFunctionsOpen] = useState(false);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(true);
  const [isWebhookSettingsOpen, setIsWebhookSettingsOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [allKnowledgeBases, setAllKnowledgeBases] = useState<KnowledgeBase[]>(
    []
  );
  const [connectedKnowledgeBases, setConnectedKnowledgeBases] = useState<
    KnowledgeBase[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const response = await fetch(
          'https://backend-dig-agents-wannes.replit.app/api/list-knowledge-bases'
        );
        const data = await response.json();
        setAllKnowledgeBases(data);

        const connectedIds = agentData.config.knowledge_base?.files || [];
        const connected = data.filter((kb: KnowledgeBase) =>
          connectedIds.includes(kb.knowledge_base_id)
        );
        setConnectedKnowledgeBases(connected);
      } catch (error) {
        console.error('Error fetching knowledge bases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKnowledgeBases();
  }, [user, agentData.config.knowledge_base?.files]);

  const handleAddKnowledgeBase = async (knowledgeBaseId: string) => {
    const currentIds = agentData.config.knowledge_base?.files || [];
    if (currentIds.includes(knowledgeBaseId)) return;

    const newIds = [...currentIds, knowledgeBaseId];

    try {
      await onUpdateAgent('knowledge_base_files', newIds);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding knowledge base:', error);
    }
  };

  const handleRemoveKnowledgeBase = async (knowledgeBaseId: string) => {
    const currentIds = agentData.config.knowledge_base?.files || [];
    const newIds = currentIds.filter((id) => id !== knowledgeBaseId);

    try {
      await onUpdateAgent('knowledge_base_files', newIds);
    } catch (error) {
      console.error('Error removing knowledge base:', error);
    }
  };

  const getUnconnectedKnowledgeBases = () => {
    const connectedIds = agentData.config.knowledge_base?.files || [];
    return allKnowledgeBases.filter(
      (kb) => !connectedIds.includes(kb.knowledge_base_id)
    );
  };

  return ( 
    <div className="h-full bg-white flex flex-col overflow-y-auto">
      <div className="flex-shrink-0 border-b border-gray-200">
        <button
          className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
          onClick={() => setIsKnowledgeBaseOpen(!isKnowledgeBaseOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings size={16} />
              <span>Knowledge base</span>
            </div>
            {isKnowledgeBaseOpen ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </div>
        </button>
        {isKnowledgeBaseOpen && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <button className="text-gray-400 hover:text-gray-600">
                  <Info size={16} />
                </button>
                <p className="text-sm text-gray-500">
                  Add context to the agent
                </p>
              </div>
              <button
                onClick={() => setIsAddDialogOpen(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : connectedKnowledgeBases.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No knowledge bases connected
                </div>
              ) : (
                connectedKnowledgeBases.map((kb) => (
                  <div
                    key={kb.knowledge_base_id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                  >
                    <span className="truncate flex-1">
                      {kb.knowledge_base_name}
                    </span>
                    <button
                      onClick={() =>
                        handleRemoveKnowledgeBase(kb.knowledge_base_id)
                      }
                      className="text-gray-400 hover:text-gray-600 ml-2"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200">
        <button
          className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
          onClick={() => setIsFunctionsOpen(!isFunctionsOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings size={16} />
              <span>Functions</span>
            </div>
            {isFunctionsOpen ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </div>
        </button>
        {isFunctionsOpen && (
          <Functions
            tools={agentData.config.tools || []}
            onUpdate={onUpdateAgent}
            agentData={agentData}
          />
        )}
      </div>

      <div className="border-t border-gray-200">
        <button
          className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
          onClick={() => setIsSpeechSettingsOpen(!isSpeechSettingsOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings size={16} />
              <span>Speech settings</span>
            </div>
            {isSpeechSettingsOpen ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </div>
        </button>
        {isSpeechSettingsOpen && (
          <SpeechSettings
            ambientSound={agentData.config.ambient_sound}
            responsiveness={agentData.config.responsiveness}
            interruptionSensitivity={agentData.config.flow.interruption.allowed}
            enableBackchannel={agentData.config.enable_backchannel}
            backchannelWords={agentData.config.backchannel_words}
            pronunciationDictionary={agentData.config.pronunciation_dictionary}
            onUpdate={onUpdateAgent}
          />
        )}
      </div>

      <div className="border-t border-gray-200">
        <button
          className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
          onClick={() => setIsCallSettingsOpen(!isCallSettingsOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings size={16} />
              <span>Call settings</span>
            </div>
            {isCallSettingsOpen ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </div>
        </button>
        {isCallSettingsOpen && (
          <CallSettings
            voicemailDetection={
              agentData.config?.flow?.voicemail?.action === 'detect' || false
            }
            endCallAfterSilence={
              agentData.config.flow.inactivity_handling.idle_time
            }
            maxCallDuration={
              agentData.config?.session_timeout?.max_duration || 3600000
            }
            beginMessageDelay={agentData.config.flow.response_delay}
            onUpdate={onUpdateAgent}
          />
        )}
      </div>

      <div className="border-t border-gray-200">
        <button
          className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
          onClick={() => setIsWebhookSettingsOpen(!isWebhookSettingsOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings size={16} />
              <span>Webhook settings</span>
            </div>
            {isWebhookSettingsOpen ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </div>
        </button>
        {isWebhookSettingsOpen && (
          <div className="px-4 pb-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Session Data Webhook</label>
              <p className="text-xs text-gray-500 mb-2">
                Set a webhook URL to receive conversation data after each session. The webhook will be called with a POST request.
              </p>
              <input
                type="url"
                value={agentData.config?.session_data_webhook || ''}
                onChange={(e) => onUpdateAgent('session_data_webhook', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="https://your-webhook-url.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pre Fetch Webhook</label>
              <p className="text-xs text-gray-500 mb-2">
                Set a webhook URL for prefetching data before the conversation starts. The webhook will be called with a GET request.
              </p>
              <input
                type="url"
                value={agentData.config?.extra_prompt_webhook || ''}
                onChange={(e) => onUpdateAgent('extra_prompt_webhook', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="https://your-webhook-url.com"
              />
            </div>
          </div>
        )}
      </div>

      <Dialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        title="Add Knowledge Base"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Select a knowledge base to connect to this agent
          </div>

          {loading ? (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getUnconnectedKnowledgeBases().map((kb) => (
                <button
                  key={kb.knowledge_base_id}
                  onClick={() => handleAddKnowledgeBase(kb.knowledge_base_id)}
                  className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-sm">
                    {kb.knowledge_base_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Status: {kb.status}
                  </div>
                </button>
              ))}
              {getUnconnectedKnowledgeBases().length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No available knowledge bases to connect
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setIsAddDialogOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}