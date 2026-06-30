"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [chatExpiresAt, setChatExpiresAt] = useState<string | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch current user and messages
  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/auth");
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
        router.push("/auth");
      }
    };
    fetchAuth();
  }, [router]);

  const fetchChat = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/chat?matchId=${matchId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "خطا در بارگذاری چت");
        return;
      }

      setMessages(data.messages || []);
      setChatExpiresAt(data.chatExpiresAt);
      setError(null);
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchChat(true);

      // Poll messages every 3 seconds
      const interval = setInterval(() => {
        fetchChat(false);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [user, matchId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Countdown timer logic
  useEffect(() => {
    if (!chatExpiresAt) return;

    const updateTimer = () => {
      const expiry = new Date(chatExpiresAt).getTime();
      const now = Date.now();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeftStr("منقضی شده");
        setError("اتاق گفتگو موقت بسته شد.");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeftStr(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [chatExpiresAt]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          text: inputText,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setInputText("");
        setMessages(prev => [...prev, {
          ...data.message,
          sender: { firstName: user.firstName, gender: user.gender }
        }]);
      } else {
        setError(data.error || "خطا در ارسال پیام");
      }
    } catch {
      setError("خطای شبکه در ارسال پیام");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <Link href="/dashboard" className="btn btn-ghost btn-sm">
          ↩ بازگشت به داشبورد
        </Link>
        <div className="chat-title">🗣️ گفتگوی موقت قرار ملاقات</div>
        {chatExpiresAt && (
          <div className="chat-timer">
            ⏱️ زمان باقی‌مانده: {timeLeftStr}
          </div>
        )}
      </header>

      {/* Error alert */}
      {error && (
        <div style={{
          padding: "16px",
          background: "var(--danger-soft)",
          borderBottom: "1px solid rgba(214, 48, 49, 0.2)",
          color: "var(--danger)",
          textAlign: "center",
          fontSize: "0.9rem",
        }}>
          {error}
        </div>
      )}

      {/* Messages list */}
      <div className="chat-messages">
        {messages.length === 0 && !error && (
          <div className="empty-state">
            <span className="empty-icon">💬</span>
            <span className="empty-text">هنوز پیامی ارسال نشده است. شروع به گفتگو کنید!</span>
          </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.senderId === user.id;
          return (
            <div
              key={msg.id}
              className={`chat-bubble ${isMe ? "sent" : "received"}`}
            >
              <div className="bubble-sender">
                {isMe ? "شما" : msg.sender?.firstName || "مخاطب"}
              </div>
              <div>{msg.text}</div>
              <div className="bubble-time">
                {new Date(msg.createdAt).toLocaleTimeString("fa-IR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <form className="chat-input-area" onSubmit={handleSendMessage}>
        <input
          className="input"
          type="text"
          placeholder={error ? "چت غیرفعال است" : "پیام خود را بنویسید..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={!!error || sending}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!inputText.trim() || !!error || sending}
        >
          ارسال
        </button>
      </form>
    </div>
  );
}
