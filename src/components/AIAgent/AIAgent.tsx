import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  X,
  Sparkles,
  Globe,
  Search,
  ExternalLink,
  Paperclip,
  User,
  Loader2,
  Check,
  XCircle,
  BotMessageSquare,
} from "lucide-react";
import { useAIStore } from "../../store/aiStore";
import { useDocumentsStore } from "../../store/documentsStore";
import { useEditorStore } from "../../store/editorStore";
import { useThemeStore } from "../../store/themeStore";
import { useEventStore } from "../../store/eventStore";
import { supabase } from "../../lib/supabase";

interface SuggestedChange {
  content: string;
  description: string;
}

interface WebSource {
  title: string;
  snippet: string;
  url: string;
}

function transformHtml(html) {
  // 1) Bullet-list transformation
  //    - matches any run of at least two "• something" segments
  const bulletListRegex = /((?:\s*•\s*[^•]+){1,})/g;
  html = html.replace(bulletListRegex, (match) => {
    const items = match
      .split("•")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return `<ul className="mt-2">${items
      .map(
        (item) =>
          `<li className="dark:text-gray-300 font-bold text-gray-600 font-mono text-sm">- ${item}</li>`
      )
      .join("")}</ul>`;
  });

  // 2) Anchor-break injection
  const anchorRegex = /(<a\b[^>]*>.*?<\/a>)/gi;
  return html.replace(anchorRegex, "<br/>$1");
}

