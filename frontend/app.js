/* ============================================================
   NEURAL//LINK — APP LOGIC
   ============================================================ */

const API_URL = 'https://neural-link-ai.onrender.com/chat';

// ── DOM Refs ──────────────────────────────────────────────────
const chatArea         = document.getElementById('chat-area');
const messagesContainer= document.getElementById('messages-container');
const messageInput     = document.getElementById('message-input');
const sendBtn          = document.getElementById('send-btn');
const typingIndicator  = document.getElementById('typing-indicator');
const clearBtn         = document.getElementById('clear-btn');
const inputWrapper     = document.getElementById('input-wrapper');
const charCount        = document.getElementById('char-count');
const latencyVal       = document.getElementById('latency-val');
const tokenCount       = document.getElementById('token-count');
const sessionIdEl      = document.getElementById('session-id');
const particleCanvas   = document.getElementById('particle-canvas');



// ── State ─────────────────────────────────────────────────────
let totalTokens = 0;
let isWaiting   = false;

// ── Session ID ───────────────────────────────────────────────
const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
sessionIdEl.textContent = sessionId;

// ── Auto-resize textarea ──────────────────────────────────────
function autoResize() {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

// ── Input events ──────────────────────────────────────────────
messageInput.addEventListener('input', () => {
  autoResize();
  const len = messageInput.value.length;
  charCount.textContent = len;
  sendBtn.disabled = len === 0 || isWaiting;
});

messageInput.addEventListener('focus', () => {
  inputWrapper.classList.add('focused');
});
messageInput.addEventListener('blur', () => {
  inputWrapper.classList.remove('focused');
});

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) sendMessage();
  }
});

// ── Send on button click ──────────────────────────────────────
sendBtn.addEventListener('click', sendMessage);

// ── Clear session ─────────────────────────────────────────────
clearBtn.addEventListener('click', async() => {
  
  try{
      // call backend to clear memory
      console.log("Sending clear request....");

      const responce = await fetch("https://neural-link-ai.onrender.com/clear", {
      method: "POST",
      headers: { 
          "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
      });

      const data = await responce.json();
      console.log("Clear response:", data);

      if(!data.success){
          throw new Error(data.error || "Backend failed to clear session.");
      }

      // clear frontend UI  
      messagesContainer.innerHTML = '';
      totalTokens = 0;
      tokenCount.textContent = '0';
      latencyVal.textContent = '—ms';
      showBootLine('▸ Session cleared. Memory wiped.');
    } catch(error) {
        showBootLine('▸ ERROR clearing session: ' + error.message);
        console.error(error);
      }
});


// ──────────────────────────────────────────────────────────────
//   SEND MESSAGE
// ──────────────────────────────────────────────────────────────
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || isWaiting) return;

  isWaiting = true;
  sendBtn.disabled = true;

  // Fire animation on button
  sendBtn.classList.add('firing');
  setTimeout(() => sendBtn.classList.remove('firing'), 400);

  // Append user message
  appendMessage('user', text);

  // Clear input
  messageInput.value = '';
  charCount.textContent = '0';
  messageInput.style.height = 'auto';
  autoResize();

  // Show typing indicator
  setTyping(true);
  scrollToBottom();

  const startTime = performance.now();

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: text,
        session_id: sessionId
       }),
    });

    const latency = Math.round(performance.now() - startTime);
    latencyVal.textContent = latency + 'ms';

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    setTyping(false);

    if (data.success && data.response) {
      appendMessage('ai', data.response);
      // Rough token estimate
      totalTokens += Math.ceil(data.response.split(/\s+/).length * 1.3);
      tokenCount.textContent = totalTokens;
    } else {
      appendMessage('ai', 'Error: Malformed response from neural substrate.', true);
    }

  } catch (err) {
    const latency = Math.round(performance.now() - startTime);
    latencyVal.textContent = latency + 'ms';
    setTyping(false);
    appendMessage('ai', `CONNECTION ERROR: ${err.message}. Verify API endpoint is running.`, true);
  }

  isWaiting = false;
  sendBtn.disabled = messageInput.value.trim().length === 0;
  scrollToBottom();
}

// ──────────────────────────────────────────────────────────────
//   APPEND MESSAGE
// ──────────────────────────────────────────────────────────────
function appendMessage(sender, text, isError = false) {
  const row = document.createElement('div');
  row.className = `message-row ${sender === 'ai' ? 'ai-row' : 'user-row'}`;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const avatarLabel = sender === 'ai' ? 'AI' : 'YOU';
  const senderLabel = sender === 'ai' ? 'NEURAL//LINK' : 'OPERATOR';

  row.innerHTML = `
    <div class="msg-avatar">${avatarLabel}</div>
    <div class="msg-content">
      <div class="msg-meta">
        <span class="msg-sender">${senderLabel}</span>
        <span class="msg-time">${timeStr}</span>
      </div>
      <div class="msg-bubble${isError ? ' error' : ''}">
        <span class="msg-text"></span>
      </div>
    </div>
  `;

  messagesContainer.appendChild(row);
  scrollToBottom();

  const textEl = row.querySelector('.msg-text');

  if (sender === 'ai') {
    typeText(textEl, text);
  } else {
    textEl.textContent = text;
  }

  return row;
}

