import React, { useMemo } from 'react';
import { useDocumentsStore } from '../../store/documentsStore';
import { useThemeStore } from '../../store/themeStore';
import DocumentItem from './DocumentItem';
import { FolderOpen, Search } from 'lucide-react';

interface DocumentSidebarProps {
  closeSidebar: () => void;
}

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({ closeSidebar }) => {
  const { documents, searchQuery } = useDocumentsStore();
  const { mode } = useThemeStore();
  
  // Filter documents based on search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents;
    
    const lowerCaseQuery = searchQuery.toLowerCase();
    return documents.filter(
      doc => doc.title.toLowerCase().includes(lowerCaseQuery)
    );
  }, [documents, searchQuery]);
  
  // Sort documents by most recently updated
  const sortedDocuments = useMemo(() => {
    return [...filteredDocuments].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [filteredDocuments]);

  return (
    <div className={`flex flex-col h-full ${mode === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
      {/* Sidebar header */}
      <div className={`p-4 border-b ${mode === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="font-semibold text-lg flex items-center">
          <FolderOpen size={20} className="mr-2 text-blue-500" />
          Documents
        </h2>
      </div>
      
      {/* Empty state if no documents */}
      {documents.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-grow p-6 text-center">
          <div className={`rounded-full p-3 mb-3 ${mode === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <FolderOpen size={24} className="text-blue-500" />
          </div>
          <h3 className="font-medium mb-1">No documents yet</h3>
          <p className={`text-sm ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Create your first document by clicking the "New" button above.
          </p>
        </div>
      )}
      
      {/* Search results empty state */}
      {documents.length > 0 && filteredDocuments.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-grow p-6 text-center">
          <div className={`rounded-full p-3 mb-3 ${mode === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Search size={24} className="text-blue-500" />
          </div>
          <h3 className="font-medium mb-1">No results found</h3>
          <p className={`text-sm ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            We couldn't find any documents matching "{searchQuery}"
          </p>
        </div>
      )}
      
      {/* Document list */}
      {sortedDocuments.length > 0 && (
        <div className="overflow-y-auto p-2 flex-grow">
          {sortedDocuments.map((doc) => (
            <DocumentItem key={doc.id} document={doc} />
          ))}
        </div>
      )}
      
      {/* Mobile close button */}
      <div className="p-3 block md:hidden">
        <button
          onClick={closeSidebar}
          className={`w-full py-2 rounded-lg ${mode === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
        >
          Close Sidebar
        </button>
      </div>
    </div>
  );
};

export default DocumentSidebar;