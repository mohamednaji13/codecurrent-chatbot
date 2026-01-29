(function() {
  const API_URL = window.CHATBOT_API_URL || 'http://localhost:3000';
  let sessionId = null;
  try { sessionId = localStorage.getItem('chatbot_session'); } catch(e) {}

  // Check for embed container
  const embedContainer = document.getElementById('chatbot-embed');
  const isEmbedded = !!embedContainer;

  // Create container
  const container = document.createElement('div');
  container.id = 'cc-chatbot';

  if (isEmbedded) {
    // Embedded mode - fill the container
    container.style.cssText = 'width:100%;height:100%;';
    embedContainer.appendChild(container);
  } else {
    // Floating mode
    let chatOpen = false;

    function updatePosition() {
      const width = chatOpen ? 400 : 70;
      const height = chatOpen ? 1060 : 70;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      container.style.cssText =
        'position:absolute!important;' +
        'top:' + (scrollTop + viewportHeight - height - 20) + 'px!important;' +
        'left:' + (scrollLeft + viewportWidth - width - 20) + 'px!important;' +
        'width:' + width + 'px!important;' +
        'height:' + height + 'px!important;' +
        'z-index:2147483647!important;' +
        'pointer-events:auto!important;';
    }

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition, true);

    function tick() {
      updatePosition();
      requestAnimationFrame(tick);
    }
    tick();

    document.body.appendChild(container);
  }

  // Create shadow DOM
  const shadow = container.attachShadow({mode: 'open'});

  const embeddedStyles = isEmbedded ? `
    :host { display: block; width: 100%; height: 100%; }
    .window {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex !important;
    }
    .btn { display: none !important; }
    .close { display: none !important; }
  ` : `
    :host { all: initial; display: block; width: 100%; height: 100%; }
    .window {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 380px;
      height: 1040px;
      display: none;
    }
    .window.open { display: flex; }
    .btn {
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
      position: absolute;
      bottom: 0;
      right: 0;
      transition: transform 0.2s;
    }
    .btn:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5); }
    .btn svg { width: 28px; height: 28px; fill: white; }
  `;

  shadow.innerHTML = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      ${embeddedStyles}
      .window {
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        flex-direction: column;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .header {
        background: linear-gradient(135deg, #dc2626, #ef4444);
        color: white;
        padding: 18px 20px;
        font-weight: 600;
        font-size: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 24px;
        opacity: 0.8;
      }
      .close:hover { opacity: 1; }
      .messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .msg {
        max-width: 85%;
        padding: 12px 16px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.5;
      }
      .msg.user {
        background: linear-gradient(135deg, #dc2626, #ef4444);
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }
      .msg.bot {
        background: #f3f4f6;
        color: #1f2937;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }
      .input-area {
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 10px;
      }
      .input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #e5e7eb;
        border-radius: 24px;
        font-size: 14px;
        outline: none;
      }
      .input:focus { border-color: #dc2626; }
      .send {
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
      .send:hover { transform: scale(1.05); }
      .send:disabled { opacity: 0.5; }
      .send svg { width: 20px; height: 20px; fill: white; }
    </style>
    <div class="window" id="win">
      <div class="header">
        <span>CodeCurrent Assistant</span>
        <button class="close" id="cls">&times;</button>
      </div>
      <div class="messages" id="msgs">
        <div class="msg bot">Hi! How can I help you today?</div>
      </div>
      <div class="input-area">
        <input type="text" class="input" id="inp" placeholder="Type your message...">
        <button class="send" id="snd">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
    <button class="btn" id="btn">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
    </button>
  `;

  const btn = shadow.getElementById('btn');
  const win = shadow.getElementById('win');
  const cls = shadow.getElementById('cls');
  const inp = shadow.getElementById('inp');
  const snd = shadow.getElementById('snd');
  const msgs = shadow.getElementById('msgs');

  if (!isEmbedded) {
    let chatOpen = false;
    btn.onclick = function() {
      chatOpen = !chatOpen;
      win.classList.toggle('open', chatOpen);
      if (chatOpen) inp.focus();
    };

    cls.onclick = function() {
      chatOpen = false;
      win.classList.remove('open');
    };
  }

  async function send() {
    const text = inp.value.trim();
    if (!text) return;
    addMsg(text, 'user');
    inp.value = '';
    snd.disabled = true;
    const typing = addMsg('Typing...', 'bot');
    try {
      const res = await fetch(API_URL + '/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: text, sessionId: sessionId})
      });
      const data = await res.json();
      if (data.sessionId) {
        sessionId = data.sessionId;
        try { localStorage.setItem('chatbot_session', sessionId); } catch(e) {}
      }
      typing.remove();
      addMsg(data.reply || 'Sorry, something went wrong.', 'bot');
    } catch(e) {
      typing.remove();
      addMsg('Unable to connect. Please try again.', 'bot');
    }
    snd.disabled = false;
  }

  function addMsg(text, type) {
    const m = document.createElement('div');
    m.className = 'msg ' + type;
    m.textContent = text;
    msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
    return m;
  }

  snd.onclick = send;
  inp.onkeypress = function(e) { if (e.key === 'Enter') send(); };
})();
