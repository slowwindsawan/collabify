import React from 'react';
import { Editor } from '@tiptap/react';
import { useThemeStore } from '../../store/themeStore';
import {
  Bold,
  Italic,
  Underline,
  Code,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Image,
  Quote,
  RotateCcw,
  RotateCw,
  Strikethrough,
  Minus
} from 'lucide-react';

interface EditorMenuBarProps {
  editor: Editor;
}

const EditorMenuBar: React.FC<EditorMenuBarProps> = ({ editor }) => {
  const { mode } = useThemeStore();
  
  if (!editor) {
    return null;
  }
  
  const ButtonGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center space-x-1 mr-4">
      {children}
    </div>
  );
  
  const MenuButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }> = ({ onClick, isActive, disabled, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-md ${
        isActive 
          ? `${mode === 'dark' ? 'bg-gray-700 text-blue-400' : 'bg-blue-100 text-blue-700'}` 
          : `text-gray-500 hover:${mode === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
      title={title}
    >
      {children}
    </button>
  );
  
  const Separator = () => (
    <div className={`h-8 w-px ${mode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} mx-2`} />
  );

  return (
    <div className={`flex flex-wrap items-center px-4 py-2 overflow-x-auto border-b ${mode === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
      <ButtonGroup>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </MenuButton>
      </ButtonGroup>
      
      <Separator />
      
      <ButtonGroup>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <Underline size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </MenuButton>
      </ButtonGroup>
      
      <Separator />
      
      <ButtonGroup>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </MenuButton>
      </ButtonGroup>
      
      <Separator />
      
      <ButtonGroup>
        <MenuButton 
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight size={16} />
        </MenuButton>
      </ButtonGroup>
      
      <Separator />
      
      <ButtonGroup>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus size={16} />
        </MenuButton>
      </ButtonGroup>
      
      <Separator />
      
      <ButtonGroup>
        <MenuButton 
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <RotateCcw size={16} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <RotateCw size={16} />
        </MenuButton>
      </ButtonGroup>
    </div>
  );
};

export default EditorMenuBar;