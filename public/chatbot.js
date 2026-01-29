(function() {
  const API_URL = window.CHATBOT_API_URL || 'http://localhost:3000';
  let sessionId = localStorage.getItem('chatbot_session') || null;
  let isOpen = false;

  const styles = `
    .chatbot-container {
      position: fixed !important;
      bottom: 20px !important;
      right: 20px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 2147483647 !important;
    }
    .chatbot-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #dc2626, #ef4444);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .chatbot-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
    }
    .chatbot-button svg {
      width: 28px;
      height: 28px;
      fill: white;
    }
    .chatbot-window {
      position: absolute;
      bottom: 75px;
      right: 0;
      width: 380px;
      height: 1040px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
    }
    .chatbot-window.open {
      display: flex;
    }
    .chatbot-header {
      background: linear-gradient(135deg, #dc2626, #ef4444);
      color: white;
      padding: 18px 20px;
      font-weight: 600;
      font-size: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .chatbot-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 24px;
      line-height: 1;
      opacity: 0.8;
    }
    .chatbot-close:hover {
      opacity: 1;
    }
    .chatbot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .chatbot-message {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
    }
    .chatbot-message.user {
      background: linear-gradient(135deg, #dc2626, #ef4444);
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .chatbot-message.bot {
      background: #f3f4f6;
      color: #1f2937;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .chatbot-message.typing {
      background: #f3f4f6;
      color: #6b7280;
    }
    .chatbot-input-area {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 10px;
    }
    .chatbot-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    .chatbot-input:focus {
      border-color: #dc2626;
    }
    .chatbot-send {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #dc2626, #ef4444);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }
    .chatbot-send:hover {
      transform: scale(1.05);
    }
    .chatbot-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .chatbot-send svg {
      width: 20px;
      height: 20px;
      fill: white;
    }
    @media (max-width: 480px) {
      .chatbot-window {
        width: calc(100vw - 40px);
        height: calc(100vh - 140px);
        bottom: 70px;
        right: -10px;
      }
    }
  `;

  function init() {
    // Remove any existing chatbot first
    const existing = document.getElementById('chatbot-widget-container');
    if (existing) existing.remove();

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    const container = document.createElement('div');
    container.id = 'chatbot-widget-container';
    container.className = 'chatbot-container';
    // Force inline styles to override everything
    container.style.cssText = 'position:fixed!important;bottom:20px!important;right:20px!important;z-index:2147483647!important;transform:none!important;pointer-events:auto!important;';
    container.innerHTML = `
      <div class="chatbot-window">
        <div class="chatbot-header">
          <span>CodeCurrent Assistant</span>
          <button class="chatbot-close">&times;</button>
        </div>
        <div class="chatbot-messages">
          <div class="chatbot-message bot">Hi! How can I help you today?</div>
        </div>
        <div class="chatbot-input-area">
          <input type="text" class="chatbot-input" placeholder="Type your message...">
          <button class="chatbot-send">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
      <button class="chatbot-button">
        <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
      </button>
    `;
    document.body.appendChild(container);

    const button = container.querySelector('.chatbot-button');
    const window = container.querySelector('.chatbot-window');
    const closeBtn = container.querySelector('.chatbot-close');
    const input = container.querySelector('.chatbot-input');
    const sendBtn = container.querySelector('.chatbot-send');
    const messages = container.querySelector('.chatbot-messages');

    button.addEventListener('click', () => {
      isOpen = !isOpen;
      window.classList.toggle('open', isOpen);
      if (isOpen) input.focus();
    });

    closeBtn.addEventListener('click', () => {
      isOpen = false;
      window.classList.remove('open');
    });

    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      addMessage(text, 'user');
      input.value = '';
      sendBtn.disabled = true;

      const typingEl = addMessage('Typing...', 'bot typing');

      try {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, sessionId })
        });

        const data = await response.json();

        if (data.sessionId) {
          sessionId = data.sessionId;
          localStorage.setItem('chatbot_session', sessionId);
        }

        typingEl.remove();
        addMessage(data.reply || 'Sorry, something went wrong.', 'bot');
      } catch (error) {
        typingEl.remove();
        addMessage('Unable to connect. Please try again.', 'bot');
      }

      sendBtn.disabled = false;
    }

    function addMessage(text, type) {
      const msg = document.createElement('div');
      msg.className = `chatbot-message ${type}`;
      msg.textContent = text;
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
      return msg;
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // Wait for full page load to ensure we're added last
  function safeInit() {
    // Small delay to ensure GoDaddy's scripts have finished
    setTimeout(function() {
      init();
      // Re-append to body to ensure we're on top
      const container = document.getElementById('chatbot-widget-container');
      if (container && container.parentNode !== document.body) {
        document.body.appendChild(container);
      }
    }, 500);
  }

  if (document.readyState === 'complete') {
    safeInit();
  } else {
    window.addEventListener('load', safeInit);
  }
})();
