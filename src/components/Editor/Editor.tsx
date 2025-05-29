import React, { useCallback, useEffect, useInsertionEffect, useRef } from "react";
import {
  useEditor,
  EditorContent,
  BubbleMenu,
  FloatingMenu,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useDocumentsStore } from "../../store/documentsStore";
import { useEditorStore } from "../../store/editorStore";
import { useEventStore } from "../../store/eventStore";
import { useThemeStore } from "../../store/themeStore";
import SlashCommands from "./extensions/SlashCommands";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  Underline as UnderlineIcon,
  Link,
  Highlighter,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Editor: React.FC = () => {
  const { currentDocument, updateDocument } = useDocumentsStore();
  const {
    content,
    setContent,
    setEditor: setGlobalEditor,
    currentChat,
    chats,
    setChats,
  } = useEditorStore();
  const { mode } = useThemeStore();

  const updateChatText = async (text: string) => {
    console.log("Updating chat text:", text);
    let chatId = currentChat;
    const { data, error } = await supabase
      .from("chats")
      .update({ text: text })
      .eq("id", Number(chatId));

    console.log("Update chat title response:", data, error);
    if (error) {
      throw error;
    }

    const newChats = [];
    chats.forEach((chat) => {
      if (String(chat.id) === String(chatId)) {
        newChats.push({ ...chat, text });
      } else {
        newChats.push(chat);
      }
    });
    setChats(newChats);
  };
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return "Type '/' for commands";
          }
          return "Type '/' for commands";
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      SlashCommands,
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setContent(newContent);

      if (currentDocument) {
        updateDocument(
          currentDocument.knowledgeBaseId,
          currentDocument.id,
          newContent
        );
      }
    },
    onCreate: ({ editor }) => {
      setContent(editor.getHTML());
      setGlobalEditor(editor);
    },
    onDestroy: () => {
      setGlobalEditor(null);
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none",
      },
    },
  });

  useEffect(() => {
    const unsubscribe = useEventStore
      .getState()
      .subscribe("contentUpdated", (data) => {
        editor?.commands.setContent(data);
        console.log("Updating the content");
      });

    return () => unsubscribe();
  }, [editor]);

  useEffect(() => {
    function setEditorContentOnChange() {
      if (editor) {
        let content = "";
        chats.forEach((chat) => {
          if (String(chat.id) === String(currentChat)) {
            content = chat.text;
          }
        });
        editor.commands.setContent(content || "");
      }
    }
    setEditorContentOnChange();
  }, [currentChat]);

  useEffect(() => {
    if (editor && currentDocument) {
      if (editor.getHTML() !== currentDocument.content) {
        editor.commands.setContent(currentDocument.content || "");
        updateChatText(currentDocument.content || "");
        setContent(currentDocument.content || "");
      }
    }
  }, [editor, currentDocument, setContent]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={`flex flex-col h-full rounded-lg overflow-hidden ${
        mode === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
      } border shadow-sm transition-colors duration-300`}
    >
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className={`flex items-center space-x-1 p-1 rounded-lg shadow-lg border ${
            mode === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded-md transition-all hover:scale-105 ${
              editor.isActive("bold")
                ? `${
                    mode === "dark"
                      ? "bg-gray-700 text-blue-400"
                      : "bg-blue-100 text-blue-700"
                  }`
                : `text-gray-500 hover:${
                    mode === "dark" ? "bg-gray-700" : "bg-gray-100"
                  }`
            }`}
          >
            <Bold size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded-md transition-all hover:scale-105 ${
              editor.isActive("italic")
                ? `${
                    mode === "dark"
                      ? "bg-gray-700 text-blue-400"
                      : "bg-blue-100 text-blue-700"
                  }`
                : `text-gray-500 hover:${
                    mode === "dark" ? "bg-gray-700" : "bg-gray-100"
                  }`
            }`}
          >
            <Italic size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded-md transition-all hover:scale-105 ${
              editor.isActive("underline")
                ? `${
                    mode === "dark"
                      ? "bg-gray-700 text-blue-400"
                      : "bg-blue-100 text-blue-700"
                  }`
                : `text-gray-500 hover:${
                    mode === "dark" ? "bg-gray-700" : "bg-gray-100"
                  }`
            }`}
          >
            <UnderlineIcon size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1 rounded-md transition-all hover:scale-105 ${
              editor.isActive("strike")
                ? `${
                    mode === "dark"
                      ? "bg-gray-700 text-blue-400"
                      : "bg-blue-100 text-blue-700"
                  }`
                : `text-gray-500 hover:${
                    mode === "dark" ? "bg-gray-700" : "bg-gray-100"
                  }`
            }`}
          >
            <Strikethrough size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-1 rounded-md transition-all hover:scale-105 ${
              editor.isActive("highlight")
                ? `${
                    mode === "dark"
                      ? "bg-gray-700 text-blue-400"
                      : "bg-blue-100 text-blue-700"
                  }`
                : `text-gray-500 hover:${
                    mode === "dark" ? "bg-gray-700" : "bg-gray-100"
                  }`
            }`}
          >
            <Highlighter size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1 rounded-md transition-all hover:scale-105 ${
              editor.isActive("code")
                ? `${
                    mode === "dark"
                      ? "bg-gray-700 text-blue-400"
                      : "bg-blue-100 text-blue-700"
                  }`
                : `text-gray-500 hover:${
                    mode === "dark" ? "bg-gray-700" : "bg-gray-100"
                  }`
            }`}
          >
            <Code size={14} />
          </button>
        </BubbleMenu>
      )}

      {editor && (
        <FloatingMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className={`flex items-center space-x-1 p-1 rounded-lg shadow-lg border ${
            mode === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`p-1 rounded-md transition-all hover:scale-105 ${
              editor.isActive("heading", { level: 1 })
                ? `${
                    mode === "dark"
                      ? "bg-gray-700 text-blue-400"
                      : "bg-blue-100 text-blue-700"
                  }`
                : `text-gray-500 hover:${
                    mode === "dark" ? "bg-gray-700" : "bg-gray-100"
                  }`
            }`}
          >
            <Heading1 size={14} />
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`p-1 rounded-md transition-all hover:scale-105 ${
              editor.isActive("heading", { level: 2 })
                ? `${
                    mode === "dark"
                      ? "bg-gray-700 text-blue-400"
                      : "bg-blue-100 text-blue-700"
                  }`
                : `text-gray-500 hover:${
                    mode === "dark" ? "bg-gray-700" : "bg-gray-100"
                  }`
            }`}
          >
            <Heading2 size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1 rounded-md transition-all hover:scale-105 ${
              editor.isActive("bulletList")
                ? `${
                    mode === "dark"
                      ? "bg-gray-700 text-blue-400"
                      : "bg-blue-100 text-blue-700"
                  }`
                : `text-gray-500 hover:${
                    mode === "dark" ? "bg-gray-700" : "bg-gray-100"
                  }`
            }`}
          >
            <List size={14} />
          </button>
        </FloatingMenu>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div
          className={`max-w-4xl mx-auto ${
            mode === "dark" ? "prose-invert" : ""
          } prose prose-lg`}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

export default Editor;
