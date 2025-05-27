export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  knowledgeBaseId: string;
  name: string;
  file_name: string;
  file_path: string;
}

export interface AIMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export type ThemeMode = 'light' | 'dark';

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documents: Document[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  sender: 'user' | 'ai';
  created_at: string;
}