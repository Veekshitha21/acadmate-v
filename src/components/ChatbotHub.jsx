import React, { useState, useRef, useEffect } from "react";
import "./ChatbotHub.css";
import { QuickHelpCard } from "./QuickHelp";
import { DeepDiveCard } from "./DeepDive";
import { ExamPrepCard } from "./ExamPrep";

const ChatbotHub = () => {
  const [activeMode, setActiveMode] = useState("eduboat");
  const [messages, setMessages] = useState({
    quickhelp: [{ type: "bot", text: "Welcome to QuickHelp! Get instant explanations ⚡" }],
    examprep: [{ type: "bot", text: "Welcome to ExamPrep! Get exam-ready answers ✍️" }],
    deepdive: [{ type: "bot", text: "Welcome to DeepDive! Explore concepts thoroughly 🌊" }]
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMarks, setSelectedMarks] = useState(5); // Default to 5 marks
  const [showMarksDropdown, setShowMarksDropdown] = useState(false);
  const chatboxRef = useRef(null);

  const sendMessage = () => {
    if (!input.trim()) return;

    const messageToSend = input;
    const userMessage = activeMode === "examprep"
      ? `${messageToSend} (${selectedMarks} marks)`
      : messageToSend;

    setMessages(prev => ({
      ...prev,
      [activeMode]: [...(prev[activeMode] || []), { type: 'user', text: userMessage }],
    }));
    setInput('');
    setShowMarksDropdown(false);
    setIsTyping(true);

    const endpoint = "http://127.0.0.1:8000/ask"; // your FastAPI server URL
    const payload = {
      question: messageToSend,
      marks: activeMode === "examprep" ? selectedMarks : 5,
    };

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Error from server");
        }
        return res.json();
      })
      .then((data) => {
        setMessages((prev) => ({
          ...prev,
          [activeMode]: [...prev[activeMode], { type: "bot", text: data.answer }],
        }));
      })
      .catch((error) => {
        setMessages((prev) => ({
          ...prev,
          [activeMode]: [
            ...prev[activeMode],
            { type: "bot", text:  `Error: ${error.message}` },
          ],
        }));
      })
      .finally(() => setIsTyping(false));

    setTimeout(() => {
      let response = "";
      if (activeMode === "quickhelp") response = "Quick explanation: " + input;
      else if (activeMode === "examprep") response = "Here's the exam-ready answer for: " + input;
      else if (activeMode === "deepdive") response = "Here's a deep-dive explanation for: " + input;

      setMessages(prev => ({
        ...prev,
        [activeMode]: [...prev[activeMode], { type: "bot", text: response }]
      }));
      setIsTyping(false);
    }, 800);
  };

  // Navigate between modes
  const navigateToMode = (mode) => {
    setActiveMode(mode);
    try {
      const hash = `#Chatbot-${mode}`;
      window.history.pushState({ section: 'Chatbot', chatbotMode: mode }, '', hash);
    } catch {}
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages, isTyping, activeMode]);

  // Close marks dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMarksDropdown && !event.target.closest('.marks-selection-container')) {
        setShowMarksDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMarksDropdown]);

  // Handle browser/back navigation for Chatbot modes
  useEffect(() => {
    const parseHashMode = () => {
      try {
        const h = (window.location.hash || '').replace('#', '');
        if (h.startsWith('Chatbot-')) return h.split('-')[1];
      } catch {}
      return null;
    };
    const initialMode = parseHashMode();
    if (initialMode) setActiveMode(initialMode);
    window.history.replaceState({ section: 'Chatbot' }, '', window.location.hash || '#Chatbot');

    const onPop = (e) => {
      const state = e.state || {};
      if (state.section === 'Chatbot') {
        setActiveMode(state.chatbotMode || 'eduboat');
      }
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Scroll reveal animation for EduBoat cards
  useEffect(() => {
    if (activeMode === "eduboat") {
      const reveals = document.querySelectorAll(".reveal");
      const handleScroll = () => {
        for (let i = 0; i < reveals.length; i++) {
          const windowHeight = window.innerHeight;
          const elementTop = reveals[i].getBoundingClientRect().top;
          const elementVisible = 100;

          if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
          } else {
            reveals[i].classList.remove("active");
          }
        }
      };
      window.addEventListener("scroll", handleScroll);
      handleScroll();
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [activeMode]);

  // Get styling for each mode
  const getModeConfig = () => {
    switch (activeMode) {
      case "quickhelp":
        return { name: "⚡ QuickHelp", gradient: "linear-gradient(135deg, #a18cd1, #fbc2eb)", userGradient: "linear-gradient(135deg, #42a5f5, #1e88e5)" };
      case "examprep":
        return { name: "📘 ExamPrep", gradient: "linear-gradient(135deg, #667eea, #5a67f2)", userGradient: "linear-gradient(135deg, #667eea, #5a67f2)" };
      case "deepdive":
        return { name: "🔍 DeepDive", gradient: "linear-gradient(135deg, #ff7e5f, #feb47b)", userGradient: "linear-gradient(135deg, #667eea, #5a67f2)" };
      default:
        return { name: "🚢 EduBoat", gradient: "linear-gradient(135deg, #4facfe, #00f2fe)", userGradient: "linear-gradient(135deg, #42a5f5, #1e88e5)" };
    }
  };

  const modeConfig = getModeConfig();
  const currentMessages = messages[activeMode] || [];

  // Escape HTML
  const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Render simple Markdown safely
  const renderMarkdown = (text) => {
    if (!text) return '';
    let escaped = escapeHtml(text);
    // inline code
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
    // bold
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // italic
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // line breaks
    escaped = escaped.replace(/\n/g, '<br>');
    return escaped;
  };

  // EduBoat cards
  if (activeMode === "eduboat") {
    return (
      <div className="eduboat-container">
        <header className="header reveal">
          <h1>AcadBoat</h1>
          <p className="subtitle">Study made simple with smart support.</p>
        </header>
        <div className="card-section">
          <div className="reveal" onClick={() => navigateToMode("quickhelp")} style={{ cursor: "pointer" }}>
            <QuickHelpCard />
          </div>
          <div className="reveal" onClick={() => navigateToMode("deepdive")} style={{ cursor: "pointer" }}>
            <DeepDiveCard />
          </div>
          <div className="reveal" onClick={() => navigateToMode("examprep")} style={{ cursor: "pointer" }}>
            <ExamPrepCard />
          </div>
        </div>
        <footer className="footer reveal">✨ Happy learning!</footer>
      </div>
    );
  }

  // Chat interface
  return (
    <div className="chatbot-hub">
      <header className="chatbot-header">
        <h1>{modeConfig.name}</h1>
        <p className="chatbot-subtitle">
          {activeMode === "quickhelp" && "Get instant explanations for quick understanding"}
          {activeMode === "examprep" && "Structured answers and strategies for exam success"}
          {activeMode === "deepdive" && "Comprehensive explanations with detailed insights"}
        </p>
      </header>

      <div className="chatbox">
        <div ref={chatboxRef} className="messages-container">
          {currentMessages.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              {msg.type === 'bot' ? (
                <div className="bot-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
              ) : msg.text}
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your question..."
            className="message-input"
          />

          {activeMode === "examprep" && (
            <div className="marks-selection-container">
              <button onClick={() => setShowMarksDropdown(!showMarksDropdown)} className="marks-button" title="Select marks">
                {selectedMarks} marks
              </button>
              {showMarksDropdown && (
                <div className="marks-dropdown">
                  {[2, 3, 4, 5, 6, 7, 8, 10].map(m => (
                    <button key={m} onClick={() => { setSelectedMarks(m); setShowMarksDropdown(false); }} className={`marks-option ${selectedMarks === m ? 'selected' : ''}`}>
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