// ──────────────────────────────────────────────────────────────
//   TYPING TEXT ANIMATION
// ──────────────────────────────────────────────────────────────
function typeText(el, text) {
  const bubble = el.closest('.msg-bubble');
  bubble.classList.add('typing-cursor');

  const CHUNK_SIZE = 3; // chars per frame
  const DELAY_MS   = 18;
  let idx = 0;

  function next() {
    if (idx < text.length) {
      el.textContent += text.slice(idx, idx + CHUNK_SIZE);
      idx += CHUNK_SIZE;
      scrollToBottom();
      setTimeout(next, DELAY_MS);
    } else {
      el.textContent = text; // ensure complete
      bubble.classList.remove('typing-cursor');
    }
  }

  next();
}

// ──────────────────────────────────────────────────────────────
//   TYPING INDICATOR
// ──────────────────────────────────────────────────────────────
function setTyping(on) {
  if (on) {
    typingIndicator.classList.add('active');
  } else {
    typingIndicator.classList.remove('active');
  }
}

// ──────────────────────────────────────────────────────────────
//   SCROLL TO BOTTOM
// ──────────────────────────────────────────────────────────────
function scrollToBottom() {
  chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });
}

// ──────────────────────────────────────────────────────────────
//   BOOT LINE HELPER
// ──────────────────────────────────────────────────────────────
function showBootLine(text) {
  const line = document.createElement('div');
  line.style.cssText = `
    font-family: var(--font-mono);
    font-size: 11px;
    color: #546e7a;
    letter-spacing: 0.08em;
    padding: 4px 0;
    animation: bootFadeIn 0.3s ease forwards;
  `;
  line.textContent = text;
  messagesContainer.appendChild(line);
  scrollToBottom();
}

// ──────────────────────────────────────────────────────────────
//   PARTICLE SYSTEM
// ──────────────────────────────────────────────────────────────
(function initParticles() {
  const ctx = particleCanvas.getContext('2d');

  function resize() {
    particleCanvas.width  = window.innerWidth;
    particleCanvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const NUM_PARTICLES = 55;
  const particles = [];

  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x:  Math.random() * window.innerWidth,
      y:  Math.random() * window.innerHeight,
      r:  Math.random() * 1.4 + 0.3,
      dx: (Math.random() - 0.5) * 0.25,
      dy: (Math.random() - 0.5) * 0.25 - 0.1,
      alpha: Math.random() * 0.5 + 0.1,
      hue: Math.random() > 0.6 ? 190 : 42, // cyan or amber
    });
  }

  function draw() {
    ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    particles.forEach(p => {
      // Move
      p.x += p.dx;
      p.y += p.dy;

      // Wrap
      if (p.x < 0) p.x = particleCanvas.width;
      if (p.x > particleCanvas.width)  p.x = 0;
      if (p.y < 0) p.y = particleCanvas.height;
      if (p.y > particleCanvas.height) p.y = 0;

      // Draw
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.alpha})`;
      ctx.fill();
    });

    // Draw faint connection lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          const alpha = (1 - dist / 110) * 0.07;
          ctx.strokeStyle = `rgba(0,229,255,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();

// ──────────────────────────────────────────────────────────────
//   GLITCH EFFECT ON LOGO
// ──────────────────────────────────────────────────────────────
(function initGlitch() {
  const logoMain = document.querySelector('.logo-main');
  if (!logoMain) return;
  const original = logoMain.textContent;

  const CHARS = '!@#$%^&*<>?/\\|{}[]~';

  function glitch() {
    let iterations = 0;
    const max = 12;
    const interval = setInterval(() => {
      logoMain.textContent = original
        .split('')
        .map((ch, i) => {
          if (i < iterations) return original[i];
          return Math.random() < 0.35
            ? CHARS[Math.floor(Math.random() * CHARS.length)]
            : ch;
        })
        .join('');
      if (iterations >= original.length) {
        clearInterval(interval);
        logoMain.innerHTML = 'NEURAL<span class="logo-slash">//</span>LINK';
      }
      iterations += 2;
    }, 45);
  }

  // Trigger glitch every 8–14 seconds
  function scheduleGlitch() {
    const delay = 8000 + Math.random() * 6000;
    setTimeout(() => {
      glitch();
      scheduleGlitch();
    }, delay);
  }
  scheduleGlitch();
})();

// ──────────────────────────────────────────────────────────────
//   INIT GREETING
// ──────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    appendMessage(
      'ai',
      `Neural link established. I am NEURAL//LINK — your cognitive interface. Session ${sessionId} is active. How may I assist you today?`
    );
  }, 2200);
});
