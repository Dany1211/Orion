"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  Sparkles,
  Loader2,
  User,
  Copy,
  Check,
  ChevronDown,
  HelpCircle,
  Lightbulb,
  ShieldAlert,
  Flame,
  Layers
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface ProjectChatProps {
  projectId: string;
  projectName: string;
  projectDescription?: string;
  techStack?: string[];
  clientContext?: any;
}

export function ProjectChat({
  projectId,
  projectName,
  projectDescription,
  techStack = [],
  clientContext,
}: ProjectChatProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Load chat history from localStorage on project change
  React.useEffect(() => {
    if (!projectId) return;
    try {
      const saved = localStorage.getItem(`orion_chat_${projectId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(
          parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );
      } else {
        // Initial greeting
        setMessages([
          {
            id: "greeting",
            role: "assistant",
            content: `👋 Hi! I'm your AI assistant for **${projectName}**.\n\nI have full context on your requirements, sprints, architecture, and risks. Ask me anything about this project or pick a quick prompt below!`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
  }, [projectId, projectName]);

  // Save to localStorage
  React.useEffect(() => {
    if (!projectId || messages.length === 0) return;
    try {
      localStorage.setItem(`orion_chat_${projectId}`, JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save chat history", e);
    }
  }, [messages, projectId]);

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  const quickPrompts = [
    { label: "Summarize project", icon: Lightbulb, prompt: "Can you provide a high-level summary of this project and its key objectives?" },
    { label: "Key requirements", icon: Layers, prompt: "What are the highest priority requirements for this project, and what are their estimated efforts?" },
    { label: "Risk analysis", icon: ShieldAlert, prompt: "What technical and architectural risks exist in this project and how should we mitigate them?" },
    { label: "Sprint plan breakdown", icon: Flame, prompt: "Can you summarize our sprint schedule and what should be accomplished in the upcoming sprints?" },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (confirm("Clear chat history for this project?")) {
      const initialGreeting: Message = {
        id: "greeting-" + Date.now(),
        role: "assistant",
        content: `Chat history cleared. How can I help you with **${projectName}**?`,
        timestamp: new Date(),
      };
      setMessages([initialGreeting]);
      localStorage.removeItem(`orion_chat_${projectId}`);
    }
  };

  const handleSubmit = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: "msg-" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!overridePrompt) setInput("");
    setIsLoading(true);

    const assistantMsgId = "msg-" + (Date.now() + 1);
    const initialAssistantMessage: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, initialAssistantMessage]);

    try {
      // Send conversation to /api/chat
      const conversationPayload = newMessages
        .filter((m) => m.id !== "greeting" && !m.id.startsWith("greeting-"))
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          messages: conversationPayload,
          clientContext,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        streamedText += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: streamedText } : msg
          )
        );
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: `⚠️ **Error:** ${err.message || "Failed to generate response. Please ensure your GROQ_API_KEY is configured."}`,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
              }}
              className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-full shadow-xl shadow-blue-500/25 border border-blue-400/30 backdrop-blur-sm transition-all"
            >
              <div className="relative">
                <Bot className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white animate-pulse" />
              </div>
              <span className="text-sm font-semibold tracking-wide">Project AI</span>
              <Sparkles className="w-4 h-4 text-blue-200 group-hover:rotate-12 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Chat Modal / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? "auto" : "600px",
            }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden ${
              isMinimized ? "h-auto" : "h-[620px]"
            }`}
          >
            {/* Chat Header */}
            <div className="px-4 py-3.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white truncate">Orion AI</h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                      Groq AI
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate max-w-[180px]">
                    {projectName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearHistory}
                  title="Clear chat history"
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? "Expand" : "Minimize"}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body (hidden if minimized) */}
            {!isMinimized && (
              <>
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm scrollbar-thin scrollbar-thumb-slate-700">
                  {messages.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        {!isUser && (
                          <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}

                        <div
                          className={`relative group max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                            isUser
                              ? "bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20"
                              : "bg-slate-800/90 text-slate-200 rounded-bl-none border border-slate-700/60 shadow-md"
                          }`}
                        >
                          <div className="whitespace-pre-wrap leading-relaxed text-[13px] break-words">
                            {msg.content || (
                              <span className="flex items-center gap-1.5 text-slate-400 italic">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
                              </span>
                            )}
                          </div>

                          {!isUser && msg.content && (
                            <button
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-white bg-slate-700/80 rounded"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        {isUser && (
                          <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts */}
                {messages.length <= 2 && (
                  <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/50">
                    <p className="text-[11px] font-medium text-slate-400 mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-400" /> Suggested queries
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {quickPrompts.map((qp, i) => {
                        const Icon = qp.icon;
                        return (
                          <button
                            key={i}
                            onClick={() => handleSubmit(qp.prompt)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 text-left p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 text-[11px] text-slate-300 hover:text-white transition-all text-ellipsis overflow-hidden"
                          >
                            <Icon className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            <span className="truncate">{qp.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-3 bg-slate-800/80 border-t border-slate-700/60">
                  <div className="relative flex items-center">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Ask about ${projectName}...`}
                      rows={1}
                      disabled={isLoading}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3.5 pr-11 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none max-h-24 min-h-[40px]"
                    />
                    <button
                      onClick={() => handleSubmit()}
                      disabled={!input.trim() || isLoading}
                      className="absolute right-1.5 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400">
                    <span>Press Enter to send</span>
                    <span>Powered by Groq</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
