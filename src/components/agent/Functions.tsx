import React, { useState } from 'react';
import { Phone, Clock, Plus, Edit, Trash2, X, ChevronDown } from 'lucide-react';
import { Dialog } from '../Dialog';
import { Switch } from '../ui/Switch';

interface FunctionTool {
  name: string;
  type: string;
  description: string;
  webhook?: string;
  method?: string;
  timeout_ms?: number;
  speak_during_execution: boolean;
  speak_after_execution: boolean;
  params?: Array<{
    name: string;
    required: boolean;
    type: string;
    description: string;
  }>;
  header?: Record<string, string>;
  run_after_call?: boolean;
  exclude_session_id?: boolean;
  messages?: string[];
  instruction?: string;
  number?: string;
}

interface FunctionsProps {
  tools: FunctionTool[];
  // onUpdate now expects a key and a value, so that we can handle different updates (like flow_agent_terminate_call, flow_dtmf_dial, etc.)
  onUpdate: (key: string, value: any) => void;
  agentData: any;
}

export function Functions({ tools = [], onUpdate, agentData }: FunctionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<FunctionTool | null>(null);
  const [newTool, setNewTool] = useState<FunctionTool>({
    type: 'none',
    speak_during_execution: false,
    speak_after_execution: false,
    messages: [],
  });
  const [newMessage, setNewMessage] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');

  // Checking what’s already enabled in agentData
  const isDtmfDialEnabled = agentData?.config?.flow?.dtmf_dial?.enabled;
  const hasTransferCall = agentData?.config?.flow?.call_transfer?.phone;
  const isEndCallEnabled =
    agentData?.config?.flow?.agent_terminate_call?.enabled;

  const handleOpenDialog = (tool?: any) => {
    if (tool) {
      // If user clicks "Edit" on an existing tool
      setEditingTool(tool);

      let type = tool.type;
      let toolData;

      // Handle built-in "End Call"
      if (tool === 'end_call' || tool.type === 'end_call') {
        type = 'end_call';
        toolData = {
          type: 'end_call',
          name: 'End Call',
          instruction: agentData.config.flow.agent_terminate_call.instruction,
          messages: agentData.config.flow.agent_terminate_call.messages || [],
          speak_during_execution: false,
          speak_after_execution: false,
        };
      }
      // Handle built-in "DTMF Dial"
      else if (tool === 'dtmf_dial' || tool.type === 'dtmf_dial') {
        type = 'dtmf_dial';
        toolData = {
          type: 'dtmf_dial',
          name: 'DTMF Dial',
          instruction: agentData.config.flow.dtmf_dial.instruction,
          speak_during_execution: false,
          speak_after_execution: false,
        };
      }
      // Handle built-in "Transfer Call"
      else if (tool === 'transfer_call' || tool.type === 'transfer_call') {
        type = 'transfer_call';
        toolData = {
          type: 'transfer_call',
          number: agentData.config.flow.call_transfer.phone,
          instruction: agentData.config.flow.call_transfer.instruction,
          messages: agentData.config.flow.call_transfer.messages || [],
          speak_during_execution: false,
          speak_after_execution: false,
        };
      }
      // Custom functions
      else {
        type = 'custom';
        toolData = {
          ...tool,
          type: 'custom',
          params: tool.params || [],
          header: tool.header || {},
          run_after_call: tool.run_after_call || false,
          exclude_session_id: tool.exclude_session_id || false,
        };
      }

      setSelectedType(type);
      setNewTool(toolData);
    } else {
      // If user clicks "Add Function" (no existing tool to edit)
      setEditingTool(null);
      setSelectedType('');
      setNewTool({
        type: 'none',
        speak_during_execution: false,
        speak_after_execution: false,
        messages: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);

    if (type === 'end_call') {
      setNewTool({
        type: 'end_call',
        name: 'End Call',
        description: '',
        instruction: '',
        messages: [],
        speak_during_execution: false,
        speak_after_execution: false,
      });
    } else if (type === 'dtmf_dial') {
      setNewTool({
        type: 'dtmf_dial',
        name: 'DTMF Dial',
        instruction: '',
        speak_during_execution: false,
        speak_after_execution: false,
      });
    } else if (type === 'transfer_call') {
      setNewTool({
        type: 'transfer_call',
        instruction: '',
        messages: [],
        speak_during_execution: false,
        speak_after_execution: false,
      });
    } else {
      // For a brand-new custom function, prefill it to match our placeholder’s JSON
      setNewTool({
        type: 'custom',
        name: '',
        description: '',
        method: 'POST',
        webhook: '',
        timeout_ms: 120000,
        speak_during_execution: false,
        speak_after_execution: false,
        // match the placeholder
        params: [
          {
            name: 'string',
            required: true,
            type: 'string',
            description: 'string',
          },
        ],
        header: {
          additionalProp1: 'string',
          additionalProp2: 'string',
          additionalProp3: 'string',
        },
        run_after_call: true,
        exclude_session_id: true,
      });
    }
  };

  const handleSave = () => {
    // Built-in end call
    if (newTool.type === 'end_call') {
      onUpdate('flow_agent_terminate_call', {
        enabled: true,
        instruction: newTool.instruction || '',
        messages: newTool.messages || [],
      });
      setIsDialogOpen(false);
      return;
    }
    // Built-in dtmf dial
    else if (newTool.type === 'dtmf_dial') {
      onUpdate('flow_dtmf_dial', {
        enabled: true,
        instruction: newTool.instruction || '',
      });
      setIsDialogOpen(false);
      return;
    }
    // Built-in transfer call
    else if (newTool.type === 'transfer_call') {
      onUpdate('flow_call_transfer', {
        phone: newTool.number || '',
        instruction: newTool.instruction || '',
        messages: newTool.messages || [],
      });
      setIsDialogOpen(false);
      return;
    }
    // For a custom function (either new or editing)
    else if (editingTool) {
      const updatedTools = tools.map((t) =>
        t.name === editingTool.name ? newTool : t
      );
      onUpdate('tools', updatedTools);
    } else {
      onUpdate('tools', [...tools, newTool]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (toolName: string) => {
    // If it’s one of the built-ins
    if (toolName === 'End Call' || toolName === 'end_call') {
      onUpdate('flow_agent_terminate_call', {
        enabled: false,
        instruction: '',
        messages: [],
      });
    } else if (toolName === 'DTMF Dial') {
      onUpdate('flow_dtmf_dial', {
        enabled: false,
        instruction: '',
      });
    } else if (toolName === 'Transfer Call' || toolName === 'transfer_call') {
      onUpdate('flow_call_transfer', {
        phone: '',
        instruction: '',
        messages: [],
      });
    } else {
      // Otherwise remove it from the custom tools array
      const updatedTools = tools.filter((t) => t.name !== toolName);
      onUpdate('tools', updatedTools);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'end_call':
        return Phone;
      case 'transfer_call':
        return Phone;
      default:
        return Clock;
    }
  };

  return (
    <div className="border-t border-gray-200 py-4">
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Functions</h3>
          <button
            onClick={() => handleOpenDialog()}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
          >
            <Plus size={16} />
            <span>Add</span>
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Enable your agent with capabilities such as calendar bookings, call
          termination, etc.
        </p>

        <div className="space-y-2">
          {/* Show End Call function if enabled */}
          {agentData?.config?.flow?.agent_terminate_call?.enabled && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Phone size={18} className="text-gray-400" />
                <div>
                  <span className="text-sm font-medium">End Call</span>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {agentData.config.flow.agent_terminate_call.instruction}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    handleOpenDialog({
                      type: 'end_call',
                    })
                  }
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete('end_call')}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Show DTMF Dial function if enabled */}
          {agentData?.config?.flow?.dtmf_dial?.enabled && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Phone size={18} className="text-gray-400" />
                <div>
                  <span className="text-sm font-medium">DTMF Dial</span>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {agentData.config.flow.dtmf_dial.instruction}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    handleOpenDialog({
                      type: 'dtmf_dial',
                    })
                  }
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete('DTMF Dial')}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Show Transfer Call function if configured */}
          {agentData?.config?.flow?.call_transfer?.phone && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Phone size={18} className="text-gray-400" />
                <div>
                  <span className="text-sm font-medium">Transfer Call</span>
                  <div className="text-xs text-gray-500 mt-0.5">
                    To: {agentData.config.flow.call_transfer.phone}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    handleOpenDialog({
                      type: 'transfer_call',
                    })
                  }
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete('transfer_call')}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}

          {/* List out custom tools */}
          {tools.map((tool) => {
            const Icon = getIconForType(tool.type);
            return (
              <div
                key={tool.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Icon size={18} className="text-gray-400" />
                  <div>
                    <span className="text-sm font-medium">{tool.name}</span>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {tool.speak_during_execution && (
                        <span className="mr-2">Speaks during</span>
                      )}
                      {tool.speak_after_execution && <span>Speaks after</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenDialog(tool)}
                    className="p-1.5 text-gray-400 hover:text-gray-600"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(tool.name)}
                    className="p-1.5 text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingTool ? 'Edit Function' : 'Add Function'}
      >
        <div className="space-y-4">
          {/* If user hasn't chosen a type yet, show the “choose function type” screen */}
          {!selectedType && (
            <div className="space-y-2">
              <label className="block text-sm font-medium mb-2">
                Select Function Type
              </label>
              <div className="space-y-2">
                {!isEndCallEnabled && (
                  <button
                    onClick={() => handleTypeSelect('end_call')}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium">End Call</div>
                      <div className="text-xs text-gray-500">
                        Allow agent to end calls automatically
                      </div>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>
                )}
                {!isDtmfDialEnabled && (
                  <button
                    onClick={() => handleTypeSelect('dtmf_dial')}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium">DTMF Dial</div>
                      <div className="text-xs text-gray-500">
                        Allow agent to handle DTMF tones
                      </div>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>
                )}
                {!hasTransferCall &&
                  !agentData?.config?.flow?.call_transfer?.phone && (
                    <button
                      onClick={() => handleTypeSelect('transfer_call')}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium">Transfer Call</div>
                        <div className="text-xs text-gray-500">
                          Transfer calls to human agents
                        </div>
                      </div>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>
                  )}
                <button
                  onClick={() => handleTypeSelect('custom')}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium">Custom Function</div>
                    <div className="text-xs text-gray-500">
                      Add a custom API function
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          )}

          {/* Transfer Call form */}
          {selectedType === 'transfer_call' && (
            <div>
              <div className="mb-6">
                <p className="text-sm text-gray-700">
                  Agent will be able to transfer calls to human agents.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Warning: This feature only works with Twilio phone numbers.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Transfer to phone number
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Set the phone number the agent will transfer the call to
                    when it decides to transfer
                  </p>
                  <input
                    type="tel"
                    value={newTool.number || ''}
                    onChange={(e) =>
                      setNewTool({ ...newTool, number: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="+1234567890"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Custom Instruction
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Set the custom instruction for the agent to decide when to
                    transfer the call
                  </p>
                  <textarea
                    value={newTool.instruction || ''}
                    onChange={(e) =>
                      setNewTool({ ...newTool, instruction: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg h-24 text-sm"
                    placeholder="Only transfer the call when..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Agent messages
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    The messages the agent will say while transferring the call
                  </p>
                  <div className="space-y-2">
                    {(newTool.messages || []).map((message, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="flex-1 text-sm bg-gray-50 px-3 py-2 rounded-lg">
                          {message}
                        </span>
                        <button
                          onClick={() => {
                            const messages = [...(newTool.messages || [])];
                            messages.splice(index, 1);
                            setNewTool({ ...newTool, messages });
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        placeholder="I'll transfer you to a human agent..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newMessage.trim()) {
                            setNewTool({
                              ...newTool,
                              messages: [
                                ...(newTool.messages || []),
                                newMessage.trim(),
                              ],
                            });
                            setNewMessage('');
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newMessage.trim()) {
                            setNewTool({
                              ...newTool,
                              messages: [
                                ...(newTool.messages || []),
                                newMessage.trim(),
                              ],
                            });
                            setNewMessage('');
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* End Call form */}
          {selectedType === 'end_call' && (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-700">
                  Agent can decide to terminate the call by itself.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Use with care: it’s recommended only with stronger LLMs like
                  GPT-4.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Custom Instruction
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Set the custom instruction for the agent to figure out when
                    it should terminate the call
                  </p>
                  <textarea
                    value={newTool.instruction || ''}
                    onChange={(e) =>
                      setNewTool({ ...newTool, instruction: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg h-24 text-sm"
                    placeholder="Only terminate the call when..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Termination Message
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    The message the agent will say right before ending the call
                  </p>
                  <input
                    type="text"
                    value={newTool.messages?.[0] || ''}
                    onChange={(e) =>
                      setNewTool({ ...newTool, messages: [e.target.value] })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Call ended. Goodbye!"
                  />
                </div>
              </div>
            </>
          )}

          {/* DTMF Dial form */}
          {selectedType === 'dtmf_dial' && (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-700">
                  Enable DTMF tone handling during calls.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This lets the agent interpret numeric keypad presses in-call.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    DTMF Handling Instructions
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    How the agent should interpret and respond to DTMF tones
                  </p>
                  <textarea
                    value={newTool.instruction || ''}
                    onChange={(e) =>
                      setNewTool({ ...newTool, instruction: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg h-24 text-sm"
                    placeholder="Press 1 for Sales, 2 for Support..."
                  />
                </div>
              </div>
            </>
          )}

          {/* Custom Function form */}
          {selectedType === 'custom' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Function Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={newTool.name}
                  onChange={(e) =>
                    setNewTool({ ...newTool, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Enter function name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={newTool.description}
                  onChange={(e) =>
                    setNewTool({ ...newTool, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg h-24 text-sm"
                  placeholder="Enter function description"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Webhook URL
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="url"
                  value={newTool.webhook}
                  onChange={(e) =>
                    setNewTool({ ...newTool, webhook: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Enter webhook URL"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Method: POST (fixed)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Configuration
                </label>
                <div className="space-y-2">
                  <textarea
                    value={JSON.stringify(
                      {
                        params: newTool.params || [],
                        header: newTool.header || {},
                        run_after_call: newTool.run_after_call ?? false,
                        exclude_session_id: newTool.exclude_session_id ?? false,
                      },
                      null,
                      2
                    )}
                    onChange={(e) => {
                      try {
                        const config = JSON.parse(e.target.value);
                        setNewTool({
                          ...newTool,
                          params: config.params,
                          header: config.header,
                          run_after_call: config.run_after_call,
                          exclude_session_id: config.exclude_session_id,
                        });
                      } catch (error) {
                        // If it's invalid JSON, we don't update state
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg h-64 font-mono text-sm"
                    // This placeholder will appear only if the text area’s value is empty,
                    // but since it’s controlled and not empty, it won't usually show.
                    placeholder={`{
  "params": [
    {
      "name": "string",
      "required": true,
      "type": "string",
      "description": "string"
    }
  ],
  "header": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  },
  "run_after_call": true,
  "exclude_session_id": true
}`}
                  />
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => {
                        const schema = {
                          params: [
                            {
                              name: 'string',
                              required: true,
                              type: 'string',
                              description: 'string',
                            },
                          ],
                          header: {
                            additionalProp1: 'string',
                            additionalProp2: 'string',
                            additionalProp3: 'string',
                          },
                          run_after_call: true,
                          exclude_session_id: true,
                        };
                        const blob = new Blob(
                          [JSON.stringify(schema, null, 2)],
                          { type: 'application/json' }
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'function-schema.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Download Schema Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedType('');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            {selectedType && (
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                disabled={
                  (selectedType === 'transfer_call' &&
                    (!newTool.number || !(newTool.messages || []).length)) ||
                  (selectedType === 'custom' &&
                    (!newTool.name || !newTool.description || !newTool.webhook))
                }
              >
                {editingTool ? 'Save Changes' : 'Add Function'}
              </button>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
