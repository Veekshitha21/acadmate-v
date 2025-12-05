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

    // Capture the message to send (so we can clear input while still using it)
    const messageToSend = input;
    // Add user message with marks info for examprep (displayed text)
    const userMessage = activeMode === "examprep"
      ? `${messageToSend} (${selectedMarks} marks)`
      : messageToSend;

    // Immediately append the user's message to the UI and clear the input box
    setMessages(prev => ({
      ...prev,
      [activeMode]: [...(prev[activeMode] || []), { type: 'user', text: userMessage }],
    }));
    setInput('');

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

  // Minimal Markdown -> HTML converter for bot replies (keeps things simple and safe)
  const escapeHtml = (str) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const renderMarkdown = (text) => {
    if (!text) return '';

    // Normalize line endings
    const src = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // If the bot returned HTML-escaped allowed tags (e.g. &lt;strong&gt;), restore them
    const allowedTagsForUnescape = ['strong','b','em','i','code','pre','h1','h2','h3','p','ul','ol','li','br'];
    let normalized = src;

    // fix common malformed patterns like <strong/>Text -> <strong>Text</strong>
    allowedTagsForUnescape.forEach((tag) => {
      // handle self-closing followed by text: <tag/>Text -> <tag>Text</tag>
      const selfClosePattern = new RegExp(`<${tag}\\s*\\/>\\s*([^<\n][^\n]*)`, 'gi');
      normalized = normalized.replace(selfClosePattern, `<${tag}>$1</${tag}>`);
      // handle uppercase variants too
      const selfCloseUpper = new RegExp(`<${tag.toUpperCase()}\\s*\\/>\\s*([^<\n][^\n]*)`, 'gi');
      normalized = normalized.replace(selfCloseUpper, `<${tag}>$1</${tag}>`);
    });

    // Restore HTML-escaped allowed tags (and strip attributes if present)
    allowedTagsForUnescape.forEach((tag) => {
      const openEntity = new RegExp(`&lt;${tag}(?:\\s+[^&]*)?&gt;`, 'gi');
      const closeEntity = new RegExp(`&lt;\\/${tag}&gt;`, 'gi');
      normalized = normalized.replace(openEntity, `<${tag}>`).replace(closeEntity, `</${tag}>`);
      const openEntityUpper = new RegExp(`&lt;${tag.toUpperCase()}(?:\\s+[^&]*)?&gt;`, 'gi');
      const closeEntityUpper = new RegExp(`&lt;\\/${tag.toUpperCase()}&gt;`, 'gi');
      normalized = normalized.replace(openEntityUpper, `<${tag}>`).replace(closeEntityUpper, `</${tag}>`);
    });
    // also handle self-closing br variants
    normalized = normalized.replace(/&lt;br\s*\/&gt;/gi, '<br>');

    // Extract fenced code blocks first
    let codeBlockIndex = 0;
    const codeBlocks = [];
  const withoutFenced = normalized.replace(/```([\s\S]*?)```/g, (m, code) => {
      const placeholder = `__CODEBLOCK_${codeBlockIndex}__`;
      codeBlocks.push(code);
      codeBlockIndex += 1;
      return placeholder;
    });

    // Allow a small whitelist of HTML tags by replacing them with placeholders
    // so they won't be escaped. We only allow tags without attributes.
    const allowed = ['strong','b','em','i','code','pre','h1','h2','h3','p','ul','ol','li','br'];
    let placeholderCounter = 0;
    const tagPlaceholders = {};

    // Match tags possibly with attributes (we'll store a simplified tag without attrs)
    const withPlaceholders = withoutFenced.replace(/<\/?\s*([a-z0-9]{1,6})(?:\s+[^>]*)?>/gi, (m, tagName) => {
      const tag = tagName.toLowerCase();
      if (allowed.includes(tag)) {
        const key = `__HTMLTAG_${placeholderCounter}__`;
        // store a simplified original tag (strip attributes)
        const simplified = m.startsWith('</') ? `</${tag}>` : `<${tag}>`;
        tagPlaceholders[key] = simplified;
        placeholderCounter += 1;
        return key;
      }
      // escape any non-allowed tag entirely
      return escapeHtml(m);
    });

    const lines = withPlaceholders.split('\n');
    const out = [];
    let listType = null; // 'ul' or 'ol'
    let buf = [];

    const processInline = (text) => {
      // text may contain placeholders; run escaping, inline replacements, then restore placeholders
      let processed = escapeHtml(text)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');

      Object.keys(tagPlaceholders).forEach((ph) => {
        if (processed.includes(ph)) {
          processed = processed.replace(new RegExp(ph, 'g'), tagPlaceholders[ph]);
        }
      });

      return processed;
    };

    const flushBufferAsParagraph = () => {
      if (buf.length === 0) return;
      // buf already contains processed HTML fragments; don't escape again
      out.push('<p>' + buf.join(' ') + '</p>');
      buf = [];
    };

    const flushList = () => {
      if (!listType) return;
      out.push(`<${listType}>` + buf.map(l => `<li>${l}</li>`).join('') + `</${listType}>`);
      listType = null;
      buf = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const lineRaw = lines[i];
      const line = lineRaw.trim();
      if (line === '') {
        // blank line -> paragraph/list boundary
        flushList();
        flushBufferAsParagraph();
        continue;
      }

      // Headings (markdown)
      const hmatch = line.match(/^(#{1,3})\s+(.*)$/);
      if (hmatch) {
        flushList();
        flushBufferAsParagraph();
        const level = Math.min(3, hmatch[1].length);
        out.push(`<h${level}>${escapeHtml(hmatch[2])}</h${level}>`);
        continue;
      }

      // Ordered list
      const om = line.match(/^\d+\.\s+(.*)$/);
      if (om) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
          buf = [];
        }
        buf.push(processInline(om[1]));
        continue;
      }

      // Unordered list (- or *)
      const um = line.match(/^[-*]\s+(.*)$/);
      if (um) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
          buf = [];
        }
        buf.push(processInline(um[1]));
        continue;
      }

      // Inline code and bold/italic inside a normal line. Note: placeholders are preserved.
      const processed = processInline(lineRaw);

      buf.push(processed);
    }

    // flush remaining
    flushList();
    flushBufferAsParagraph();

    let html = out.join('');

    // restore code blocks
    for (let i = 0; i < codeBlocks.length; i++) {
      const code = escapeHtml(codeBlocks[i]);
      const block = `<pre class="code-block"><code>${code}</code></pre>`;
      html = html.replace(`__CODEBLOCK_${i}__`, block);
    }

    // restore any leftover placeholders in the final html
    Object.keys(tagPlaceholders).forEach((ph) => {
      if (html.includes(ph)) html = html.replace(new RegExp(ph, 'g'), tagPlaceholders[ph]);
    });

    // small safety: disallow <script> by escaping if any slipped through
    html = html.replace(/<script/gi, '&lt;script');

    return html;
  };

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
              {msg.type === 'bot' ? (
                // Render bot messages as parsed markdown -> HTML so CSS styles (h1,h2,ul,pre) apply
                <div
                  className="bot-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                />
              ) : (
                // Keep user messages as plain text
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
