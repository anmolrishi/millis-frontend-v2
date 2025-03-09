import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Phone, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Dialog } from '../components/Dialog';
import { collection, query, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface PhoneNumber {
  phone_number: string;
  phone_number_pretty: string;
  inbound_agent_id: string;
  outbound_agent_id: string;
  area_code: number;
  nickname: string;
  last_modification_timestamp: number;
}

interface Agent {
  agent_id: string;
  agent_name?: string;
}

export function PhoneNumbers() {
  const { user } = useAuth();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState<string | null>(
    null
  );
  const [tempNickname, setTempNickname] = useState('');
  const [areaCode, setAreaCode] = useState<number | ''>('');
  const [isOutboundCallDialogOpen, setIsOutboundCallDialogOpen] =
    useState(false);
  const [selectedFromNumber, setSelectedFromNumber] = useState<string>('');
  const [toPhoneNumber, setToPhoneNumber] = useState('');

  useEffect(() => {
    if (!user) return;

    // Set up real-time listeners for both collections
    const phoneNumbersRef = collection(
      db,
      'users',
      user.uid,
      'workspaces',
      '1',
      'phone_numbers'
    );
    const agentsRef = collection(
      db,
      'users',
      user.uid,
      'workspaces',
      '1',
      'agents'
    );

    // Listen to phone numbers
    const unsubscribePhoneNumbers = onSnapshot(phoneNumbersRef, (snapshot) => {
      const numbers = snapshot.docs.map((doc) => ({
        ...doc.data(),
        phone_number: doc.id,
      })) as PhoneNumber[];
      setPhoneNumbers(numbers);
      setLoading(false);
    });

    // Listen to agents
    const unsubscribeAgents = onSnapshot(agentsRef, (snapshot) => {
      const agentsList = snapshot.docs.map((doc) => ({
        agent_id: doc.id,
        ...doc.data(),
      })) as Agent[];
      setAgents(agentsList);
    });

    // Cleanup listeners
    return () => {
      unsubscribePhoneNumbers();
      unsubscribeAgents();
    };
  }, [user]);

  const handleUpdatePhoneNumber = async (
    phoneNumber: PhoneNumber,
    updates: Partial<PhoneNumber>
  ) => {
    try {
      const response = await fetch(
        'https://backend-dig-agents-wannes.replit.app/api/update-phone-number',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.uid,
            workspace_id: '1',
            ...phoneNumber,
            ...updates,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update phone number');
      }
    } catch (error) {
      console.error('Error updating phone number:', error);
    }
  };

  const handleCreatePhoneNumber = async () => {
    if (!user || !areaCode) return;

    try {
      const response = await fetch(
        'https://backend-dig-agents-wannes.replit.app/api/create-phone-number',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.uid,
            workspace_id: '1',
            area_code: Number(areaCode),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create phone number');
      }

      setIsAddDialogOpen(false);
      setAreaCode('');
    } catch (error) {
      console.error('Error creating phone number:', error);
    }
  };

  const handleDeletePhoneNumber = async (phoneNumber: string) => {
    try {
      const response = await fetch(
        `https://backend-dig-agents-wannes.replit.app/api/delete-phone-number/${phoneNumber}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete phone number');
      }
    } catch (error) {
      console.error('Error deleting phone number:', error);
    }
  };

  const handleMakeOutboundCall = async () => {
    try {
      const response = await fetch(
        'https://backend-dig-agents-wannes.replit.app/api/make-outbound-call',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from_phone_number: selectedFromNumber,
            to_phone_number: toPhoneNumber,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to initiate outbound call');
      }

      // Reset and close dialog on success
      setToPhoneNumber('');
      setSelectedFromNumber('');
      setIsOutboundCallDialogOpen(false);
    } catch (error) {
      console.error('Error making outbound call:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Phone numbers</h1>
        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
        >
          <Plus size={16} />
          <span>Add phone number</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Loading phone numbers...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {phoneNumbers.map((phoneNumber) => (
            <div
              key={phoneNumber.phone_number}
              className="bg-white rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  {isEditingNickname === phoneNumber.phone_number ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={tempNickname}
                        onChange={(e) => setTempNickname(e.target.value)}
                        className="px-2 py-1 border rounded text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          handleUpdatePhoneNumber(phoneNumber, {
                            nickname: tempNickname,
                          });
                          setIsEditingNickname(null);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditingNickname(null)}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{phoneNumber.nickname}</h3>
                      <button
                        onClick={() => {
                          setTempNickname(phoneNumber.nickname);
                          setIsEditingNickname(phoneNumber.phone_number);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    {phoneNumber.phone_number_pretty}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inbound call agent
                  </label>
                  <select
                    value={phoneNumber.inbound_agent_id}
                    onChange={(e) =>
                      handleUpdatePhoneNumber(phoneNumber, {
                        inbound_agent_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select agent</option>
                    {agents.map((agent) => (
                      <option key={agent.agent_id} value={agent.agent_id}>
                        {agent.agent_name || 'Single Prompt Agent'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Outbound call agent
                  </label>
                  <select
                    value={phoneNumber.outbound_agent_id}
                    onChange={(e) =>
                      handleUpdatePhoneNumber(phoneNumber, {
                        outbound_agent_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select agent</option>
                    {agents.map((agent) => (
                      <option key={agent.agent_id} value={agent.agent_id}>
                        {agent.agent_name || 'Single Prompt Agent'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedFromNumber(phoneNumber.phone_number);
                      setIsOutboundCallDialogOpen(true);
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    <Phone size={14} />
                    <span>Make an outbound call</span>
                  </button>
                  <button
                    onClick={() =>
                      handleDeletePhoneNumber(phoneNumber.phone_number)
                    }
                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Phone Number Dialog */}
      <Dialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setAreaCode('');
        }}
        title="Add phone number"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area code
            </label>
            <input
              type="number"
              value={areaCode}
              onChange={(e) =>
                setAreaCode(e.target.value ? Number(e.target.value) : '')
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="415"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setIsAddDialogOpen(false);
                setAreaCode('');
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePhoneNumber}
              disabled={!areaCode}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
            >
              Add phone number
            </button>
          </div>
        </div>
      </Dialog>

      {/* Make Outbound Call Dialog */}
      <Dialog
        isOpen={isOutboundCallDialogOpen}
        onClose={() => {
          setIsOutboundCallDialogOpen(false);
          setToPhoneNumber('');
        }}
        title="Make Outbound Call"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={toPhoneNumber}
              onChange={(e) => setToPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g. +11234567890"
            />
            <p className="mt-2 text-sm text-gray-500">
              International calls are currently not supported.
            </p>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setIsOutboundCallDialogOpen(false);
                setToPhoneNumber('');
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleMakeOutboundCall}
              disabled={!toPhoneNumber}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
            >
              Call
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
