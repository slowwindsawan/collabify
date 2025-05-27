import { create } from 'zustand';
import { Document, KnowledgeBase } from '../types';
import { processFile } from '../utils/fileHandlers';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface DocumentsState {
  knowledgeBases: KnowledgeBase[];
  currentKnowledgeBase: KnowledgeBase | null;
  currentDocument: Document | null;
  searchQuery: string;
  userId: string | null;
  isLoading: boolean;
  isProcessing: boolean;
  addKnowledgeBase: (kb: Omit<KnowledgeBase, 'id' | 'documents' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateKnowledgeBase: (id: string, updates: Partial<KnowledgeBase>) => Promise<void>;
  deleteKnowledgeBase: (id: string) => Promise<void>;
  addDocument: (doc: Document) => Promise<void>;
  removeDocument: (kbId: string, docId: string) => Promise<void>;
  updateDocument: (kbId: string, docId: string, content: string) => Promise<void>;
  setCurrentDocument: (doc: Document | null) => void;
  setCurrentKnowledgeBase: (kb: KnowledgeBase | null) => void;
  setSearchQuery: (query: string) => void;
  setUserId: (id: string) => void;
  fetchKnowledgeBases: () => Promise<void>;
  uploadDocument: (file: File, safeFileName: string) => Promise<void>;
  refreshCurrentKnowledgeBase: () => Promise<void>;
  fetchDocuments: (kbId: string) => Promise<void>;
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  knowledgeBases: [],
  currentKnowledgeBase: null,
  currentDocument: null,
  searchQuery: '',
  userId: null,
  isLoading: false,
  isProcessing: false,

  setUserId: (id) => set({ userId: id }),

  fetchDocuments: async (kbId) => {
    const { userId } = get();
    if (!userId) return;

    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('kb_id', kbId)
        .eq('user_id', userId);

      if (error) throw error;

      set((state) => ({
        knowledgeBases: state.knowledgeBases.map(kb =>
          kb.id === kbId ? { ...kb, documents: documents || [] } : kb
        ),
        currentKnowledgeBase: state.currentKnowledgeBase?.id === kbId
          ? { ...state.currentKnowledgeBase, documents: documents || [] }
          : state.currentKnowledgeBase
      }));
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    }
  },

  addKnowledgeBase: async (kb) => {
    const { userId } = get();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('knowledge_bases')
        .insert({
          user_id: userId,
          name: kb.name,
          description: kb.description,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        knowledgeBases: [...state.knowledgeBases, { ...data, documents: [] }],
      }));

      toast.success('Knowledge base created successfully');
    } catch (error) {
      console.error('Error creating knowledge base:', error);
      toast.error('Failed to create knowledge base');
      throw error;
    }
  },

  updateKnowledgeBase: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('knowledge_bases')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        knowledgeBases: state.knowledgeBases.map(kb =>
          kb.id === id ? { ...kb, ...updates } : kb
        ),
        currentKnowledgeBase: state.currentKnowledgeBase?.id === id
          ? { ...state.currentKnowledgeBase, ...updates }
          : state.currentKnowledgeBase,
      }));

      toast.success('Knowledge base updated successfully');
    } catch (error) {
      toast.error('Failed to update knowledge base');
      console.error('Error updating knowledge base:', error);
    }
  },

  deleteKnowledgeBase: async (id) => {
    try {
      // First get all documents for this knowledge base
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('id')
        .eq('kb_id', id);

      if (docsError) throw docsError;

      // Delete all document vectors for these documents
      if (documents && documents.length > 0) {
        const documentIds = documents.map(doc => doc.id);
        const { error: vectorsError } = await supabase
          .from('document_vectors')
          .delete()
          .in('document_id', documentIds);

        if (vectorsError) throw vectorsError;
      }

      // Delete all documents for this knowledge base
      const { error: deleteDocsError } = await supabase
        .from('documents')
        .delete()
        .eq('kb_id', id);

      if (deleteDocsError) throw deleteDocsError;

      // Finally delete the knowledge base
      const { error: deleteKbError } = await supabase
        .from('knowledge_bases')
        .delete()
        .eq('id', id);

      if (deleteKbError) throw deleteKbError;

      set((state) => ({
        knowledgeBases: state.knowledgeBases.filter(kb => kb.id !== id),
        currentKnowledgeBase: state.currentKnowledgeBase?.id === id
          ? state.knowledgeBases[0] || null
          : state.currentKnowledgeBase,
        currentDocument: state.currentDocument?.knowledgeBaseId === id ? null : state.currentDocument,
      }));

      toast.success('Knowledge base deleted successfully');
    } catch (error) {
      toast.error('Failed to delete knowledge base');
      console.error('Error deleting knowledge base:', error);
    }
  },

  fetchKnowledgeBases: async () => {
    const { userId } = get();
    if (!userId) return;

    set({ isLoading: true });

    try {
      // First fetch all knowledge bases
      const { data: kbs, error: kbError } = await supabase
        .from('knowledge_bases')
        .select('*')
        .eq('user_id', userId);

      if (kbError) throw kbError;

      // Then fetch all documents for this user
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId);

      if (docsError) throw docsError;

      // Map documents to their respective knowledge bases
      const knowledgeBases = kbs.map(kb => ({
        ...kb,
        documents: docs?.filter(doc => doc.kb_id === kb.id) || [],
      }));

      set({
        knowledgeBases,
        currentKnowledgeBase: knowledgeBases[0] || null,
      });
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
      toast.error('Failed to fetch knowledge bases');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addDocument: async (doc) => {
    const { userId } = get();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          kb_id: doc.knowledgeBaseId,
          user_id: userId,
          name: doc.title,
          content: doc.content,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        knowledgeBases: state.knowledgeBases.map(kb =>
          kb.id === doc.knowledgeBaseId
            ? { ...kb, documents: [...kb.documents, data] }
            : kb
        ),
        currentKnowledgeBase: state.currentKnowledgeBase?.id === doc.knowledgeBaseId
          ? { ...state.currentKnowledgeBase, documents: [...state.currentKnowledgeBase.documents, data] }
          : state.currentKnowledgeBase,
      }));

      toast.success('Document added successfully');
    } catch (error) {
      toast.error('Failed to add document');
      console.error('Error adding document:', error);
    }
  },

  removeDocument: async (kbId, docId) => {
    try {
      // Delete document vectors first
      const { error: vectorError } = await supabase
        .from('document_vectors')
        .delete()
        .eq('document_id', docId);

      if (vectorError) throw vectorError;

      // Then delete the document
      const { error: docError } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);

      if (docError) throw docError;

      set((state) => ({
        knowledgeBases: state.knowledgeBases.map(kb =>
          kb.id === kbId
            ? { ...kb, documents: kb.documents.filter(doc => doc.id !== docId) }
            : kb
        ),
        currentKnowledgeBase: state.currentKnowledgeBase?.id === kbId
          ? {
              ...state.currentKnowledgeBase,
              documents: state.currentKnowledgeBase.documents.filter(doc => doc.id !== docId),
            }
          : state.currentKnowledgeBase,
        currentDocument: state.currentDocument?.id === docId ? null : state.currentDocument,
      }));

      toast.success('Document removed successfully');
    } catch (error) {
      toast.error('Failed to remove document');
      console.error('Error removing document:', error);
    }
  },

  updateDocument: async (kbId, docId, content) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ content: content, updated_at: new Date().toISOString() })
        .eq('id', docId);

      if (error) throw error;

      set((state) => ({
        knowledgeBases: state.knowledgeBases.map(kb =>
          kb.id === kbId
            ? {
                ...kb,
                documents: kb.documents.map(doc =>
                  doc.id === docId
                    ? { ...doc, content, updated_at: new Date().toISOString() }
                    : doc
                ),
              }
            : kb
        ),
        currentKnowledgeBase: state.currentKnowledgeBase?.id === kbId
          ? {
              ...state.currentKnowledgeBase,
              documents: state.currentKnowledgeBase.documents.map(doc =>
                doc.id === docId
                  ? { ...doc, content, updated_at: new Date().toISOString() }
                  : doc
              ),
            }
          : state.currentKnowledgeBase,
        currentDocument: state.currentDocument?.id === docId
          ? { ...state.currentDocument, content, updated_at: new Date().toISOString() }
          : state.currentDocument,
      }));

      toast.success('Document updated successfully');
    } catch (error) {
      toast.error('Failed to update document');
      console.error('Error updating document:', error);
    }
  },

  setCurrentDocument: (doc) => set({ currentDocument: doc }),

  setCurrentKnowledgeBase: (kb) => set({ currentKnowledgeBase: kb }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  uploadDocument: async (file: File, safeFileName: string) => {
    const { userId, currentKnowledgeBase } = get();
    if (!userId || !currentKnowledgeBase) {
      throw new Error('No user or knowledge base selected');
    }

    set({ isProcessing: true });

    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw refreshError;
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (!newSession) throw new Error('Failed to get valid session');
      }

      // Generate a unique filename
      const uniqueFilename = `${crypto.randomUUID()}-${safeFileName}`;
      const filePath = `${userId}/${currentKnowledgeBase.id}/${uniqueFilename}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kb-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL for the file
      const { data: { publicUrl }, error: publicUrlError } = await supabase.storage
        .from('kb-files')
        .getPublicUrl(filePath);

      if (publicUrlError) throw publicUrlError;

      if (!publicUrl) {
        throw new Error('Failed to generate public URL for file');
      }

      // Process document using Edge Function
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          kbId: currentKnowledgeBase.id,
          fileUrl: publicUrl,
          fileName: file.name,
          isTemporary: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process document');
      }

      const result = await response.json();

      // Refresh the knowledge base to get the new document
      await get().refreshCurrentKnowledgeBase();

      toast.success('Document uploaded and processed successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload and process document');
      throw error;
    } finally {
      set({ isProcessing: false });
    }
  },

  refreshCurrentKnowledgeBase: async () => {
    const { currentKnowledgeBase, userId } = get();
    if (!currentKnowledgeBase || !userId) return;

    try {
      // Ensure we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        await supabase.auth.refreshSession();
      }

      const { data: kb, error: kbError } = await supabase
        .from('knowledge_bases')
        .select('*')
        .eq('id', currentKnowledgeBase.id)
        .single();

      if (kbError) throw kbError;

      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('kb_id', currentKnowledgeBase.id);

      if (docsError) throw docsError;

      const updatedKb = { ...kb, documents: docs || [] };

      set((state) => ({
        knowledgeBases: state.knowledgeBases.map(existingKb =>
          existingKb.id === updatedKb.id ? updatedKb : existingKb
        ),
        currentKnowledgeBase: updatedKb,
      }));
    } catch (error) {
      toast.error('Failed to refresh knowledge base');
      console.error('Error refreshing knowledge base:', error);
    }
  },
}));