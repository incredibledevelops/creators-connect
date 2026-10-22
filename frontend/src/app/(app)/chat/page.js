"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import ConversationList from "@/components/chat/ConversationList";
import MessageList from "@/components/chat/MessageList";
import Composer from "@/components/chat/Composer";
import { useAuth } from "@/lib/auth-context";
import { createChatSocket } from "@/lib/websocket";

export default function ChatPage() {
  const { accessToken } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState({});
  const socketRef = useRef(null);

  const loadConversations = async () => {
    try {
      const res = await api.get("/chat/conversations");
      setConversations(res.conversations || []);
      if (!activeId && res.conversations?.length) {
        setActiveId(res.conversations[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async (id) => {
    if (!id) return;
    try {
      const res = await api.get(`/chat/conversations/${id}/messages?limit=100`);
      setMessages(res.messages || []);
      await api.post(`/chat/conversations/${id}/read`, {});
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c))
      );
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);

    if (socketRef.current) socketRef.current.close();
    if (!accessToken) return;

    socketRef.current = createChatSocket(activeId, accessToken, {
      onMessage: (msg) => {
        setMessages((prev) => [...prev, msg]);
      },
      onTyping: (payload) => {
        setTyping((prev) => ({ ...prev, [payload.user_id]: payload.is_typing ? payload.name : null }));
      },
    });

    return () => socketRef.current?.close();
  }, [activeId, accessToken]);

  const sendMessage = async (content, attachments = []) => {
    if (!activeId) return;
    try {
      const res = await api.post(`/chat/conversations/${activeId}/messages`, {
        content,
        attachments,
      });
      setMessages((prev) => [...prev, res.message]);
    } catch (e) {
      console.error(e);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">Messages</h1>
        <p className="text-slate-500 text-sm mt-1">
          Talk to your team and clients without leaving your studio.
        </p>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-4 sm:gap-5">
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={setActiveId}
        />
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card flex flex-col overflow-hidden h-[70vh] md:h-[600px]">
          <MessageList
            conversation={activeConv}
            messages={messages}
            typing={typing}
          />
          <Composer
            onSend={sendMessage}
            onTyping={(isTyping) =>
              socketRef.current?.send({ event: "typing", is_typing: isTyping })
            }
            disabled={!activeId}
          />
        </div>
      </div>
    </div>
  );
}