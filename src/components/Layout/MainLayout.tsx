import React, { useEffect } from 'react';
import Header from './Header';
import Editor from '../Editor/Editor';
import AIAgent from '../AIAgent/AIAgent';
import { useThemeStore } from '../../store/themeStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { mode } = useThemeStore();
  const [aiPanelOpen, setAiPanelOpen] = React.useState(true);

  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  return (
    <div className={`h-screen flex flex-col ${mode === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex h-full overflow-hidden">
          <div className="flex-1 flex gap-4 p-4 overflow-hidden relative">
            <div className={`h-full min-h-0 transition-all duration-300 ${aiPanelOpen ? 'w-3/4' : 'w-full'}`}>
              <Editor />
            </div>
            
            <div className={`h-full min-h-0 transition-all duration-300 ${
              aiPanelOpen ? 'w-1/4 opacity-100' : 'w-0 opacity-0'
            } overflow-hidden`}>
              <div className="h-full relative">
                <AIAgent />
              </div>
            </div>

            <button
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className={`absolute right-4 top-20 p-1.5 rounded-lg ${
                mode === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
              } shadow-lg z-50`}
            >
              {aiPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;