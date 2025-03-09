// Helper function to construct API URLs - now using relative paths
const getUrl = (endpoint: string) => `https://03279385-3d79-446e-89a3-82d7a644a6e3-00-7h1owk45iklh.sisko.replit.dev${endpoint}`;

// API functions
export const api = {
  // Agents
  createAgent: async (data: any) => {
    const response = await fetch(getUrl('/api/create-agent'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getAgent: async (agentId: string) => {
    const response = await fetch(getUrl(`/api/get-agent?agent_id=${agentId}`));
    return response.json();
  },

  updateAgent: async (data: any) => {
    const response = await fetch(getUrl('/api/update-agent'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  listAgents: async (userId: string, workspaceId: string) => {
    const response = await fetch(
      getUrl(`/api/list-agents?user_id=${userId}&workspace_id=${workspaceId}`)
    );
    return response.json();
  },

  // Knowledge Base
  listKnowledgeBases: async () => {
    const response = await fetch(getUrl('/api/list-knowledge-bases'));
    return response.json();
  },

  createKnowledgeBase: async (data: any) => {
    const response = await fetch(getUrl('/api/create-knowledge-base'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Voices
  listVoices: async () => {
    const response = await fetch(getUrl('/api/list-voices'));
    return response.json();
  },

  // Web Calls
  startWebCall: async (agentId: string) => {
    const response = await fetch(getUrl('/api/start-web-call'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agent_id: agentId }),
    });
    return response.json();
  },

  // Phone Numbers
  listPhoneNumbers: async () => {
    const response = await fetch(getUrl('/api/list-phone-numbers'));
    return response.json();
  },

  createPhoneNumber: async (data: any) => {
    const response = await fetch(getUrl('/api/create-phone-number'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  updatePhoneNumber: async (data: any) => {
    const response = await fetch(getUrl('/api/update-phone-number'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deletePhoneNumber: async (phoneNumber: string) => {
    const response = await fetch(getUrl(`/api/delete-phone-number/${phoneNumber}`), {
      method: 'DELETE',
    });
    return response.json();
  },

  makeOutboundCall: async (data: any) => {
    const response = await fetch(getUrl('/api/make-outbound-call'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};