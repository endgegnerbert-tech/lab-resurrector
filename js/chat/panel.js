/**
 * chat/panel.js — Chat Panel (pi Agent WebSocket)
 * 
 * Verbunden mit PiClient WebSocket.
 * Zeigt streaming Text von pi, Fragen, Tool-Status.
 */

const ChatPanel = (() => {
  'use strict';

  let messagesEl, inputEl, sendBtn;
  let isProcessing = false;
  let currentStreamText = '';
  let currentMsgEl = null;
  let unsubs = [];
  let isWaitingForQuestion = false;

  // ── Init ───────────────────────────────────────
  function init() {
    messagesEl = document.getElementById('chat-messages');
    inputEl = document.getElementById('chat-input');
    sendBtn = document.getElementById('chat-send');

    if (!messagesEl || !inputEl || !sendBtn) {
      console.error('[Chat] Elements missing');
      return;
    }

    // Events
    sendBtn.addEventListener('click', handleSend);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // ── PiClient Events ──────────────────────
    unsubs.push(PiClient.on('chat_delta', (text) => {
      // Streaming Text von pi
      if (!currentMsgEl) {
        currentMsgEl = createAIMessage();
        currentStreamText = '';
      }
      currentStreamText += text;
      updateAIMessage(currentMsgEl, currentStreamText);
      scrollDown();
    }));

    unsubs.push(PiClient.on('chat_user', (text) => {
      addUserMessage(text);
    }));

    unsubs.push(PiClient.on('agent_thinking', () => {
      showTyping();
    }));

    unsubs.push(PiClient.on('agent_done', () => {
      hideTyping();
      finalizeAIMessage();
      // Nachfrage-Prompt
      setTimeout(() => {
        inputEl.focus();
      }, 100);
    }));

    unsubs.push(PiClient.on('chat_error', (text) => {
      hideTyping();
      finalizeAIMessage();
      addSystemMessage(`⚠️ ${text}`);
    }));

    unsubs.push(PiClient.on('sim_ask_question', (msg) => {
      // pi fragt den Schüler — wir zeigen die Frage
      hideTyping();
      finalizeAIMessage();
      addAIMessage(msg.text, 'question');
      isWaitingForQuestion = true;
      inputEl.placeholder = 'Antworte dem AI-Experimentleiter...';
      inputEl.focus();
    }));

    unsubs.push(PiClient.on('sim_question_answered', () => {
      isWaitingForQuestion = false;
    }));

    unsubs.push(PiClient.on('tool_start', (msg) => {
      addToolStatus(msg.tool, msg.args);
    }));

    unsubs.push(PiClient.on('tool_end', (msg) => {
      removeToolStatus(msg.tool);
    }));

    unsubs.push(PiClient.on('info', (text) => {
      addSystemMessage(text);
    }));

    // ── Welcome Message ──────────────────────
    PiClient.ready(() => {
      if (PiClient.isMock) {
        addSystemMessage('⚡ pi Agent offline — Demo-Modus mit lokalen Antworten');
      }

      addAIMessage(
        '👋 **Willkommen bei LabResurrector!**\n\n' +
        'Ich bin **pi**, dein AI-Experimentleiter. 🧪\n\n' +
        '**So lernen wir:**\n' +
        '1. Du stellst eine **Hypothese** auf\n' +
        '2. Ich passe die Simulation an → du beobachtest\n' +
        '3. Wir besprechen das Ergebnis\n\n' +
        '**Los geht\'s!** Was denkst du: Beeinflusst die Masse eines Pendels seine Schwingungsdauer? 🤔'
      );
    });

    // ── Initial Connect ──────────────────────
    PiClient.init();
  }

  // ── Send ──────────────────────────────────────
  function handleSend() {
    const text = inputEl.value.trim();
    if (!text || isProcessing) return;

    inputEl.value = '';
    isProcessing = true;
    sendBtn.disabled = true;

    // An pi senden — der Server routed es zum Agenten
    PiClient.chat(text);

    // Input sperren bis Antwort da ist
    inputEl.placeholder = 'Warte auf Antwort...';

    const enableInput = () => {
      isProcessing = false;
      sendBtn.disabled = false;
      inputEl.placeholder = isWaitingForQuestion
        ? 'Antworte dem AI-Experimentleiter...'
        : 'Frag den AI-Experimentleiter...';
      PiClient.on('agent_done', () => {
        // Einmalig nach done wieder aktivieren
      }, { once: true });
    };

    // Nach agent_done wieder aktivieren
    const unsub = PiClient.on('agent_done', () => {
      isProcessing = false;
      sendBtn.disabled = false;
      inputEl.placeholder = isWaitingForQuestion
        ? 'Antworte...'
        : 'Frag den AI-Experimentleiter...';
      unsub();
    });
  }

  // ── Message Creation ──────────────────────────
  function createAIMessage() {
    const div = document.createElement('div');
    div.className = 'message ai';
    div.innerHTML = '<span class="role">🧑‍🔬 pi Agent</span><div class="text"></div>';
    messagesEl.appendChild(div);
    return div;
  }

  function updateAIMessage(el, text) {
    const textEl = el.querySelector('.text');
    if (textEl) {
      textEl.innerHTML = formatText(text) + '<span class="cursor">▌</span>';
    }
  }

  function finalizeAIMessage() {
    if (currentMsgEl) {
      const textEl = currentMsgEl.querySelector('.text');
      if (textEl) {
        textEl.innerHTML = formatText(currentStreamText);
      }
      currentMsgEl = null;
      currentStreamText = '';
    }
  }

  function addAIMessage(text, type) {
    const div = document.createElement('div');
    div.className = `message ai`;
    let html = '<span class="role">🧑‍🔬 pi Agent</span>';
    html += `<div class="text">${formatText(text)}</div>`;
    if (type === 'question') {
      html += '<span class="phase-badge">🤔 Frage</span>';
    }
    div.innerHTML = html;
    messagesEl.appendChild(div);
    scrollDown();
  }

  function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'message user';
    div.innerHTML = `<div class="text">${formatText(text)}</div>`;
    messagesEl.appendChild(div);
    scrollDown();
  }

  function addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'message system';
    div.innerHTML = `<div class="text">${text}</div>`;
    messagesEl.appendChild(div);
    scrollDown();
  }

  function addToolStatus(tool, args) {
    const labels = {
      sim_set_param: '⚡ Parameter ändern',
      sim_switch_scene: '🔄 Szene wechseln',
      sim_reset: '🔄 Reset',
      sim_highlight: '🎯 Highlight',
      sim_ask_question: '💬 Frage',
      sim_build: '🔧 Baue Simulation',
      bash: '💻 Bash',
      write: '📝 Schreibe Datei',
      compaction: '🧹 Komprimiere',
    };
    const label = labels[tool] || `🔧 ${tool}`;
    const detail = args ? ` ${JSON.stringify(args)}` : '';

    const existing = document.getElementById(`tool-${tool}`);
    if (existing) {
      existing.querySelector('.detail').textContent = detail;
      return;
    }

    const div = document.createElement('div');
    div.className = 'message system tool-status';
    div.id = `tool-${tool}`;
    div.innerHTML = `${label}<span class="detail">${detail}</span>`;
    messagesEl.appendChild(div);
    scrollDown();
  }

  function removeToolStatus(tool) {
    const el = document.getElementById(`tool-${tool}`);
    if (el) {
      el.classList.add('done');
      setTimeout(() => el.remove(), 2000);
    }
  }

  // ── Typing Indicator ──────────────────────────
  function showTyping() {
    if (document.getElementById('typing-indicator')) return;
    const div = document.createElement('div');
    div.className = 'typing';
    div.id = 'typing-indicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(div);
    scrollDown();
  }

  function hideTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  // ── Helpers ──────────────────────────────────
  function formatText(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function scrollDown() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ── Cleanup ──────────────────────────────────
  function destroy() {
    unsubs.forEach(fn => fn());
    unsubs = [];
  }

  // ── Public API ────────────────────────────────
  return {
    init,
    destroy,
    addSystemMessage,
    addAIMessage,
  };
})();
