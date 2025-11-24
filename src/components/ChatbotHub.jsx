import React, { useState, useRef, useEffect } from "react";
import "./ChatbotHub.css";
import { QuickHelpCard } from "./QuickHelp";
import { DeepDiveCard } from "./DeepDive";
import { ExamPrepCard } from "./ExamPrep";

const ChatbotHub = () => {
  const [activeMode, setActiveMode] = useState("eduboat");
  const [messages, setMessages] = useState({
    quickhelp: [{ type: "bot", text: "Welcome to QuickHelp!! Get instant explanations ⚡" }],
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

    // Add user message with marks info for examprep
    const userMessage = activeMode === "examprep"
      ? `${input} (${selectedMarks} marks)`
      : input;

    // append the user's message to the conversation immediately
    setMessages(prev => ({
      ...prev,
      [activeMode]: [...(prev[activeMode] || []), { type: 'user', text: userMessage }]
    }));

    // clear the input so it doesn't keep the typed text after sending
    setInput("");
    // close marks dropdown when a message is sent
    setShowMarksDropdown(false);

    setIsTyping(true);

const endpoint = "http://127.0.0.1:8000/ask"; // your FastAPI server URL

const payload = {
  question: input,
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

    // Integrate your unified ChatbotHub AI API here based on `activeMode`:
    // Example structure (replace setTimeout with real calls):
    // const endpoint = activeMode === "quickhelp" ? "/api/quickhelp" : activeMode === "examprep" ? "/api/examprep" : "/api/deepdive";
    // fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: input }) })
    //   .then(res => res.json())
    //   .then(data => setMessages(prev => ({ ...prev, [activeMode]: [...prev[activeMode], { type: "bot", text: data.answer }] })))
    //   .catch(() => setMessages(prev => ({ ...prev, [activeMode]: [...prev[activeMode], { type: "bot", text: "Sorry, something went wrong." }] })))
    //   .finally(() => setIsTyping(false));

    // Simulated bot response (remove when API is wired)
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

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages, isTyping, activeMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMarksDropdown && !event.target.closest('.marks-selection-container')) {
        setShowMarksDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMarksDropdown]);

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
      handleScroll(); // run once on mount

      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [activeMode]);

  // Get the appropriate gradient and styling based on active mode
  const getModeConfig = () => {
    switch (activeMode) {
      case "quickhelp":
        return {
          name: "⚡ QuickHelp",
          gradient: "linear-gradient(135deg, #a18cd1, #fbc2eb)",
          userGradient: "linear-gradient(135deg, #42a5f5, #1e88e5)"
        };
      case "examprep":
        return {
          name: "📘 ExamPrep",
          gradient: "linear-gradient(135deg, #667eea, #5a67f2)",
          userGradient: "linear-gradient(135deg, #667eea, #5a67f2)"
        };
      case "deepdive":
        return {
          name: "🔍 DeepDive",
          gradient: "linear-gradient(135deg, #ff7e5f, #feb47b)",
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

  // If we're in EduBoat mode, show the card interface
  if (activeMode === "eduboat") {
    return (
      <div className="eduboat-container">
        {/* Header */}
        <header className="header reveal">
          <h1>AcadBoat</h1>
          <p className="subtitle">Study made simple with smart support.</p>
        </header>

        {/* Cards */}
        <div className="card-section">
          <div className="reveal" onClick={() => setActiveMode("quickhelp")} style={{ cursor: "pointer" }}>
            <QuickHelpCard />
          </div>
          <div className="reveal" onClick={() => setActiveMode("deepdive")} style={{ cursor: "pointer" }}>
            <DeepDiveCard />
          </div>
          <div className="reveal" onClick={() => setActiveMode("examprep")} style={{ cursor: "pointer" }}>
            <ExamPrepCard />
          </div>
        </div>

        {/* Footer */}
        <footer className="footer reveal">
          ✨ Happy learning!
        </footer>
      </div>
    );
  }

  // If we're in a specific chatbot mode, show the chat interface
  return (
    <div className="chatbot-hub">
      {/* Header */}
      <header className="chatbot-header">
        <button
          onClick={() => setActiveMode("eduboat")}
          className="back-button-header"
          title="Back to AcadBoat"
        >
        </button>
        <h1>{modeConfig.name}</h1>
        <p className="chatbot-subtitle">
          {activeMode === "quickhelp" && "Get instant explanations for quick understanding"}
          {activeMode === "examprep" && "Structured answers and strategies for exam success"}
          {activeMode === "deepdive" && "Comprehensive explanations with detailed insights"}
        </p>
      </header>

      {/* Chat Area */}
      <div className="chatbox">
        <div ref={chatboxRef} className="messages-container">
          {currentMessages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.type}`}
            >
              {msg.text}
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

        {/* Input Area */}
        <div className="input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your question..."
            className="message-input"
          />

          {/* Marks Selection - Only show for examprep */}
          {activeMode === "examprep" && (
            <div className="marks-selection-container">
              <button
                onClick={() => setShowMarksDropdown(!showMarksDropdown)}
                className="marks-button"
                title="Select marks"
              >
                {selectedMarks} marks
              </button>

              {showMarksDropdown && (
                <div className="marks-dropdown">
                  {[2, 3, 4, 5, 6, 7, 8, 10].map(marks => (
                    <button
                      key={marks}
                      onClick={() => {
                        setSelectedMarks(marks);
                        setShowMarksDropdown(false);
                      }}
                      className={`marks-option ${selectedMarks === marks ? 'selected' : ''}`}
                    >
                      {marks} marks
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={sendMessage}
            className="send-button"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotHub;
