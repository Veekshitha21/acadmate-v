import React, { useState, useEffect, useRef } from "react";

const ExamPrep = () => {
  const [messages, setMessages] = useState([
    { type: "bot", text: "Welcome to ExamPrep! Get exam-ready answers ✍️" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { type: "user", text: input }]);
    const userInput = input;
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userInput }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { type: "bot", text: data.answer || "No response from AI." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "⚠️ Error: Failed to fetch response." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Scroll whole page like ChatGPT
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="page">
      {/* Header */}
      <header className="exam-header">
        <h1>ExamPrep</h1>
        <p>Structured answers and strategies for exam success</p>
      </header>

      {/* Messages */}
      <main className="chat-area">
        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.type}`}>
            <div className="bubble">{msg.text}</div>
          </div>
        ))}

        {isTyping && (
          <div className="msg bot">
            <div className="bubble typing">Thinking...</div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <footer className="input-bar">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask ExamPrep anything..."
        />
        <button onClick={sendMessage}>Send</button>
      </footer>

      {/* Styles */}
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .page {
          min-height: 100vh;
          background: #f7f7f8;
          font-family: system-ui, -apple-system, BlinkMacSystemFont;
          padding-bottom: 80px;
        }

        /* Header (ChatGPT-like) */
        .exam-header {
          padding: 12px 20px;
          border-bottom: 1px solid #e5e5e5;
          background: #fff;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .exam-header h1 {
          font-size: 1.2rem;
          margin: 0;
          font-weight: 600;
        }

        .exam-header p {
          margin: 2px 0 0;
          font-size: 0.85rem;
          color: #6b7280;
        }

        /* Chat Area (NO inner scroll) */
        .chat-area {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .msg {
          display: flex;
        }

        .msg.user {
          justify-content: flex-end;
        }

        .msg.bot {
          justify-content: flex-start;
        }

        .bubble {
          max-width: 70%;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .user .bubble {
          background: #4f46e5;
          color: #fff;
          border-bottom-right-radius: 4px;
        }

        .bot .bubble {
          background: #e5e7eb;
          color: #111;
          border-bottom-left-radius: 4px;
        }

        .typing {
          font-style: italic;
          opacity: 0.8;
        }

        /* Input Bar */
        .input-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          gap: 10px;
          padding: 12px;
          background: #fff;
          border-top: 1px solid #e5e5e5;
        }

        .input-bar input {
          flex: 1;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          font-size: 0.95rem;
          outline: none;
        }

        .input-bar button {
          padding: 10px 16px;
          border-radius: 10px;
          border: none;
          background: #4f46e5;
          color: white;
          font-weight: 500;
          cursor: pointer;
        }

        .input-bar button:hover {
          background: #4338ca;
        }
      `}</style>
    </div>
  );
};

export default ExamPrep;
