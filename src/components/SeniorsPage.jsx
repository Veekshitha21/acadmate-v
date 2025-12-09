import React, { useState, useEffect, useRef } from "react";
import { auth } from "../firebase";

const SeniorsPage = () => {
  const bannedWords = ["none", "nothing"];
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [canSend, setCanSend] = useState(true);

  const API_BASE = "http://localhost:4000/api";

  function containsBadWord(text) {
    return bannedWords.some((word) => text.toLowerCase().includes(word));
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // refresh every 3s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!canSend) {
      const timer = setTimeout(() => setCanSend(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [canSend]);

  // Auto-scroll chat div to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTo({
        top: messagesEndRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (containsBadWord(message)) {
      alert("⚠️ Please avoid using inappropriate language.");
      return;
    }
    if (!canSend) {
      alert("⏳ Wait a few seconds before sending again.");
      return;
    }

    try {
      await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message,
          email: auth.currentUser?.email || "guest@example.com",
        }),
      });

      setMessage("");
      setCanSend(false);
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "linear-gradient(135deg, #fbf9f1, #fdfcf8)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "1rem",
          textAlign: "center",
          fontSize: "1.8rem",
          fontWeight: "700",
          color: "#f4b30c",
          letterSpacing: "1px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
          borderBottomLeftRadius: "12px",
          borderBottomRightRadius: "12px",
        }}
      >
        📡 Community Broadcast Room
      </header>

      {/* Chat Area */}
      <div
        style={{
          flex: 1,
          width: "75%",
          margin: "1rem auto",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          ref={messagesEndRef} // 👈 scrollable chat div
          style={{
            flex: 1,
            padding: "1rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                padding: "0.8rem 1rem",
                borderRadius: "14px",
                maxWidth: "70%",
                alignSelf:
                  msg.email === auth.currentUser?.email ? "flex-end" : "flex-start",
                background:
                  msg.email === auth.currentUser?.email
                    ? "linear-gradient(135deg, #667eea, #5a67f2)"
                    : "#ddd9c5",
                color: msg.email === auth.currentUser?.email ? "#fff" : "#000",
                boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                animation: `fadeInUp 0.4s ease forwards`,
              }}
            >
              <strong>{msg.email?.split("@")[0] || "Guest"}:</strong> {msg.text}
            </div>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={sendMessage}
          style={{
            display: "flex",
            borderTop: "1px solid #eee",
            padding: "0.8rem",
            background: "#fdfcf8",
          }}
        >
          <textarea
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={1}
            style={{
              flex: 1,
              padding: "0.8rem",
              border: "1px solid #ccc",
              borderRadius: "14px",
              outline: "none",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
              transition: "box-shadow 0.3s ease",
              fontSize: "0.95rem",
            }}
            onFocus={(e) => (e.target.style.boxShadow = "0 0 5px #667eea")}
            onBlur={(e) =>
              (e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.05)")
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            style={{
              marginLeft: "0.6rem",
              padding: "0.7rem 1.4rem",
              border: "none",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #f4b30c, #ff8c42)",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            Send
          </button>
        </form>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SeniorsPage;