const AIAgent: React.FC = () => {
  const { editor } = useEditorStore();
  const {
    messages,
    addMessage,
    isLoading,
    setLoading,
    chatHistory,
    loadMessages,
    setMessages,
  } = useAIStore();
  const { currentKnowledgeBase, userId, currentDocument, updateDocument } =
    useDocumentsStore();
  const { content: editorContent, setContent, currentChat } = useEditorStore();
  const { mode } = useThemeStore();
  const [userInput, setUserInput] = useState("");
  const [suggestedChange, setSuggestedChange] =
    useState<SuggestedChange | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [webSources, setWebSources] = useState<WebSource[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [tempVectors, setTempVectors] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setMessages(messages);
  }, [messages]);

  useEffect(() => {
    (async () => {
      let msgs = (await loadMessages(userId, currentChat)) || [];
      console.log(msgs);
      setWebSources([]);
      setSuggestedChange(null);
      // setMessages(msgs);
    })();
  }, [currentChat]);

  useEffect(() => {
    if (userId) {
      loadMessages(userId, currentChat);
    }
  }, [userId, loadMessages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`; // Max height of 100px
    }
  }, [userInput]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    try {
      setLoading(true);
      await addMessage(
        {
          text: `📎 Uploaded file: ${file.name}`,
          sender: "user",
        },
        userId,
        currentChat
      );

      // Upload file to session-files bucket
      const filePath = `${userId}/${crypto.randomUUID()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("session-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
        error: urlError,
      } = await supabase.storage.from("session-files").getPublicUrl(filePath);

      if (urlError) throw urlError;

      // Process the file
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      const functionUrl = `${
        import.meta.env.VITE_SUPABASE_URL
      }/functions/v1/process-document`;
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          kbId: currentKnowledgeBase?.id,
          fileUrl: publicUrl,
          fileName: file.name,
          isTemporary: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process file");
      }

      const result = await response.json();

      await addMessage(
        {
          text: `I've processed your file "${file.name}". What would you like to know about it?`,
          sender: "ai",
        },
        userId,
        currentChat
      );

      // Store temporary vectors in state
      if (result.tempVectors) {
        setTempVectors(result.tempVectors);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      await addMessage(
        {
          text: `Sorry, I couldn't process the file. ${
            error instanceof Error ? error.message : "Please try again."
          }`,
          sender: "ai",
        },
        userId,
        currentChat
      );
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAcceptChange = async () => {
    if (!suggestedChange) return;

    try {
      useEventStore
        .getState()
        .publish("contentUpdated", suggestedChange.content);
      setContent(suggestedChange.content);

      await addMessage(
        {
          text: "✨ I've applied the suggested changes to your document.",
          sender: "ai",
        },
        userId,
        currentChat
      );

      setSuggestedChange(null);
    } catch (error) {
      console.error("Error applying suggested changes:", error);
      await addMessage(
        {
          text: "Sorry, I couldn't apply the changes. Please try again.",
          sender: "ai",
        },
        userId,
        currentChat
      );
    }
  };

  const handleRejectChange = async () => {
    setSuggestedChange(null);
    await addMessage(
      {
        text: "I understand. Let me know if you'd like me to suggest something else.",
        sender: "ai",
      },
      userId,
      currentChat
    );
  };

  // Helper function to implement exponential backoff
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    retries = 3,
    currentDelay = 1000
  ) => {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        if (
          (response.status === 503 || response.status === 429) &&
          retries > 0
        ) {
          console.log(
            `Retrying request. Attempts remaining: ${retries}. Waiting ${currentDelay}ms...`
          );
          await delay(currentDelay);
          return fetchWithRetry(url, options, retries - 1, currentDelay * 2);
        }

        const errorText = await response.text();
        throw new Error(`Failed to get response from AI: ${errorText}`);
      }

      return response;
    } catch (error) {
      if (
        retries > 0 &&
        (error instanceof TypeError ||
          (error instanceof Error && error.message.includes("503")))
      ) {
        console.log(
          `Retrying request after error. Attempts remaining: ${retries}. Waiting ${currentDelay}ms...`
        );
        await delay(currentDelay);
        return fetchWithRetry(url, options, retries - 1, currentDelay * 2);
      }
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !currentKnowledgeBase || !userId || isLoading) {
      return;
    }

    await addMessage(
      {
        text: userInput,
        sender: "user",
      },
      userId,
      currentChat
    );

    setUserInput("");
    setLoading(true);
    setWebSources([]);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error("Failed to get session");
      }

      if (!session) {
        throw new Error("No session found");
      }

      // Get the current knowledge base context
      const kbContext = currentKnowledgeBase.documents.map((doc) => ({
        title: doc.name || doc.file_name,
        content: doc.content,
      }));

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const requestOptions = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          kbId: currentKnowledgeBase.id,
          query: userInput,
          editorContent,
          chatHistory,
          forceWebSearch: webSearchEnabled,
          kbContext,
          tempVectors,
        }),
      };

      const response = await fetchWithRetry(apiUrl, requestOptions);
      const data = await response.json();

      if (data.webSources && data.webSources.length > 0) {
        setWebSources(data.webSources);
      }

      if (data.usedWebSearch && webSearchEnabled) {
        setIsSearching(true);
        await addMessage(
          {
            text: "🔍 Searching the web for additional information...",
            sender: "ai",
          },
          userId,
          currentChat
        );

        await delay(2000);
        setIsSearching(false);

        await addMessage(
          {
            text: "I've consulted additional web sources to provide a more comprehensive answer.",
            sender: "ai",
          },
          userId,
          currentChat
        );
      }

      if (
        data.updatedContent &&
        data.updatedContent.replace(/<[^>]*>/g, "").trim().length > 0
      ) {
        setSuggestedChange({
          content: data.updatedContent,
          description: data.updatedContent,
        });

        await addMessage(
          {
            text: data.answer,
            sender: "ai",
          },
          userId,
          currentChat
        );
      } else {
        await addMessage(
          {
            text: data.answer,
            sender: "ai",
          },
          userId,
          currentChat
        );
      }

      if (data.relevantChunks && data.relevantChunks.length > 0) {
        const uniqueDocNames = Array.from(
          new Set(
            data.relevantChunks.map((chunk: any) => {
              const docMatch = chunk.chunk_text.match(/^File: (.+?)(?:\n|$)/);
              return docMatch ? docMatch[1] : "Unknown document";
            })
          )
        );

        const sourcesMessage =
          "📚 Sources referenced:\n" +
          uniqueDocNames
            .slice(0, 3)
            .map((name) => `• ${name}`)
            .join("\n");

        await addMessage(
          {
            text: sourcesMessage,
            sender: "ai",
          },
          userId,
          currentChat
        );
      }

      if (data.webSources && data.webSources.length > 0 && webSearchEnabled) {
        const webSourcesMessage =
          "🌐 Web sources referenced:\n" +
          data.webSources
            .map(
              (source: WebSource) =>
                `<a href="${source.url}" className="truncate text-blue-500">${source.url}</a>`
            )
            .join("\n");

        await addMessage(
          {
            text: webSourcesMessage,
            sender: "ai",
          },
          userId,
          currentChat
        );
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);

      if (error instanceof Error) {
        console.error({
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }

      await addMessage(
        {
          text:
            error instanceof Error
              ? `I apologize, but I encountered an error: ${error.message}. I'll try to handle this better next time.`
              : "I apologize, but I encountered an error while processing your request. Please try again in a moment.",
          sender: "ai",
        },
        userId,
        currentChat
      );
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className={`flex flex-col h-full rounded-lg overflow-hidden ${
        mode === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
      } border shadow-sm transition-colors duration-300`}
    >
      {/* Agent header */}
      <div
        className={`px-4 py-3 flex items-center justify-between border-b ${
          mode === "dark" ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="flex items-center">
          <Bot size={18} className="text-blue-500 mr-2" />
          <h3 className="font-medium">AI Writing Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            className={`p-1.5 rounded-full transition-colors ${
              webSearchEnabled
                ? "bg-blue-500 text-white"
                : `${
                    mode === "dark"
                      ? "text-gray-400 hover:bg-gray-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`
            }`}
            title={
              webSearchEnabled ? "Web search enabled" : "Web search disabled"
            }
          >
            <Globe size={16} />
          </button>
          <button
            className={`p-1 rounded-full ${
              mode === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
            } transition-colors`}
            onClick={() => useAIStore.getState().clearMessages()}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages container */}
      <div
        className={`flex-grow overflow-y-auto p-4 ${
          mode === "dark" ? "bg-gray-800" : "bg-gray-50"
        }`}
      >
        {messages.length ? (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-3 ${
                  message.sender === "user" ? "ml-auto" : ""
                } max-w-[90%]`}
              >
                <div
                  className={`flex items-start gap-2 ${
                    message.sender === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === "user"
                        ? "bg-blue-500"
                        : `${mode === "dark" ? "bg-gray-700" : "bg-gray-200"}`
                    }`}
                  >
                    {message.sender === "user" ? (
                      <User size={16} className="text-white" />
                    ) : (
                      <Bot size={16} className="text-blue-500" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      message.sender === "user"
                        ? `${
                            mode === "dark" ? "bg-blue-600" : "bg-blue-500"
                          } text-white`
                        : `${mode === "dark" ? "bg-gray-700" : "bg-white"} ${
                            mode === "dark" ? "text-white" : "text-gray-700"
                          } border ${
                            mode === "dark"
                              ? "border-gray-700"
                              : "border-gray-200"
                          }`
                    }`}
                    style={{ maxWidth: "90%" }}
                  >
                    <div
                      className="break-all overflow-auto"
                      dangerouslySetInnerHTML={{
                        __html: transformHtml(message.text),
                      }}
                    ></div>
                  </div>
                </div>
                <div
                  className={`text-xs mt-1 ${
                    message.sender === "user" ? "text-right" : ""
                  } ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-6">
              <BotMessageSquare size={64} />
              <h2 className="text-lg font-semibold mb-1">No messages yet</h2>
              <p className="text-sm text-gray-400">
                Start the conversation by sending a message.
              </p>
            </div>
          </>
        )}

        {(isLoading || isSearching) && (
          <div className="mb-3 max-w-[90%]">
            <div
              className={`rounded-lg px-3 py-2 inline-block ${
                mode === "dark" ? "bg-gray-700" : "bg-white"
              } ${mode === "dark" ? "text-white" : "text-gray-700"} border ${
                mode === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex items-center">
                {isSearching ? (
                  <>
                    <Globe
                      size={16}
                      className="text-blue-500 animate-spin mr-2"
                    />
                    <span>Searching web sources...</span>
                  </>
                ) : (
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
                      <span className="sr-only">Loading AI response...</span>
                    </div>
                    Loading AI response...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {suggestedChange && (
          <div
            className={`mb-3 p-4 rounded-lg border backdrop-blur-sm ${
              mode === "dark"
                ? "bg-gray-700/90 border-gray-600"
                : "bg-white/90 border-gray-200"
            } shadow-lg transform transition-all duration-200 hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center">
                <Sparkles size={16} className="text-blue-500 mr-2" />
                Suggested Changes
              </h4>
              <button
                onClick={() => setSuggestedChange(null)}
                className={`p-1 rounded-full hover:${
                  mode === "dark" ? "bg-gray-600" : "bg-gray-100"
                }`}
              >
                <X size={14} />
              </button>
            </div>
            <div
              className={`p-3 rounded-md mb-4 font-mono text-sm overflow-x-auto ${
                mode === "dark" ? "bg-gray-800" : "bg-gray-50"
              }`}
            >
              <div
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: suggestedChange.content }}
              ></div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleRejectChange}
                className={`flex items-center px-3 py-1.5 rounded-md ${
                  mode === "dark"
                    ? "bg-gray-600 hover:bg-gray-500"
                    : "bg-gray-200 hover:bg-gray-300"
                } transition-colors`}
              >
                <XCircle size={16} className="mr-1" />
                Reject
              </button>
              <button
                onClick={handleAcceptChange}
                className="flex items-center px-3 py-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <Check size={16} className="mr-1" />
                Accept
              </button>
            </div>
          </div>
        )}
        {webSources.length > 0 && webSearchEnabled && (
          <div
            className={`mb-3 p-3 rounded-lg ${
              mode === "dark" ? "bg-gray-700" : "bg-gray-100"
            }`}
          >
            <h4 className="font-medium mb-2 flex items-center">
              <Globe size={14} className="text-blue-500 mr-2" />
              Web Sources
            </h4>
            <div className="space-y-2">
              {webSources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block rounded flex items-center justify-between ${
                    mode === "dark"
                      ? "hover:text-blue-400"
                      : "hover:text-blue-400"
                  } transition-colors`}
                >
                  <p
                    className={`text-sm mt-1 truncate ${
                      mode === "dark"
                        ? "text-gray-400 hover:text-blue-500 text-bold"
                        : "text-gray-600 hover:text-blue-500 text-bold"
                    }`}
                    style={{ maxWidth: "calc(100% - 30px)" }}
                  >
                    {source.url}
                  </p>
                  <ExternalLink size={14} className="text-blue-500" />
                </a>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      <div
        className={`${
          mode === "dark"
            ? "bg-gray-750 border-gray-700"
            : "bg-gray-50 border-gray-200"
        } flex p-1 gap-2 scrollbar-none`}
        style={{
          height: "inherit !important",
          maxHeight: "50px",
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(255, 255, 255, 0)",
        }}
      >
        <button
          onClick={() => setUserInput("Can you help me improve this text?")}
          className={`text-xs whitespace-nowrap px-2 py-1 rounded-full border ${
            mode === "dark"
              ? "border-gray-600 hover:bg-gray-700"
              : "border-gray-300 hover:bg-gray-100"
          } flex items-center`}
        >
          <Sparkles size={12} className="mr-1 text-blue-500" />
          Improve text
        </button>
        <button
          onClick={() => setUserInput("Can you check this for errors?")}
          className={`text-xs whitespace-nowrap px-2 py-1 rounded-full border ${
            mode === "dark"
              ? "border-gray-600 hover:bg-gray-700"
              : "border-gray-300 hover:bg-gray-100"
          } flex items-center`}
        >
          <Search size={12} className="mr-1 text-blue-500" />
          Check errors
        </button>
        <button
          onClick={() => setUserInput("Can you make this more concise?")}
          className={`text-xs whitespace-nowrap px-2 py-1 rounded-full border ${
            mode === "dark"
              ? "border-gray-600 hover:bg-gray-700"
              : "border-gray-300 hover:bg-gray-100"
          } flex items-center`}
        >
          <Sparkles size={12} className="mr-1 text-blue-500" />
          Make concise
        </button>
      </div>

      {/* Input area */}
      <div
        className={`p-2 sm:p-3 border-t ${
          mode === "dark" ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div
          className={`flex items-end rounded-lg overflow-hidden border ${
            mode === "dark"
              ? "border-gray-700 bg-gray-700"
              : "border-gray-300 bg-white"
          }`}
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`px-2 sm:px-3 py-2 ${
              mode === "dark"
                ? "text-gray-400 hover:text-gray-300"
                : "text-gray-500 hover:text-gray-600"
            }`}
            disabled={isLoading}
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept=".txt,.md,.doc,.docx,.pdf"
          />
          <textarea
            ref={textareaRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type here..."
            className={`flex-grow px-2 sm:px-3 py-2 min-h-[40px] max-h-[100px] resize-none focus:outline-none ${
              mode === "dark"
                ? "bg-gray-700 text-white"
                : "bg-white text-gray-800"
            }`}
            style={{ lineHeight: "20px" }}
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isLoading || !currentKnowledgeBase}
            className={`px-2 sm:px-3 py-2 ${
              userInput.trim() && !isLoading && currentKnowledgeBase
                ? "text-blue-500 hover:text-blue-600"
                : "text-gray-400"
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* CSS for typing animation */}
      <style jsx>{`
        .dot-typing {
          position: relative;
          left: -9999px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: ${mode === "dark" ? "#fff" : "#333"};
          color: ${mode === "dark" ? "#fff" : "#333"};
          box-shadow: 9984px 0 0 0 currentColor, 9999px 0 0 0 currentColor,
            10014px 0 0 0 currentColor;
          animation: dot-typing 1.5s infinite linear;
        }

        @keyframes dot-typing {
          0% {
            box-shadow: 9984px 0 0 0 currentColor, 9999px 0 0 0 currentColor,
              10014px 0 0 0 currentColor;
          }
          16.667% {
            box-shadow: 9984px -10px 0 0 currentColor, 9999px 0 0 0 currentColor,
              10014px 0 0 0 currentColor;
          }
          33.333% {
            box-shadow: 9984px 0 0 0 currentColor, 9999px 0 0 0 currentColor,
              10014px 0 0 0 currentColor;
          }
          50% {
            box-shadow: 9984px 0 0 0 currentColor, 9999px -10px 0 0 currentColor,
              10014px 0 0 0 currentColor;
          }
          66.667% {
            box-shadow: 9984px 0 0 0 currentColor, 9999px 0 0 0 currentColor,
              10014px 0 0 0 currentColor;
          }
          83.333% {
            box-shadow: 9984px 0 0 0 currentColor, 9999px 0 0 0 currentColor,
              10014px -10px 0 0 currentColor;
          }
          100% {
            box-shadow: 9984px 0 0 0 currentColor, 9999px 0 0 0 currentColor,
              10014px 0 0 0 currentColor;
          }
        }

        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default AIAgent;
