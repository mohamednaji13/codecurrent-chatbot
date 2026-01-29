(function() {
  const API_URL = window.CHATBOT_API_URL || 'http://localhost:3000';

  // Create iframe container with inline styles (cannot be overridden)
  const wrapper = document.createElement('div');
  wrapper.id = 'chatbot-iframe-wrapper';
  wrapper.setAttribute('style',
    'position:fixed!important;' +
    'bottom:20px!important;' +
    'right:20px!important;' +
    'z-index:2147483647!important;' +
    'width:60px!important;' +
    'height:60px!important;' +
    'border:none!important;' +
    'background:transparent!important;' +
    'pointer-events:auto!important;' +
    'transform:translateZ(0)!important;'
  );

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'chatbot-iframe';
  iframe.setAttribute('style',
    'width:100%!important;' +
    'height:100%!important;' +
    'border:none!important;' +
    'background:transparent!important;'
  );
  iframe.setAttribute('allowtransparency', 'true');
  iframe.setAttribute('frameborder', '0');

  wrapper.appendChild(iframe);
  document.documentElement.appendChild(wrapper);

  // Write chatbot HTML into iframe
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(`
<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: visible;
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
  position: absolute;
  bottom: 0;
  right: 0;
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
  bottom: 70px;
  right: 0;
  width: 380px;
  height: 520px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
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
.chatbot-close:hover { opacity: 1; }
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
}
.chatbot-input:focus { border-color: #dc2626; }
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
}
.chatbot-send:hover { transform: scale(1.05); }
.chatbot-send:disabled { opacity: 0.5; cursor: not-allowed; }
.chatbot-send svg { width: 20px; height: 20px; fill: white; }
</style>
</head>
<body>
<div class="chatbot-window" id="window">
  <div class="chatbot-header">
    <span>CodeCurrent Assistant</span>
    <button class="chatbot-close" id="close">&times;</button>
  </div>
  <div class="chatbot-messages" id="messages">
    <div class="chatbot-message bot">Hi! How can I help you today?</div>
  </div>
  <div class="chatbot-input-area">
    <input type="text" class="chatbot-input" id="input" placeholder="Type your message...">
    <button class="chatbot-send" id="send">
      <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
    </button>
  </div>
</div>
<button class="chatbot-button" id="btn">
  <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
</button>
<script>
const API_URL = "${API_URL}";
let sessionId = null;
try { sessionId = localStorage.getItem('chatbot_session'); } catch(e) {}
let isOpen = false;

const btn = document.getElementById('btn');
const win = document.getElementById('window');
const closeBtn = document.getElementById('close');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send');
const messages = document.getElementById('messages');

function resize(open) {
  const wrapper = parent.document.getElementById('chatbot-iframe-wrapper');
  if (open) {
    wrapper.style.width = '400px';
    wrapper.style.height = '600px';
  } else {
    wrapper.style.width = '60px';
    wrapper.style.height = '60px';
  }
}

btn.addEventListener('click', function() {
  isOpen = !isOpen;
  win.classList.toggle('open', isOpen);
  resize(isOpen);
  if (isOpen) input.focus();
});

closeBtn.addEventListener('click', function() {
  isOpen = false;
  win.classList.remove('open');
  resize(false);
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  input.value = '';
  sendBtn.disabled = true;

  const typing = addMessage('Typing...', 'bot');

  try {
    const res = await fetch(API_URL + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, sessionId: sessionId })
    });
    const data = await res.json();
    if (data.sessionId) {
      sessionId = data.sessionId;
      try { localStorage.setItem('chatbot_session', sessionId); } catch(e) {}
    }
    typing.remove();
    addMessage(data.reply || 'Sorry, something went wrong.', 'bot');
  } catch(e) {
    typing.remove();
    addMessage('Unable to connect. Please try again.', 'bot');
  }
  sendBtn.disabled = false;
}

function addMessage(text, type) {
  const msg = document.createElement('div');
  msg.className = 'chatbot-message ' + type;
  msg.textContent = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
  return msg;
}

sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') sendMessage();
});
</script>
</body>
</html>
  `);
  iframeDoc.close();
})();
