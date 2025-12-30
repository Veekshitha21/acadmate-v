import React, { useState, useRef, useEffect } from "react";
import "./ChatbotHub.css";
import Lottie from "lottie-react";

const ChatbotHub = () => {
  const [activeMode, setActiveMode] = useState("examprep");
  const [messages, setMessages] = useState({
    examprep: [{ type: "bot", text: "Welcome to ExamPrep! Get exam-ready answers ✍️" }]
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMarks, setSelectedMarks] = useState(5);
  const [showMarksDropdown, setShowMarksDropdown] = useState(false);

  const chatboxRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);
  const isSendingRef = useRef(false);
  const [examPrepAnimData, setExamPrepAnimData] = useState(null);

  // Measure navbar height at runtime and publish as CSS variable so landing can offset itself
  useEffect(() => {
    const setNavHeight = () => {
      try {
        const nav = document.querySelector('nav');
        const h = nav ? nav.offsetHeight : 64;
        document.documentElement.style.setProperty('--navbar-height', `${h}px`);
      } catch (e) {
        // ignore
      }
    };

    setNavHeight();
    window.addEventListener('resize', setNavHeight);
    return () => window.removeEventListener('resize', setNavHeight);
  }, []);

  // Load ExamPrep animation
  useEffect(() => {
    fetch("/animations/examPrep.json")
      .then((r) => r.json())
      .then(setExamPrepAnimData)
      .catch(() => setExamPrepAnimData(null));
  }, []);

  const sendMessage = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    if (isSendingRef.current) return;

    isSendingRef.current = true;

    const messageToSend = trimmedInput;
    const userMessage =
      activeMode === "examprep"
        ? `${messageToSend} (${selectedMarks} marks)`
        : messageToSend;

    setMessages(prev => ({
      ...prev,
      [activeMode]: [...prev[activeMode], { type: "user", text: userMessage }]
    }));

    setInput("");
    setShowMarksDropdown(false);
    setIsTyping(true);

    const payload = {
      query: messageToSend,   // ✅ FIXED
      marks: activeMode === "examprep" ? selectedMarks : 5,
      temperature: 0.3
    };

    console.log("Sending payload:", payload); // 🔍 Debug

    fetch("http://127.0.0.1:8000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Server error");
        }
        return res.json();
      })
      .then((data) => {
        setMessages(prev => ({
          ...prev,
          [activeMode]: [...prev[activeMode], { type: "bot", text: data.answer }]
        }));
      })
      .catch((error) => {
        setMessages(prev => ({
          ...prev,
          [activeMode]: [
            ...prev[activeMode],
            { type: "bot", text: `Error: ${error.message}` }
          ]
        }));
      })
      .finally(() => {
        setIsTyping(false);
        isSendingRef.current = false;
      });
  };


  const navigateToMode = (mode) => {
    setActiveMode(mode);
    try {
      const hash = `#Chatbot-${mode}`;
      window.history.pushState({ section: "Chatbot", chatbotMode: mode }, "", hash);
    } catch {}
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  useEffect(() => {
    const currentMessagesLength = (messages[activeMode] || []).length;

    if (chatboxRef.current && currentMessagesLength > prevMessagesLengthRef.current) {
      try {
        chatboxRef.current.scrollTo({
          top: chatboxRef.current.scrollHeight,
          behavior: "smooth"
        });
      } catch {
        chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
      }
    }

    prevMessagesLengthRef.current = currentMessagesLength;
  }, [messages, activeMode]);

  useEffect(() => {
    if (chatboxRef.current) {
      try {
        chatboxRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        chatboxRef.current.scrollTop = 0;
      }
    }

    try {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch {}
  }, [activeMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMarksDropdown && !event.target.closest(".marks-selection-container")) {
        setShowMarksDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMarksDropdown]);

  useEffect(() => {
    const parseHashMode = () => {
      try {
        const h = window.location.hash.replace("#", "");
        if (h.startsWith("Chatbot-")) return h.split("-")[1];
      } catch {}
      return null;
    };

    const initialMode = parseHashMode();
    if (initialMode) setActiveMode(initialMode);

    window.history.replaceState(
      { section: "Chatbot" },
      "",
      window.location.hash || "#Chatbot-examprep"
    );

    const onPop = (e) => {
      const state = e.state || {};
      if (state.section === "Chatbot") {
        setActiveMode(state.chatbotMode || "examprep");
      }
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);


  const getModeConfig = () => {
    switch (activeMode) {
      case "examprep":
        return {
          name: "ExamPrep",
          gradient: "linear-gradient(135deg, #667eea, #5a67f2)",
          userGradient: "linear-gradient(135deg, #667eea, #5a67f2)"
        };
      default:
        return {
          name: "🚢 EduBoat",
          gradient: "linear-gradient(135deg, #4facfe, #00f2fe)",
          userGradient: "linear-gradient(135deg, #42a5f5, #1e88e5)"
        };
    }
  };

  const modeConfig = getModeConfig();
  const currentMessages = messages[activeMode] || [];

  const escapeHtml = (str) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const renderMarkdown = (text) => {
    if (!text) return "";

    let escaped = escapeHtml(text);
    escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    escaped = escaped.replace(/\n/g, "<br>");

    return escaped;
  };


  return (
    <div className="chatbot-hub">
      <header className="chatbot-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          {activeMode === "examprep" && examPrepAnimData && (
            <div style={{ width: '100px', height: '100px' }}>
              <Lottie animationData={examPrepAnimData} loop autoplay style={{ width: '100%', height: '100%' }} />
            </div>
          )}
          <h1>{modeConfig.name}</h1>
        </div>
        <p className="chatbot-subtitle">
          {activeMode === "examprep" ? "Structured answers and strategies for exam success" : "Ask your question"}
        </p>
      </header>

      <div className="chatbox">
        <div ref={chatboxRef} className="messages-container">
          {currentMessages.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              {msg.type === "bot" ? (
                <div
                  className="bot-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                />
              ) : (
                msg.text
              )}
            </div>
          ))}

          {isTyping && (
            <div className="typing-indicator">
              <span>Bot is typing</span>
              <div className="typing-dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
        </div>

        <div className="input-area">
          <input
            type="text"
            className="message-input"
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />

          {activeMode === "examprep" && (
            <div className="marks-selection-container">
              <button
                className="marks-button"
                onClick={() => setShowMarksDropdown(!showMarksDropdown)}
              >
                {selectedMarks} marks
              </button>

              {showMarksDropdown && (
                <div className="marks-dropdown">
                  {[2, 3, 4, 5, 6, 7, 8, 10].map((m) => (
                    <button
                      key={m}
                      className={`marks-option ${selectedMarks === m ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedMarks(m);
                        setShowMarksDropdown(false);
                      }}
                    >
                      {m} marks
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button onClick={sendMessage} className="send-button">Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotHub;
