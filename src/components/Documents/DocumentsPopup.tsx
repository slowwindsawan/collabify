import React, { useState, useRef } from 'react';
import { X, Search, Plus, File, Edit2, Trash2, Upload, Check, AlertCircle, Loader2, ExternalLink, Database } from 'lucide-react';
import { useDocumentsStore } from '../../store/documentsStore';
import { useThemeStore } from '../../store/themeStore';
import { KnowledgeBase } from '../../types';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface DocumentsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentsPopup: React.FC<DocumentsPopupProps> = ({ isOpen, onClose }) => {
  const { mode } = useThemeStore();
  const { 
    knowledgeBases, 
    currentKnowledgeBase,
    setCurrentKnowledgeBase,
    isLoading,
    isProcessing,
    fetchDocuments,
    userId
  } = useDocumentsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingKB, setIsCreatingKB] = useState(false);
  const [isEditingKB, setIsEditingKB] = useState(false);
  const [newKBName, setNewKBName] = useState('');
  const [newKBDescription, setNewKBDescription] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleCreateKB = async () => {
    if (!newKBName.trim()) return;
    setIsSubmitting(true);
    try {
      await useDocumentsStore.getState().addKnowledgeBase({
        name: newKBName,
        description: newKBDescription,
      });
      setIsCreatingKB(false);
      setNewKBName('');
      setNewKBDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateKB = async () => {
    if (!newKBName.trim() || !currentKnowledgeBase) return;
    setIsSubmitting(true);
    try {
      await useDocumentsStore.getState().updateKnowledgeBase(currentKnowledgeBase.id, {
        name: newKBName,
        description: newKBDescription,
      });
      setIsEditingKB(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKB = async () => {
    if (currentKnowledgeBase && confirm('Are you sure you want to delete this knowledge base?')) {
      setIsSubmitting(true);
      try {
        await useDocumentsStore.getState().deleteKnowledgeBase(currentKnowledgeBase.id);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleKnowledgeBaseClick = async (kb: KnowledgeBase) => {
    try {
      setIsLoadingDocuments(true);
      setCurrentKnowledgeBase(kb);
      await fetchDocuments(kb.id);
    } catch (error) {
      console.error('Error fetching knowledge base documents:', error);
      toast.error('Failed to fetch documents');
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentKnowledgeBase) {
      setUploadStatus('idle');
      setUploadMessage('');
      
      try {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File size exceeds 10MB limit');
        }

        const allowedTypes = ['.txt', '.md', '.doc', '.docx', '.pdf'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedTypes.includes(fileExtension)) {
          throw new Error('Unsupported file type. Please upload a .txt, .md, .doc, .docx, or .pdf file');
        }

        const safeFileName = file.name.replace(/[^\w\s.-]/g, '_');
        
        await useDocumentsStore.getState().uploadDocument(file, safeFileName);
        setUploadStatus('success');
        setUploadMessage(`Successfully uploaded "${file.name}"`);
        
        setTimeout(() => {
          setUploadStatus('idle');
          setUploadMessage('');
        }, 3000);
      } catch (error) {
        console.error('Error uploading document:', error);
        setUploadStatus('error');
        setUploadMessage(error instanceof Error ? error.message : 'Failed to upload document');
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileClick = async (filePath: string) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        await supabase.auth.refreshSession();
      }
      window.open(filePath, '_blank');
    } catch (error) {
      console.error('Error opening document:', error);
    }
  };

  const filteredDocuments = currentKnowledgeBase?.documents.filter(doc => 
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className={`w-full max-w-4xl rounded-xl shadow-xl ${mode === 'dark' ? 'bg-gray-800' : 'bg-white'} p-8`}>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
            <p className="text-lg">Loading knowledge bases...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div 
        ref={popupRef}
        className={`w-full max-w-4xl rounded-xl shadow-xl ${mode === 'dark' ? 'bg-gray-800' : 'bg-white'} p-3 sm:p-6 relative max-h-[95vh] flex flex-col`}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold flex items-center">
            <Database className="mr-2 text-blue-500 hidden sm:inline" size={24} />
            <Database className="mr-2 text-blue-500 sm:hidden" size={20} />
            Knowledge Base
          </h2>
          <button 
            onClick={onClose}
            className={`p-1.5 sm:p-2 rounded-full hover:${mode === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} transition-colors`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {knowledgeBases.map(kb => (
            <div
              key={kb.id}
              onClick={() => handleKnowledgeBaseClick(kb)}
              className={`relative group cursor-pointer p-3 sm:p-4 rounded-lg ${
                mode === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              } ${currentKnowledgeBase?.id === kb.id ? 'ring-2 ring-blue-500' : ''} transition-all duration-200`}
            >
              <h3 className="font-semibold mb-1 pr-8 text-sm sm:text-base">{kb.name}</h3>
              <p className={`text-xs sm:text-sm ${mode === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-2 line-clamp-2`}>
                {kb.description || 'No description'}
              </p>
              <div className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {kb.documents.length} {kb.documents.length === 1 ? 'document' : 'documents'}
              </div>
            </div>
          ))}
          
          <button
            onClick={() => setIsCreatingKB(true)}
            className={`p-3 sm:p-4 flex flex-col items-center justify-center rounded-lg ${
              mode === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            } transition-all duration-200 border-2 border-dashed ${
              mode === 'dark' ? 'border-gray-600' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          >
            <Plus size={20} sm:size={24} className="mb-2 text-blue-500" />
            <span className="text-xs sm:text-sm font-medium">New Knowledge Base</span>
          </button>
        </div>

        {currentKnowledgeBase && !isCreatingKB && !isEditingKB && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold">{currentKnowledgeBase.name}</h3>
                <p className={`text-xs sm:text-sm ${mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {currentKnowledgeBase.description}
                </p>
              </div>
              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={() => {
                    setNewKBName(currentKnowledgeBase.name);
                    setNewKBDescription(currentKnowledgeBase.description);
                    setIsEditingKB(true);
                  }}
                  className={`p-1.5 sm:p-2 rounded-full ${mode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  disabled={isSubmitting}
                >
                  <Edit2 size={14} sm:size={16} />
                </button>
                <button
                  onClick={handleDeleteKB}
                  className={`p-1.5 sm:p-2 rounded-full ${mode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  disabled={isSubmitting}
                >
                  <Trash2 size={14} sm:size={16} className="text-red-500" />
                </button>
              </div>
            </div>

            <div className={`flex items-center ${mode === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg px-3 sm:px-4 py-2 mb-4`}>
              <Search size={16} sm:size={18} className="text-gray-400" />
              <input 
                type="text"
                placeholder="Search documents..."
                className={`ml-2 w-full text-sm sm:text-base ${mode === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} focus:outline-none`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="mb-2 flex items-center justify-between">
              <p className={`text-xs sm:text-sm ${mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'} found
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-blue-500 mr-2" />
                  <span className={`text-sm sm:text-base ${mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Loading documents...
                  </span>
                </div>
              ) : filteredDocuments.length > 0 ? (
                <div className="grid gap-2">
                  {filteredDocuments.map(doc => (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between p-2 sm:p-3 rounded-lg group ${
                        mode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div 
                        className="flex items-center flex-grow cursor-pointer"
                        onClick={() => handleFileClick(doc.file_path)}
                      >
                        <File size={16} sm:size={18} className="mr-2 sm:mr-3 text-gray-400" />
                        <span className="flex-grow truncate text-sm sm:text-base">{doc.name || doc.file_name}</span>
                        <ExternalLink size={14} sm:size={16} className="ml-2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <button
                        onClick={() => useDocumentsStore.getState().removeDocument(currentKnowledgeBase.id, doc.id)}
                        className={`p-1 sm:p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                          mode === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                        }`}
                      >
                        <Trash2 size={12} sm:size={14} className="text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 text-sm sm:text-base ${mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {searchQuery ? 'No documents match your search' : 'No documents in this knowledge base'}
                </div>
              )}
            </div>

            {uploadStatus !== 'idle' && (
              <div className={`mt-4 p-2 sm:p-3 rounded-lg flex items-center text-sm sm:text-base ${
                uploadStatus === 'success' 
                  ? `${mode === 'dark' ? 'bg-green-900/30' : 'bg-green-100'} text-green-500`
                  : `${mode === 'dark' ? 'bg-red-900/30' : 'bg-red-100'} text-red-500`
              }`}>
                {uploadStatus === 'success' ? (
                  <Check size={16} sm:size={18} className="mr-2" />
                ) : (
                  <AlertCircle size={16} sm:size={18} className="mr-2" />
                )}
                <span>{uploadMessage}</span>
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center justify-center space-x-2 py-2 sm:py-3 px-3 sm:px-4 rounded-lg w-full text-sm sm:text-base ${
                  mode === 'dark' 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-100 hover:bg-gray-200'
                } transition-colors`}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} sm:size={18} className="animate-spin mr-2" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} sm:size={18} className="mr-2" />
                    <span>Upload Document</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.doc,.docx,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {(isCreatingKB || isEditingKB) && (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={newKBName}
                onChange={(e) => setNewKBName(e.target.value)}
                className={`w-full p-2 sm:p-3 rounded-lg text-sm sm:text-base ${
                  mode === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Knowledge Base Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newKBDescription}
                onChange={(e) => setNewKBDescription(e.target.value)}
                className={`w-full p-2 sm:p-3 rounded-lg text-sm sm:text-base ${
                  mode === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                placeholder="Knowledge Base Description"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setIsCreatingKB(false);
                  setIsEditingKB(false);
                }}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  mode === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                } transition-colors`}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={isCreatingKB ? handleCreateKB : handleUpdateKB}
                className={`px-3 sm:px-4 py-2 rounded-lg bg-blue-500 text-white flex items-center text-sm sm:text-base ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-600'
                } transition-colors`}
                disabled={isSubmitting || !newKBName.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} sm:size={16} className="animate-spin mr-2" />
                    <span>{isCreatingKB ? 'Creating...' : 'Updating...'}</span>
                  </>
                ) : (
                  <span>{isCreatingKB ? 'Create' : 'Update'}</span>
                )}
              </button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg backdrop-blur-sm">
            <div className="flex flex-col items-center bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg">
              <Loader2 size={36} sm:size={48} className="animate-spin text-blue-500 mb-3 sm:mb-4" />
              <p className="text-sm sm:text-lg">Processing document...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPopup;