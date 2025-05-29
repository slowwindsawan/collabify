import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/Layout/MainLayout';
import { useDocumentsStore } from './store/documentsStore';
import {useEditorStore} from './store/editorStore';
import { Loader2 } from 'lucide-react';
import { supabase, ensureAuthenticated } from './lib/supabase';

function App() {
  const { setUserId, fetchKnowledgeBases, isLoading } = useDocumentsStore();
  const { chats, setChats, setCurrentChat } = useEditorStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      setError('User ID is required. Please add ?user_id=YOUR_ID to the URL.');
      return;
    }

    const initializeApp = async () => {
      try {
        // Ensure user is authenticated
        const { data: { session, allChats } } = await ensureAuthenticated(userId);

        setChats(allChats || []);
        if(allChats.length){
          setCurrentChat(allChats[0].id);
        }
        
        if (!session) {
          throw new Error('Failed to authenticate');
        }

        // Set user ID and fetch knowledge bases
        setUserId(userId);
        await fetchKnowledgeBases();

      } catch (error: any) {
        console.error('Error initializing app:', error);
        const errorMessage = error.message || 'Failed to initialize the application';
        setError(`${errorMessage}. Please try refreshing the page.`);
      }
    };

    initializeApp();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-2">
            Error
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading your knowledge bases...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MainLayout />
      <Toaster position="top-right" />
    </>
  );
}

export default App;