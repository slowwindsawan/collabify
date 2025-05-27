import React from 'react';
import { Editor } from '@tiptap/react';
import { useThemeStore } from '../../store/themeStore';
import {
  Bold,
  Italic,
  Underline,
  Code,
  Link,
  Highlighter,
  Strikethrough,
} from 'lucide-react';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

interface FloatingToolbarProps {
  editor: Editor;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ editor }) => {
  const { mode } = useThemeStore();

  const MenuButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }> = ({ onClick, isActive, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-1 rounded-md transition-all hover:scale-105 ${
        isActive 
          ? `${mode === 'dark' ? 'bg-gray-700 text-blue-400' : 'bg-blue-100 text-blue-700'}` 
          : `text-gray-500 hover:${mode === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`
      }`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div 
      className={`flex items-center space-x-1 p-1 rounded-lg shadow-lg border ${
        mode === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}
    >
      <MenuButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <Bold size={14} />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <Italic size={14} />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline"
      >
        <Underline size={14} />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough size={14} />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        title="Highlight"
      >
        <Highlighter size={14} />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Code"
      >
        <Code size={14} />
      </MenuButton>

      <MenuButton
        onClick={() => {
          const url = window.prompt('Enter the URL');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        isActive={editor.isActive('link')}
        title="Add Link"
      >
        <Link size={14} />
      </MenuButton>
    </div>
  );
};

export default FloatingToolbar;