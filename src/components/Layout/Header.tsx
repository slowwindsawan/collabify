import React, { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  Database,
  MessageCircle,
  MessagesSquareIcon,
  PlusCircleIcon,
} from "lucide-react";
import { useThemeStore } from "../../store/themeStore";
import { useDocumentsStore } from "../../store/documentsStore";
import DocumentsPopup from "../Documents/DocumentsPopup";
import { useEditorStore } from "../../store/editorStore";
import { createClient } from "@supabase/supabase-js";
import Toast from "../toast";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Header: React.FC = () => {
  const { mode, toggleMode } = useThemeStore();
  const { currentKnowledgeBase } = useDocumentsStore();
  const { chats, currentChat, setCurrentChat, setChats, content } =
    useEditorStore();
  const [isPopupOpen, setIsPopupOpen] = React.useState(false);
  const [chatTitle, setChatTitle] = React.useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [creating, setCreating] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const userId = searchParams.get("user_id");

  async function createNewChat() {
    setCreating(true);
    const { data, error: defaultChatError } = await supabase
      .from("chats")
      .insert({
        user_id: userId,
        title: "New chat",
        text: "",
      })
      .select();
    if (!defaultChatError){
      setShowToast(true)
    }
    let newChat = null;
    if (data?.length) {
      newChat = data[0];
      setChats([...data, ...chats]);
      setCurrentChat(data[0].id);
    }
    setCreating(false);
  }

  async function trySavingDocument() {
    setIsSaving(true);
    if (content) {
      try {
        const { data, error } = await supabase
          .from("chats")
          .update({ text: content })
          .eq("id", Number(currentChat));
        setIsSaving(false);
        setShowToast(true);
        if (error) {
          throw error;
        }

        let newChats = [];
        chats.forEach((chat) => {
          if (String(chat.id) === String(currentChat)) {
            newChats.push({ ...chat, text: content });
          } else {
            newChats.push(chat);
          }
        });
        setChats(newChats);
      } catch (e) {
        console.error("Error updating chat text:", e);
      }
    }
    setIsSaving(false);
  }

  const updateChatTitle = async (chatId: any, title: string) => {
    const { data, error } = await supabase
      .from("chats")
      .update({ title: title })
      .eq("id", Number(chatId));

    console.log("Update chat title response:", data, error);
    if (error) {
      throw error;
    }

    const newChats = [];
    chats.forEach((chat) => {
      if (String(chat.id) === String(chatId)) {
        newChats.push({ ...chat, title });
      } else {
        newChats.push(chat);
      }
    });
    setChats(newChats);
  };

  useEffect(() => {
    const selectedChat = chats.find(
      (chat) => String(chat.id) === String(currentChat)
    );
    setChatTitle(selectedChat?.title || "Untitled chat");
  }, [currentChat]); // 🔥 removed 'chats' from dependencies

  return (
    <header
      className={`h-16 ${
        mode === "dark" ? "bg-gray-800" : "bg-white"
      } shadow-sm transition-colors duration-300 sticky top-0 z-10`}
    >
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center">
          <div className="font-semibold text-lg flex items-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600 font-bold">
              DocCollab
            </span>
          </div>
        </div>

        <div>
          <input
            type="text"
            id="first_name"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ml-5"
            placeholder="Untitled"
            value={chatTitle}
            onInput={(e) => setChatTitle(e.target.value)}
            onChange={(e) => setChatTitle(e.target.value)}
            onBlur={() => updateChatTitle(currentChat, chatTitle)}
            required
          />
        </div>

        <form className="max-w-sm mx-auto flex items-center space-x-2 transition-shadow duration-300 p-2">
          <label
            for="countries"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white m-auto"
            style={{
              height: "100%",
            }}
          >
            <div
              className="flex items-center space-x-2 m-0 p-0"
              style={{
                margin: "auto",
              }}
            >
              <MessagesSquareIcon />
            </div>
          </label>
          <select
            id="countries"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 border-none outline-none bg-transparent border border-gray-200 focus:ring-blue-500 focus:border-blue-500 truncate"
            style={{ maxWidth: "250px" }}
            value={currentChat}
            onChange={(e) => {
              const selectedChatId = e.target.value;
              setCurrentChat(selectedChatId);
            }}
          >
            {chats.map((chat) => (
              <option key={chat.id} value={chat.id}>
                {chat.title || "Untitled Chat"}
              </option>
            ))}
          </select>
          {creating ? (
            <div className="flex items-center">
              <div role="status">
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 me-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
              Creating
            </div>
          ) : (
            <>
              <PlusCircleIcon
                size={30}
                className="cursor-pointer"
                onClick={createNewChat}
              />
            </>
          )}
        </form>
        <button
          className="text-xs flex text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          onClick={trySavingDocument}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <div role="status">
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 me-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            </>
          ) : (
            <></>
          )}
          Save
        </button>
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <button
              onClick={() => setIsPopupOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md hover:scale-105 transform transition-all shadow-sm ${
                mode === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <Database size={18} />
              <span className="text-sm font-medium">
                {currentKnowledgeBase?.name || "General"}
              </span>
            </button>
          </div>

          <button
            onClick={toggleMode}
            className={`p-2 rounded-md hover:scale-105 transform transition-all shadow-sm ${
              mode === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`}
          >
            {mode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      <DocumentsPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
      />
      <Toast
        message="Saved successfully!"
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </header>
  );
};

export default Header;
