"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  MessageSquare,
  Search,
  Send,
  ExternalLink,
  User,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Phone,
} from "lucide-react";

interface ConversationSummary {
  id: string;
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  orderTotal: number;
  customerName: string;
  businessName: string | null;
  customerPhone: string;
  unreadCount: number;
  lastMessage: string | null;
  lastMessageAt: string;
  lastMessageSender: string | null;
}

interface MessageItem {
  id: string;
  senderId: string;
  senderRole: string;
  content: string;
  createdAt: string;
  sender: { name: string };
}

interface AdminMessagesClientProps {
  initialConversations: ConversationSummary[];
}

export function AdminMessagesClient({ initialConversations }: AdminMessagesClientProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>(initialConversations);
  const [search, setSearch] = useState("");
  const [activeConvId, setActiveConvId] = useState<string | null>(
    initialConversations[0]?.id || null
  );

  const [activeMessages, setActiveMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      c.orderNumber.toLowerCase().includes(term) ||
      c.customerName.toLowerCase().includes(term) ||
      (c.businessName || "").toLowerCase().includes(term) ||
      c.customerPhone.includes(term)
    );
  });

  // Load messages for selected conversation
  useEffect(() => {
    if (!activeConvId || !activeConversation) return;

    let isMounted = true;
    setLoadingMessages(true);

    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/orders/${activeConversation.orderId}/sync`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.messages) {
            setActiveMessages(data.messages);
          }
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };

    loadMessages();

    // Mark as read
    fetch(`/api/admin/conversations/${activeConvId}/read`, { method: "POST" })
      .then(() => {
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConvId ? { ...c, unreadCount: 0 } : c))
        );
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [activeConvId, activeConversation?.orderId]);

  // Periodic polling for active conversation (HTTP polling as configured)
  useEffect(() => {
    if (!activeConvId || !activeConversation) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${activeConversation.orderId}/sync`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages) {
            setActiveMessages(data.messages);
          }
        }
      } catch (e) {
        console.error("Poll error:", e);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [activeConvId, activeConversation?.orderId]);

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !activeConversation) return;

    setSending(true);
    try {
      const res = await fetch(`/api/orders/${activeConversation.orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveMessages((prev) => [...prev, data.message]);
        setNewMessage("");

        // Update last message in sidebar
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? {
                  ...c,
                  lastMessage: data.message.content,
                  lastMessageAt: data.message.createdAt,
                  lastMessageSender: "OWNER",
                }
              : c
          )
        );
      } else {
        const err = await res.json();
        alert(err.error || "Failed to send message");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs h-[750px] flex flex-col md:flex-row">
      {/* LEFT: Conversation List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50">
        {/* Search header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search chats by retailer or order #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 transition"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No conversations found.</p>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const active = c.id === activeConvId;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`w-full text-left p-3.5 transition flex flex-col gap-1 border-l-2 ${
                    active
                      ? "bg-white dark:bg-slate-800/80 border-slate-900 dark:border-slate-100 shadow-2xs"
                      : "border-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[170px]">
                      {c.businessName || c.customerName}
                    </span>
                    <span className="text-[10px] text-slate-400 tabular-nums">
                      {formatDateTime(c.lastMessageAt).slice(11, 16)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-500 dark:text-slate-400">#{c.orderNumber}</span>
                    {c.unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-full text-[10px] font-bold">
                        {c.unreadCount} new
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic mt-0.5">
                    {c.lastMessage ? `"${c.lastMessage}"` : "No messages yet"}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Chat Window */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold flex items-center justify-center text-xs shrink-0">
                  {activeConversation.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    {activeConversation.businessName || activeConversation.customerName}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {activeConversation.orderStatus}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Retailer: {activeConversation.customerName}</span>
                    <span>•</span>
                    <span className="font-mono">{activeConversation.customerPhone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/orders/${activeConversation.orderId}`}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg transition flex items-center gap-1.5"
                >
                  Order #{activeConversation.orderNumber}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full text-xs text-slate-400">
                  Loading conversation history...
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-xs text-slate-400 space-y-1">
                  <MessageSquare className="w-8 h-8 opacity-40 mb-1" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No messages yet in this order thread.
                  </p>
                  <p className="text-slate-500">Send a message below to clarify quantities or commercial terms.</p>
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isOwner = msg.senderRole === "OWNER";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOwner ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">
                        <span className="font-medium">
                          {isOwner ? "Jagdamba Admin (You)" : msg.sender?.name || "Retailer"}
                        </span>
                        <span>•</span>
                        <span className="tabular-nums">{formatDateTime(msg.createdAt)}</span>
                      </div>
                      <div
                        className={`max-w-[75%] rounded-xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                          isOwner
                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-tr-none"
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Type wholesale order clarification or invoice update..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={2000}
                className="flex-1 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100 transition"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-semibold text-xs rounded-lg shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? "..." : "Send"}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
            <MessageSquare className="w-12 h-12 opacity-30 mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No Conversation Selected</p>
            <p className="text-slate-500">Pick a retailer order conversation from the left to read and reply.</p>
          </div>
        )}
      </div>
    </div>
  );
}
