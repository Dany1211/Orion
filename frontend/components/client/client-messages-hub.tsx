"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Paperclip,
  Pin,
  CheckCheck,
  Search,
  Filter,
  Sparkles,
  FileText,
  User,
  Clock,
  ArrowDownCircle,
  Download,
  CheckCircle2,
} from "lucide-react";
import { useClientPortal } from "@/lib/contexts/client-portal-context";
import { ClientMessage, MessageRole } from "@/lib/supabase/client-portal-types";

interface ClientMessagesHubProps {
  currentRole: "pm" | "client";
  projectId?: string;
  projectName?: string;
}

const TOPICS = [
  "All Topics",
  "Milestone Sign-off",
  "Requirement Clarification",
  "Meeting Follow-up",
  "Deliverables",
  "General",
];

const PM_TEMPLATES = [
  "Milestone is ready for your executive review & sign-off.",
  "We have updated the SRS Specification document with your feedback.",
  "Staging environment has been updated with the latest biometric auth build.",
  "Let's jump on a quick 15-minute video sync to align on upcoming deliverables.",
];

const CLIENT_TEMPLATES = [
  "Reviewed the latest deliverables. Everything looks solid!",
  "Can you clarify the token expiration TTL behavior?",
  "We have signed off on the milestone approval request.",
  "Could we schedule a follow-up video sync this afternoon?",
];

