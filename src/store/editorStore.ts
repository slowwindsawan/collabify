import { create } from 'zustand';
import { Editor } from '@tiptap/react';

interface EditorState {
  content: string;
  editor: Editor | null;
  setContent: (content: string) => void;
  setEditor: (editor: Editor | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  content: '',
  editor: null,
  chats: [],
  currentChat: null,
  setContent: (content) => set({ content }),
  setEditor: (editor) => set({ editor }),
  setChats: (chats) => set({ chats }),
  setCurrentChat: (currentChat) => set({ currentChat })
}));
