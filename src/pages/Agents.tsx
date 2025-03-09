import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Agent {
  id: string;
  name: string;
  model: string;
  config?: {
    voice?: {
      provider?: string;
      name?: string;
      voice_id?: string;
    };
    llm?: {
      model?: string;
    };
  };
  created_at: Date;
  updated_at?: Date;
  avatar?: string;
}

export function Agents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const agentsRef = collection(db, 'users', user.uid, 'workspaces', '1', 'agents');
        const agentsSnapshot = await getDocs(agentsRef);
        
        const agentsList = agentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at && typeof doc.data().created_at.toDate === 'function' 
            ? doc.data().created_at.toDate() 
            : new Date(),
          updated_at: doc.data().updated_at && typeof doc.data().updated_at.toDate === 'function'
            ? doc.data().updated_at.toDate()
            : undefined,
        })) as Agent[];

        setAgents(agentsList);
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [user]);

  const handleCreateAgent = async () => {
    if (!user) return;
    
    setCreateLoading(true);
    try {
      // Simplified API data with just the required fields
      const createAgentData = {
        user_id: user.uid,
        workspace_id: '1',
        agent_data: {
          voice: {
            provider: "elevenlabs",
            voice_id: "21m00Tcm4TlvDq8ikWAM",
            name: "Rachel"
          },
          prompt: "",
          first_message: ""
        }
      };

      const response = await fetch('/api/create-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createAgentData),
      });

      const data = await response.json();
      
      if (data.success && data.agent_id) {
        navigate(`/agents/${data.agent_id}`);
      } else {
        throw new Error(data.error || 'Failed to create agent');
      }
    } catch (error) {
      console.error('Error creating agent:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Agents</h1>
          <p className="text-gray-600">
            Let's <span className="bg-blue-600 text-white px-2 py-0.5 rounded">boost your business</span> effortlessly with AI agents that get the job done!
          </p>
        </div>
        <button
          onClick={handleCreateAgent}
          disabled={createLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm disabled:opacity-50"
        >
          <Plus size={16} />
          <span>{createLoading ? 'Creating...' : 'Create Agent'}</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading agents...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div 
              key={agent.id}
              className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/agents/${agent.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <img 
                    src={agent.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name || 'New Agent')}&background=random`}
                    alt={agent.name || 'New Agent'}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium">{agent.name || 'New Agent'}</h3>
                    <div className="text-sm text-gray-500">
                      Model: {agent.config?.llm?.model || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Voice Provider: {agent.config?.voice?.provider || 'Unknown'}
                    </div>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal size={20} />
                </button>
              </div>
              <div className="text-xs text-gray-400">
                Created {agent.created_at.toLocaleDateString()}
                {agent.updated_at && ` • Updated ${agent.updated_at.toLocaleDateString()}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}