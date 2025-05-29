import { create } from "zustand";
import { AIMessage } from "../types";
import { supabase } from "../lib/supabase";

interface AIState {
  messages: unknown;
  isLoading: boolean;
  chatHistory: string;
  addMessage: (message: Omit<AIMessage, "id" | "timestamp">) => Promise<void>;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  updateChatHistory: () => void;
  loadMessages: (userId: string) => Promise<void>;
}

export const useAIStore = create<AIState>((set, get) => ({
  messages: [
    {
      id: "1",
      text: "Hello! I'm your AI assistant. How can I help with your document today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ],
  isLoading: false,
  chatHistory: "",

  loadMessages: async (userId: string, chat_id: any) => {
    if (!userId) {
      console.error("No user ID provided");
      return;
    }

    try {
      // First ensure we have a valid session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        return;
      }

      if (!session) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error("Session refresh error:", refreshError);
          return;
        }
      }

      // Fetch messages for this user
      const { data: messages, error: messagesError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", userId)
        .eq("chat_id", Number(chat_id))
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        return;
      }

      if (!messages) {
        console.log("No messages found for user:", userId);
        return;
      }

      const formattedMessages = messages.map((msg) => ({
        id: msg.id,
        text: msg.content,
        sender: msg.sender as "user" | "ai",
        timestamp: new Date(msg.created_at),
      }));

      set({
        messages: formattedMessages, // ✅ always set, even if []
        chatHistory: formattedMessages
          .slice(-10)
          .map((msg) => `${msg.sender}: ${msg.text}`)
          .join("\n"),
      });
    } catch (error) {
      console.error("Error in loadMessages:", error);
    }
  },

  addMessage: async (message, userId, chat_id) => {
    const newMessage = {
      id: crypto.randomUUID(),
      ...message,
      timestamp: new Date(),
    };

    try {
      set((state) => {
        const newMessages = [...state.messages, newMessage];
        return {
          messages: newMessages,
          chatHistory: newMessages
            .slice(-10)
            .map((msg) => `${msg.sender}: ${msg.text}`)
            .join("\n"),
        };
      });
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session?.user?.id) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw refreshError;

        const {
          data: { session: newSession },
        } = await supabase.auth.getSession();
        if (!newSession?.user?.id) throw new Error("No valid session");
      }

      const { error: insertError } = await supabase
        .from("chat_messages")
        .insert({
          id: newMessage.id,
          user_id: userId,
          content: newMessage.text,
          sender: newMessage.sender,
          created_at: newMessage.timestamp.toISOString(),
          chat_id: Number(chat_id),
        });

      if (insertError) throw insertError;
    } catch (error) {
      console.error("Error in addMessage:", error);
      throw error;
    }
  },

  clearMessages: () =>
    set({
      messages: [
        {
          id: "1",
          text: "Hello! I'm your AI assistant. How can I help with your document today?",
          sender: "ai",
          timestamp: new Date(),
        },
      ],
      chatHistory: "",
    }),

  setMessages: (messages: unknown) => {
    if (Array.isArray(messages)) {
      set({ messages });
    } else {
      console.error("setMessages expected an array, received:", messages);
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),

  updateChatHistory: () =>
    set((state) => ({
      chatHistory: state.messages
        .slice(-10)
        .map((msg) => `${msg.sender}: ${msg.text}`)
        .join("\n"),
    })),
}));
