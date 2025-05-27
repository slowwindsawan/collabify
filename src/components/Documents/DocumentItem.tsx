import React, { useState } from 'react';
import { FileText, FileCode, FileImage, FileSpreadsheet, File as FilePdf, FileArchive, FileVideo, FileAudio, File, Trash2, Clock, Database, Loader2 } from 'lucide-react';
import { Document } from '../../types';
import { useDocumentsStore } from '../../store/documentsStore';
import { useThemeStore } from '../../store/themeStore';

interface DocumentItemProps {
  document: Document;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ document }) => {
  const { setCurrentDocument, removeDocument, currentDocument, knowledgeBases } = useDocumentsStore();
  const { mode } = useThemeStore();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await removeDocument(document.knowledgeBaseId, document.id);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const isActive = currentDocument?.id === document.id;
  const knowledgeBase = knowledgeBases.find(kb => kb.id === document.knowledgeBaseId);

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconProps = { 
      size: 18,
      className: isActive ? 'text-blue-500' : `${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`
    };

    switch (extension) {
      case 'txt':
      case 'doc':
      case 'docx':
      case 'rtf':
      case 'odt':
        return <FileText {...iconProps} />;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'html':
      case 'css':
      case 'json':
      case 'xml':
      case 'md':
        return <FileCode {...iconProps} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp':
        return <FileImage {...iconProps} />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet {...iconProps} />;
      case 'pdf':
        return <FilePdf {...iconProps} />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return <FileArchive {...iconProps} />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return <FileVideo {...iconProps} />;
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'm4a':
        return <FileAudio {...iconProps} />;
      default:
        return <File {...iconProps} />;
    }
  };
  
  return (
    <div 
      className={`p-3 mb-1 rounded-lg cursor-pointer transition-colors duration-200 flex items-start group hover:bg-opacity-80 ${
        isActive 
          ? `${mode === 'dark' ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-100'}` 
          : `hover:${mode === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`
      }`}
      onClick={() => setCurrentDocument(document)}
    >
      <div className="mr-3 mt-1">
        {getFileIcon(document.file_name)}
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleDelete}
            className={`ml-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:${mode === 'dark' ? 'bg-gray-600' : 'bg-gray-200'} focus:opacity-100 transition-opacity ${isDeleting ? 'opacity-100 cursor-not-allowed' : ''}`}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 size={14} className="text-red-500 animate-spin" />
            ) : (
              <Trash2 size={14} className="text-red-500" />
            )}
          </button>
        </div>
        <div className={`flex items-center justify-between text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
          <div className="flex items-center">
            <Clock size={12} className="mr-1" />
            <span>Updated {formatDate(document.updatedAt)}</span>
          </div>
          <div className="flex items-center ml-2">
            <Database size={12} className="mr-1" />
            <span>{knowledgeBase?.name || 'General'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentItem;