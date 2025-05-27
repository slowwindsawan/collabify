import React from 'react';
import { Sun, Moon, Database } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useDocumentsStore } from '../../store/documentsStore';
import DocumentsPopup from '../Documents/DocumentsPopup';

const Header: React.FC = () => {
  const { mode, toggleMode } = useThemeStore();
  const { currentKnowledgeBase } = useDocumentsStore();
  const [isPopupOpen, setIsPopupOpen] = React.useState(false);
  
  return (
    <header className={`h-16 ${mode === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm transition-colors duration-300 sticky top-0 z-10`}>
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center">
          <div className="font-semibold text-lg flex items-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600 font-bold">
              DocCollab
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <button 
              onClick={() => setIsPopupOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md hover:scale-105 transform transition-all shadow-sm ${mode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <Database size={18} />
              <span className="text-sm font-medium">{currentKnowledgeBase?.name || 'General'}</span>
            </button>
          </div>

          <button 
            onClick={toggleMode}
            className={`p-2 rounded-md hover:scale-105 transform transition-all shadow-sm ${mode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
      
      <DocumentsPopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
    </header>
  );
};

export default Header;