export function ClientMessagesHub({
  currentRole,
  projectId = "default",
  projectName = "FinTech Mobile Gateway",
}: ClientMessagesHubProps) {
  const { messages, sendMessage, clientSession } = useClientPortal();

  const [selectedTopic, setSelectedTopic] = React.useState("All Topics");
  const [inputText, setInputText] = React.useState("");
  const [activeTopicForNewMsg, setActiveTopicForNewMsg] = React.useState("General");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [attachmentName, setAttachmentName] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const senderName =
    currentRole === "pm"
      ? "Alex Rivera (Project Manager)"
      : clientSession?.client_name || "Sarah Jenkins";

  const senderEmail =
    currentRole === "pm" ? "alex@orion.ai" : clientSession?.client_email || "sarah.j@acmefintech.com";

  // Filter messages
  const filteredMessages = messages.filter((m) => {
    const matchTopic = selectedTopic === "All Topics" || m.topic === selectedTopic;
    const matchSearch =
      searchQuery === "" ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sender_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTopic && matchSearch;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, selectedTopic]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachmentName) return;

    await sendMessage({
      project_id: projectId,
      sender_role: currentRole,
      sender_name: senderName,
      sender_email: senderEmail,
      sender_avatar:
        currentRole === "pm"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
          : clientSession?.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces",
      content: inputText.trim(),
      topic: activeTopicForNewMsg,
      attachment_name: attachmentName || undefined,
      attachment_type: attachmentName ? "pdf" : undefined,
      read_by_recipient: false,
    });

    setInputText("");
    setAttachmentName(null);
  };

  const handleUseTemplate = (tmpl: string) => {
    setInputText(tmpl);
  };

  const handleSimulateAttachment = () => {
    setAttachmentName(`Orion_Specification_Report_v${(Math.random() * 2 + 1).toFixed(1)}.pdf`);
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm flex flex-col h-[750px] overflow-hidden">
      {/* ── Top Header ── */}
      <div className="px-6 py-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </span>
            <h2 className="text-base font-black text-zinc-900">
              {currentRole === "pm" ? "Client Communication Hub" : "Project Manager Direct Hub"}
            </h2>
          </div>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Real-time direct collaboration & threaded deliverables discussion for <span className="font-semibold text-zinc-700">{projectName}</span>
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversation…"
              className="pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* ── Topic Filter Chips ── */}
      <div className="px-6 py-2.5 border-b border-zinc-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1 flex items-center gap-1">
          <Filter className="h-3 w-3" /> Topics:
        </span>
        {TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTopic(t)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedTopic === t
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Message Thread Canvas ── */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-zinc-50/30">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400 space-y-3">
            <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-700">No messages in this topic yet</p>
              <p className="text-xs text-zinc-500 mt-0.5">Start the conversation with your partner below.</p>
            </div>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.sender_role === currentRole;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 max-w-2xl ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                <div className="h-9 w-9 rounded-full bg-zinc-200 overflow-hidden flex-shrink-0 border border-zinc-200">
                  {msg.sender_avatar ? (
                    <img src={msg.sender_avatar} alt={msg.sender_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {msg.sender_name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`space-y-1.5 ${isMe ? "items-end text-right" : "items-start text-left"}`}>
                  <div className={`flex items-center gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                    <span className="text-xs font-bold text-zinc-800">{msg.sender_name}</span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        msg.sender_role === "pm"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                          : "bg-cyan-50 text-cyan-700 border border-cyan-100"
                      }`}
                    >
                      {msg.sender_role === "pm" ? "Project Manager" : "Client"}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isMe
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white text-zinc-800 border border-zinc-150 rounded-tl-none"
                    }`}
                  >
                    {/* Topic tag badge inside bubble */}
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          isMe ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {msg.topic}
                      </span>
                      {msg.is_pinned && <Pin className="h-3 w-3 text-amber-300 fill-amber-300" />}
                    </div>

                    <p className="whitespace-pre-line text-left">{msg.content}</p>

                    {/* File Attachment (if present) */}
                    {msg.attachment_name && (
                      <div
                        className={`mt-3 p-2.5 rounded-xl flex items-center justify-between gap-3 border ${
                          isMe ? "bg-white/10 border-white/20 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-800"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-indigo-300 flex-shrink-0" />
                          <span className="font-semibold truncate">{msg.attachment_name}</span>
                        </div>
                        <button
                          className={`p-1 rounded-lg ${isMe ? "hover:bg-white/20" : "hover:bg-zinc-200"} transition-colors`}
                          title="Download attachment"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Read Receipt indicator */}
                  {isMe && (
                    <div className="flex items-center justify-end gap-1 text-[10px] text-zinc-400 pr-1">
                      <CheckCheck className="h-3 w-3 text-indigo-600" />
                      <span>Delivered</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Templates ── */}
      <div className="px-6 py-2 border-t border-zinc-100 bg-zinc-50/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
          <Sparkles className="h-3 w-3 text-indigo-500" /> Quick Replies:
        </span>
        {(currentRole === "pm" ? PM_TEMPLATES : CLIENT_TEMPLATES).map((tmpl, idx) => (
          <button
            key={idx}
            onClick={() => handleUseTemplate(tmpl)}
            className="text-[11px] font-medium bg-white hover:bg-indigo-50 text-zinc-700 hover:text-indigo-700 px-2.5 py-1 rounded-lg border border-zinc-200 hover:border-indigo-200 transition-colors whitespace-nowrap"
          >
            {tmpl}
          </button>
        ))}
      </div>

      {/* ── Message Composer ── */}
      <form onSubmit={handleSend} className="p-4 border-t border-zinc-100 bg-white space-y-2">
        {/* Attachment Pill (if selected) */}
        {attachmentName && (
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs text-indigo-700 font-semibold">
            <span className="flex items-center gap-1.5 truncate">
              <FileText className="h-3.5 w-3.5" /> Attached: {attachmentName}
            </span>
            <button
              type="button"
              onClick={() => setAttachmentName(null)}
              className="text-xs text-indigo-500 hover:text-indigo-800 ml-2 font-bold"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Topic Selector for new message */}
          <select
            value={activeTopicForNewMsg}
            onChange={(e) => setActiveTopicForNewMsg(e.target.value)}
            className="text-xs rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-2.5 text-zinc-700 font-semibold focus:outline-none focus:border-indigo-500"
          >
            {TOPICS.filter((t) => t !== "All Topics").map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={2}
              placeholder={`Write message to ${currentRole === "pm" ? "Client" : "Project Manager"} (Enter to send)…`}
              className="w-full text-xs rounded-xl border border-zinc-200 p-2.5 pr-10 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />
            <button
              type="button"
              onClick={handleSimulateAttachment}
              className="absolute right-2.5 bottom-3 text-zinc-400 hover:text-indigo-600 transition-colors"
              title="Attach Document / SRS Spec"
            >
              <Paperclip className="h-4 w-4" />
            </button>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() && !attachmentName}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
          >
            <span>Send</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
