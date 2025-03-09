import React, { useState, useEffect, useRef } from 'react';
import { Plus, RefreshCw, Download, Trash2, Link, Upload, Type } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Dialog } from '../components/Dialog';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface KnowledgeBase {
  knowledge_base_id: string;
  knowledge_base_name: string;
  status: string;
  knowledge_base_sources: Array<{
    type: string;
    source_id: string;
    filename: string;
    file_url: string;
  }>;
  enable_auto_refresh: boolean;
  last_refreshed_timestamp: number;
}

type AddContentType = 'none' | 'webpages' | 'files' | 'text';

export function KnowledgeBase() {
  const { user } = useAuth();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKbName, setNewKbName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [webpageUrl, setWebpageUrl] = useState('');
  const [manualText, setManualText] = useState('');
  const [addContentType, setAddContentType] = useState<AddContentType>('none');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchKnowledgeBases();
  }, [user]);

  const fetchKnowledgeBases = async () => {
    if (!user) return;

    try {
      const response = await fetch('https://03279385-3d79-446e-89a3-82d7a644a6e3-00-7h1owk45iklh.sisko.replit.dev/api/list-knowledge-bases');
      const data = await response.json();
      setKnowledgeBases(data);
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleCreateKnowledgeBase = async () => {
    if (!user || !newKbName.trim()) return;
    if (addContentType === 'none') return;

    try {
      let documentUrls: string[] = [];
      let type = addContentType;

      if (addContentType === 'files' && selectedFiles.length > 0) {
        const storage = getStorage();
        for (const file of selectedFiles) {
          const storageRef = ref(storage, `knowledge-bases/${user.uid}/${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          documentUrls.push(url);
        }
      } else if (addContentType === 'webpages' && webpageUrl) {
        documentUrls = [webpageUrl];
      } else if (addContentType === 'text' && manualText) {
        // Store text content in Firebase Storage as a text file
        const storage = getStorage();
        const blob = new Blob([manualText], { type: 'text/plain' });
        const storageRef = ref(storage, `knowledge-bases/${user.uid}/manual-text-${Date.now()}.txt`);
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
        documentUrls = [url];
      }

      const response = await fetch('https://03279385-3d79-446e-89a3-82d7a644a6e3-00-7h1owk45iklh.sisko.replit.dev/api/create-knowledge-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          workspace_id: '1',
          knowledge_base_name: newKbName,
          document_urls: documentUrls,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create knowledge base');
      }

      // Reset form and close dialog
      setNewKbName('');
      setSelectedFiles([]);
      setWebpageUrl('');
      setManualText('');
      setAddContentType('none');
      setIsCreateDialogOpen(false);
      
      // Refresh the list
      fetchKnowledgeBases();
    } catch (error) {
      console.error('Error creating knowledge base:', error);
    }
  };

  const handleResync = async (kbId: string) => {
    try {
      await fetch(`https://backend-dig-agents-wannes.replit.app/api/resync-knowledge-base/${kbId}`, {
        method: 'POST',
      });
      fetchKnowledgeBases();
    } catch (error) {
      console.error('Error resyncing knowledge base:', error);
    }
  };

  const handleDelete = async (kbId: string) => {
    try {
      await fetch(`https://backend-dig-agents-wannes.replit.app/api/delete-knowledge-base/${kbId}`, {
        method: 'DELETE',
      });
      fetchKnowledgeBases();
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
    }
  };

  const renderAddContentOptions = () => {
    if (addContentType === 'none') {
      return (
        <div className="space-y-2">
          <button
            onClick={() => setAddContentType('webpages')}
            className="w-full flex items-center space-x-2 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Link size={20} className="text-gray-400" />
            <div>
              <div className="text-sm font-medium">Add web pages</div>
              <div className="text-xs text-gray-500">Crawl and sync your website</div>
            </div>
          </button>

          <button
            onClick={() => setAddContentType('files')}
            className="w-full flex items-center space-x-2 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Upload size={20} className="text-gray-400" />
            <div>
              <div className="text-sm font-medium">Upload files</div>
              <div className="text-xs text-gray-500">File size should be less than 100MB</div>
            </div>
          </button>

          <button
            onClick={() => setAddContentType('text')}
            className="w-full flex items-center space-x-2 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Type size={20} className="text-gray-400" />
            <div>
              <div className="text-sm font-medium">Add text</div>
              <div className="text-xs text-gray-500">Add articles manually</div>
            </div>
          </button>
        </div>
      );
    }

    switch (addContentType) {
      case 'webpages':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <input
              type="url"
              value={webpageUrl}
              onChange={(e) => setWebpageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com"
            />
          </div>
        );

      case 'files':
        return (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
            />
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-xs truncate">{file.name}</span>
                  <button
                    onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors"
              >
                <div className="text-center">
                  <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                  <div className="text-sm text-gray-600">Click to upload or drag and drop</div>
                  <div className="text-xs text-gray-500">Maximum file size: 100MB</div>
                </div>
              </button>
            </div>
          </div>
        );

      case 'text':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text Content
            </label>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
              placeholder="Enter your text content here..."
            />
          </div>
        );
    }
  };

  const isFormValid = () => {
    switch (addContentType) {
      case 'webpages':
        return newKbName.trim() && webpageUrl.trim();
      case 'files':
        return newKbName.trim() && selectedFiles.length > 0;
      case 'text':
        return newKbName.trim() && manualText.trim();
      default:
        return false;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold mb-2">Knowledge base</h1>
          <p className="text-sm text-gray-600">
            Centralize all your company's knowledge in <span className="bg-blue-600 text-white px-2 py-0.5 rounded">one powerful database</span>.
            This ensures our AI bots are perfectly trained <span className="bg-blue-600 text-white px-2 py-0.5 rounded">to provide seamless support</span> and help your customers like never before!
          </p>
        </div>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
        >
          <Plus size={16} />
          <span>Create database</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {knowledgeBases.map((kb) => (
            <div key={kb.knowledge_base_id} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  📄
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{kb.knowledge_base_name}</h3>
                  <p className="text-xs text-gray-500 truncate">
                    {kb.knowledge_base_sources[0]?.filename || 'No files'}
                  </p>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mb-4">
                <div>Uploaded by {user?.email}</div>
                <div>Pages: {kb.knowledge_base_sources.length}</div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleResync(kb.knowledge_base_id)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-xs"
                >
                  <RefreshCw size={14} />
                  <span>Re-sync</span>
                </button>
                <button
                  onClick={() => window.open(kb.knowledge_base_sources[0]?.file_url)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => handleDelete(kb.knowledge_base_id)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setNewKbName('');
          setSelectedFiles([]);
          setWebpageUrl('');
          setManualText('');
          setAddContentType('none');
        }}
        title="Add knowledge base"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Knowledge base name
            </label>
            <input
              type="text"
              value={newKbName}
              onChange={(e) => setNewKbName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter knowledge base name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Documents
            </label>
            {renderAddContentOptions()}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewKbName('');
                setSelectedFiles([]);
                setWebpageUrl('');
                setManualText('');
                setAddContentType('none');
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateKnowledgeBase}
              disabled={!isFormValid()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}