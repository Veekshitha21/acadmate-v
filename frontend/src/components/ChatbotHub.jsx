import React, { useState, useRef, useEffect } from "react";
import "./ChatbotHub.css";
import Lottie from "lottie-react";

const ChatbotHub = ({ userData }) => {
  // AI API base URL (dev default). You can override via Vite env: VITE_AI_API_BASE_URL
  const AI_API_BASE_URL = (import.meta?.env?.VITE_AI_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
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
      query: messageToSend,
      marks: activeMode === "examprep" ? selectedMarks : 5,
      temperature: 0.3
    };

    console.log("Sending payload:", payload);

    fetch(`${AI_API_BASE_URL}/generate`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
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
        // Format error message for single line display
        let errorMessage = error.message || "An error occurred";
        // Check for specific error types
        if (errorMessage.toLowerCase().includes("limit") || errorMessage.toLowerCase().includes("exceed")) {
          errorMessage = "Limit exceeded. Please try again later.";
        } else if (errorMessage.toLowerCase().includes("topic") || errorMessage.toLowerCase().includes("not available") || errorMessage.toLowerCase().includes("not found")) {
          errorMessage = "Topics not available for this query. Please try a different question.";
        }
        setMessages(prev => ({
          ...prev,
          [activeMode]: [
            ...prev[activeMode],
            { type: "bot", text: `Error: ${errorMessage}`, isError: true }
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

  // ===== CODE BLOCKS - Must do BEFORE HTML escaping =====
  const codeBlocks = [];
  // Extract code blocks FIRST (before HTML escaping)
  let processed = text.replace(/```([\s\S]*?)```/g, (match, code) => {
    const placeholder = `___CODE_BLOCK_${codeBlocks.length}___`;
    // Preserve formatting - only trim leading/trailing newlines, keep indentation and line breaks
    let formattedCode = code;
    // Remove ONLY leading and trailing newlines (not all whitespace)
    formattedCode = formattedCode.replace(/^\n+|\n+$/g, '');
    // Escape HTML for code content (security)
    const escapedCode = formattedCode
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    // Store code block with proper formatting
    codeBlocks.push(`<pre class="code-block"><code class="code-content">${escapedCode}</code></pre>`);
    return `\n${placeholder}\n`;
  });

  // Now escape HTML for the rest (but preserve code block placeholders)
  const parts = processed.split(/(___CODE_BLOCK_\d+___)/g);
  processed = parts.map(part => {
    if (part.match(/___CODE_BLOCK_\d+___/)) {
      return part; // Keep placeholders as-is (already processed)
    }
    return escapeHtml(part); // Escape everything else
  }).join('');

  // Bold "side headings" inside points, e.g. "Portability: ...", "Operating Systems: ..."
  // Works for any label at the start of a bullet/numbered item.
  const boldLeadingLabel = (s) => {
    if (!s) return s;
    const trimmed = s.trim();
    if (!trimmed) return s;
    
    // Skip if it's a code block placeholder
    if (trimmed.includes("___CODE_BLOCK_")) {
      return s;
    }
    
    // Match: <Label>: <rest>
    // - label: at least 2 chars, starts with a letter/number, can contain spaces, hyphens, etc.
    // - stops at the first colon followed by space
    // Examples: "Operating Systems: text", "Key Point: text", "Portability: text", "C Programming: text", "Structured programming: text"
    // Be more flexible with whitespace and matching
    const m = trimmed.match(/^([A-Za-z0-9][A-Za-z0-9\s\-]{1,80}?):\s+(.+)$/);
    if (m) {
      const label = m[1].trim();
      const rest = m[2].trim();
      // Only apply if label is reasonable (not too long, and rest exists)
      if (label.length >= 2 && label.length <= 80 && rest.length > 0) {
        return `<strong class="li-key">${label}:</strong> ${rest}`;
      }
    }
    return s;
  };


  // ===== INLINE CODE =====
  processed = processed.replace(/`([^`]+)`/g, "<code>$1</code>");

  // ===== BOLD & ITALIC =====
  processed = processed.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  processed = processed.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // ===== PROCESS LINE BY LINE =====
  const lines = processed.split("\n");
  let html = "";
  let inOrderedList = false;
  let inUnorderedList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Empty line - close any open lists
    if (!line) {
      if (inOrderedList) {
        html += "</ol>";
        inOrderedList = false;
      }
      if (inUnorderedList) {
        html += "</ul>";
        inUnorderedList = false;
      }
      continue;
    }

    // Code block placeholder - restore it
    if (line.includes("___CODE_BLOCK_")) {
      const idx = parseInt(line.match(/___CODE_BLOCK_(\d+)___/)[1]);
      // Always close any open lists before code blocks (remove bullet points for code)
      if (inOrderedList) {
        html += "</ol>";
        inOrderedList = false;
      }
      if (inUnorderedList) {
        html += "</ul>";
        inUnorderedList = false;
      }
      // Add code block as standalone (no bullet point)
      html += `<div class="code-block-wrapper">${codeBlocks[idx]}</div>`;
      continue;
    }

    // HEADINGS - Keywords at start of line (standalone headings only)
    // Match headings that are on their own line (with optional colon, no content after)
    const headingMatch = line.match(/^(Definition|Explanation|Examples?|Key Points?|Notes?|Summary|Code Example|Introduction|Conclusion|Important|Features?|Types?|Properties|Advantages?|Disadvantages?|Benefits?|Uses?|Applications?|Usage|Syntax|Purpose|Working|Structure|Function|Variable|Variables|Loop|Loops|Condition|Statement|Statements|Operator|Operators):?\s*$/i);
    if (headingMatch) {
      if (inOrderedList) {
        html += "</ol>";
        inOrderedList = false;
      }
      if (inUnorderedList) {
        html += "</ul>";
        inUnorderedList = false;
      }
      html += `<h2>${headingMatch[1]}</h2>`;
      continue;
    }

    // NUMBERED LIST - "1. Item" or "1) Item"
    const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (numberedMatch) {
      if (inUnorderedList) {
        html += "</ul>";
        inUnorderedList = false;
      }
      if (!inOrderedList) {
        html += "<ol>";
        inOrderedList = true;
      }
      let itemContent = numberedMatch[2];
      // Check if item contains code block placeholder
      if (itemContent.includes("___CODE_BLOCK_")) {
        // Extract label before code block and make it bold
        const parts = itemContent.split(/___CODE_BLOCK_\d+___/);
        const labelPart = parts[0] ? boldLeadingLabel(parts[0].trim()) : '';
        // Close the list before adding code block (remove bullet point for code)
        html += "</ol>";
        inOrderedList = false;
        // Add label if exists, then add code block
        if (labelPart) {
          html += `<div class="code-label">${labelPart}</div>`;
        }
        // Extract and add code blocks (without bullet points)
        const codeMatches = itemContent.match(/___CODE_BLOCK_(\d+)___/g);
        if (codeMatches) {
          codeMatches.forEach(match => {
            const idx = parseInt(match.match(/___CODE_BLOCK_(\d+)___/)[1]);
            html += `<div class="code-block-wrapper">${codeBlocks[idx]}</div>`;
          });
        }
      } else {
        // Make sure side headings are bolded (like "Portability:", "Efficiency:")
        html += `<li>${boldLeadingLabel(itemContent)}</li>`;
      }
      continue;
    }

    // BULLET LIST - "* Item" or "- Item"
    const bulletMatch = line.match(/^[*\-]\s+(.+)$/);
    if (bulletMatch) {
      if (inOrderedList) {
        html += "</ol>";
        inOrderedList = false;
      }
      if (!inUnorderedList) {
        html += "<ul>";
        inUnorderedList = true;
      }
      let itemContent = bulletMatch[1];
      // Check if item contains code block placeholder
      if (itemContent.includes("___CODE_BLOCK_")) {
        // Extract label before code block and make it bold
        const parts = itemContent.split(/___CODE_BLOCK_\d+___/);
        const labelPart = parts[0] ? boldLeadingLabel(parts[0].trim()) : '';
        // Close the list before adding code block (remove bullet point for code)
        html += "</ul>";
        inUnorderedList = false;
        // Add label if exists, then add code block
        if (labelPart) {
          html += `<div class="code-label">${labelPart}</div>`;
        }
        // Extract and add code blocks (without bullet points)
        const codeMatches = itemContent.match(/___CODE_BLOCK_(\d+)___/g);
        if (codeMatches) {
          codeMatches.forEach(match => {
            const idx = parseInt(match.match(/___CODE_BLOCK_(\d+)___/)[1]);
            html += `<div class="code-block-wrapper">${codeBlocks[idx]}</div>`;
          });
        }
      } else {
        // Make sure side headings are bolded (like "Portability:", "Efficiency:")
        html += `<li>${boldLeadingLabel(itemContent)}</li>`;
      }
      continue;
    }

    // REGULAR PARAGRAPH - Convert to bullet points (but NOT for code blocks)
    // Check if line contains code block placeholder - if so, handle separately
    if (line.includes("___CODE_BLOCK_")) {
      // This should have been caught earlier, but handle it just in case
      const idx = parseInt(line.match(/___CODE_BLOCK_(\d+)___/)[1]);
      if (inOrderedList) {
        html += "</ol>";
        inOrderedList = false;
      }
      if (inUnorderedList) {
        html += "</ul>";
        inUnorderedList = false;
      }
      html += `<div class="code-block-wrapper">${codeBlocks[idx]}</div>`;
      continue;
    }
    
    if (inOrderedList) {
      html += "</ol>";
      inOrderedList = false;
    }
    if (inUnorderedList) {
      html += "</ul>";
      inUnorderedList = false;
    }
    // Check if line looks like code (contains HTML tags or code patterns)
    // If it looks like code but wasn't in ``` blocks, wrap it in code block
    if (line.trim().match(/^(&lt;|<!|<)(html|head|body|DOCTYPE|h1|h2|h3|p|div|span|script|style|title)/i) || 
        (line.trim().includes('&lt;') && line.trim().includes('&gt;') && line.match(/&lt;[^&]+&gt;/))) {
      // This looks like HTML code, wrap it in code block
      const codeContent = line
        .replace(/&lt;/g, "&lt;")
        .replace(/&gt;/g, "&gt;")
        .replace(/&amp;/g, "&amp;");
      // Close any lists before code
      if (inOrderedList) {
        html += "</ol>";
        inOrderedList = false;
      }
      if (inUnorderedList) {
        html += "</ul>";
        inUnorderedList = false;
      }
      // Wrap in code block
      html += `<div class="code-block-wrapper"><pre class="code-block"><code class="code-content">${codeContent}</code></pre></div>`;
      continue;
    }
    
    // Convert paragraph text into bullet points
    // Don't split on commas if it looks like a label (e.g., "Portability: C programs...")
    // Check if line starts with a label pattern first
    const labelMatch = line.trim().match(/^([A-Za-z0-9][A-Za-z0-9\s\-]{1,80}?):\s+(.+)$/);
    if (labelMatch) {
      // It's a label, convert to bullet point with bold label
      html += "<ul><li>" + boldLeadingLabel(line) + "</li></ul>";
      continue;
    }
    
    // Split by sentence endings or semicolons (but NOT commas to preserve labels)
    if (line.length > 40 && (line.match(/[.!?]\s+/) || line.includes(';'))) {
      // Split into multiple bullet points (don't split on commas)
      const parts = line.split(/(?<=[.!?])\s+|;\s+/).filter(s => s.trim().length > 0);
      if (parts.length > 1) {
        html += "<ul>";
        parts.forEach(part => {
          const trimmed = part.trim();
          if (trimmed.length > 0) {
            html += `<li>${boldLeadingLabel(trimmed)}</li>`;
          }
        });
        html += "</ul>";
        continue;
      }
    }
    // Single sentence/paragraph - convert to bullet point
    // Make sure to bold labels like "Portability:", "Efficiency:", etc.
    html += "<ul><li>" + boldLeadingLabel(line) + "</li></ul>";
  }

  // Close any remaining open lists
  if (inOrderedList) html += "</ol>";
  if (inUnorderedList) html += "</ul>";

  return html;
};





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
            <div className="examprep-header-content">
              <h1 className="examprep-title-small">{modeConfig.name}</h1>
              <p className="examprep-subtitle-small">Exam Prep is here to help with first-year engineering subjects!</p>
            </div>
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

      <div className="chatbox">
        <div className="messages-container">
          {showWelcome && (
            <div className={`welcome-text ${isWelcomeFading ? 'fading-out' : ''}`}>
              {welcomeMessage}
            </div>
          )}
          
          {currentMessages.map((msg, index) => (
            <div key={index} className={`message ${msg.type} ${msg.isError ? 'error-message' : ''}`}>
              {msg.type === "bot" ? (
                msg.isError || msg.text.startsWith("Error:") ? (
                  <div className="error-text">{msg.text}</div>
                ) : (
                  <div
                    className="bot-content"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                  />
                )
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