import React, { useState, useRef, useEffect } from "react";
import "./ChatbotHub.css";
import Lottie from "lottie-react";
import { MessageCircle, X } from "lucide-react";

const ChatbotHub = ({ userData }) => {
  // Get user's name from userData
  const getUserName = () => {
    if (!userData) return null;
    return userData.displayName || userData.username || userData.name || null;
  };

  const userName = getUserName();
  const welcomeMessage = userName 
    ? `Welcome ${userName}`
    : "Welcome to ExamPrep! Get exam-ready answers ✍️"; 
  const [activeMode, setActiveMode] = useState("examprep");
  const [showWelcome, setShowWelcome] = useState(userName ? true : false);
  const [isWelcomeFading, setIsWelcomeFading] = useState(false);
  const [messages, setMessages] = useState({
    examprep: []
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMarks, setSelectedMarks] = useState(5);
  const [showMarksDropdown, setShowMarksDropdown] = useState(false);

  const prevMessagesLengthRef = useRef(0);
  const isSendingRef = useRef(false);
  const [examPrepAnimData, setExamPrepAnimData] = useState(null);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatWindowRef = useRef(null);

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

    // Hide welcome message when user sends first message
    if (showWelcome) {
      setIsWelcomeFading(true);
      // Remove welcome after fade animation completes
      setTimeout(() => {
        setShowWelcome(false);
        setIsWelcomeFading(false);
      }, 500); // Match CSS animation duration
    }

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

    if (currentMessagesLength > prevMessagesLengthRef.current) {
      // Use browser scroll instead of custom scroller
      try {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "smooth"
        });
      } catch {
        window.scrollTo(0, document.documentElement.scrollHeight);
      }
    }

    prevMessagesLengthRef.current = currentMessagesLength;
  }, [messages, activeMode]);

  useEffect(() => {
    // Use browser scroll instead of custom scroller
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


  // Chat functionality (frontend only)
  // const sendChatMessage = () => {
  //   if (!chatInput.trim() || !isLoggedIn) return;
    
  //   const newMessage = {
  //     id: Date.now(),
  //     sender: userData?.username || userData?.displayName || "You",
  //     message: chatInput.trim(),
  //     timestamp: new Date(),
  //     isOwn: true
  //   };
    
  //   setChatMessages(prev => [...prev, newMessage]);
  //   setChatInput("");
    
  //   // Simulate receiving a message (frontend only - will be replaced with backend later)
  //   setTimeout(() => {
  //     const responseMessage = {
  //       id: Date.now() + 1,
  //       sender: "User",
  //       message: "This is a frontend-only chat. Backend will be added later!",
  //       timestamp: new Date(),
  //       isOwn: false
  //     };
  //     setChatMessages(prev => [...prev, responseMessage]);
  //   }, 500);
  // };

  // useEffect(() => {
  //   if (showChatWindow && chatWindowRef.current) {
  //     chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
  //   }
  // }, [chatMessages, showChatWindow]);

  return (
    <div className="chatbot-hub">
      <header className="chatbot-header">
        {activeMode === "examprep" && (
          <div className="examprep-header-left">
            {examPrepAnimData && (
              <div className="examprep-animation-small">
                <Lottie animationData={examPrepAnimData} loop autoplay style={{ width: '100%', height: '100%' }} />
              </div>
            )}
            <h1 className="examprep-title-small">{modeConfig.name}</h1>
          </div>
        )}
        {activeMode !== "examprep" && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <h1>{modeConfig.name}</h1>
          </div>
        )}
        {activeMode !== "examprep" && (
          <p className="chatbot-subtitle">
            Ask your question
          </p>
        )}
      </header>

      {/* Chat Window */}
      {showChatWindow && isLoggedIn && (
        <div className="chat-window">
          <div className="chat-window-header">
            <h3>Community Chat</h3>
            <button 
              onClick={() => setShowChatWindow(false)}
              className="close-chat-btn"
            >
              <X size={20} />
            </button>
          </div>
          <div ref={chatWindowRef} className="chat-messages-container">
            {chatMessages.length === 0 ? (
              <div className="chat-empty-state">
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.isOwn ? 'own' : 'other'}`}>
                  <div className="chat-message-header">
                    <span className="chat-sender">{msg.sender}</span>
                    <span className="chat-time">
                      {new Date(msg.timestamp).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="chat-message-content">{msg.message}</div>
                </div>
              ))
            )}
          </div>
          <div className="chat-input-area">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              placeholder="Type a message..."
              className="chat-input"
            />
            <button onClick={sendChatMessage} className="chat-send-btn">
              Send
            </button>
          </div>
        </div>
      )}

      <div className="chatbox">
        <div className="messages-container">
          {showWelcome && (
            <div className={`welcome-text ${isWelcomeFading ? 'fading-out' : ''}`}>
              {welcomeMessage}
            </div>
          )}
          
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
          
          <input
            type="text"
            className="message-input"
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />

          <button onClick={sendMessage} className="send-button-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotHub;