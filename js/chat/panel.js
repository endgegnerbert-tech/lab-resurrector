/**
 * chat/panel.js — Chat panel (pi agent WebSocket)
 *
 * Connected to PiClient. Shows streaming text, tool status.
 * No emojis. Clean English.
 */

const ChatPanel = (() => {
  'use strict';

  let messagesEl, inputEl, sendBtn;
  let isProcessing = false;
  let currentStreamText = '';
  let currentMsgEl = null;
  let unsubs = [];

  function init() {
    messagesEl = document.getElementById('chat-messages');
    inputEl = document.getElementById('chat-input');
    sendBtn = document.getElementById('chat-send');

    if (!messagesEl || !inputEl || !sendBtn) {
      console.warn('[Chat] elements missing');
      return;
    }

    sendBtn.addEventListener('click', handleSend);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });

    unsubs.push(PiClient.on('chat_delta', (text) => {
      if (!currentMsgEl) {
        currentMsgEl = createAIMessage();
        currentStreamText = '';
      }
      currentStreamText += text;
      updateAIMessage(currentMsgEl, currentStreamText);
      scrollDown();
    }));

    unsubs.push(PiClient.on('chat_user', (text) => addUserMessage(text)));
    unsubs.push(PiClient.on('agent_thinking', () => showTyping()));
    unsubs.push(PiClient.on('agent_done', () => {
      hideTyping();
      finalizeAIMessage();
      isProcessing = false;
      if (sendBtn) sendBtn.disabled = false;
      if (inputEl) {
        inputEl.placeholder = 'Ask the lab assistant...';
        setTimeout(() => inputEl.focus(), 100);
      }
    }));
    unsubs.push(PiClient.on('chat_error', (text) => {
      hideTyping();
      finalizeAIMessage();
      addSystemMessage(text);
    }));
    unsubs.push(PiClient.on('tool_start', (msg) => addToolStatus(msg.tool, msg.args)));
    unsubs.push(PiClient.on('tool_end', (msg) => removeToolStatus(msg.tool)));
    unsubs.push(PiClient.on('info', (text) => addSystemMessage(text)));
    unsubs.push(PiClient.on('chat_system', (text) => addSystemMessage(text)));

    PiClient.ready(() => {
      if (PiClient.isMock) {
        addSystemMessage('pi agent offline - demo mode');
      }
      addAIMessage(
        '**Welcome to flabs!**\n\n' +
        'I\'m your lab assistant. Here\'s how this works:\n\n' +
        '1. **Create a lab** (+ New Lab) or open one from the cards\n' +
        '2. **Describe what you want** -- I\'ll build the simulation\n' +
        '3. **Tweak controls** on the right, watch live data\n' +
        '4. **Compare** with the formula model\n\n' +
        'What do you want to explore today?'
      );
    });

    PiClient.init();
  }

  function handleSend() {
    const text = inputEl.value.trim();
    if (!text || isProcessing) return;
    inputEl.value = '';
    isProcessing = true;
    sendBtn.disabled = true;
    inputEl.placeholder = 'Waiting...';
    PiClient.chat(text);
  }

  function createAIMessage() {
    const div = document.createElement('div');
    div.className = 'message ai';
    div.innerHTML = '<span class="role">flabs</span><div class="text"></div>';
    messagesEl.appendChild(div);
    return div;
  }

  function updateAIMessage(el, text) {
    const textEl = el.querySelector('.text');
    if (textEl) textEl.innerHTML = formatText(text) + '<span class="cursor">|</span>';
  }

  function finalizeAIMessage() {
    if (currentMsgEl) {
      const textEl = currentMsgEl.querySelector('.text');
      if (textEl) textEl.innerHTML = formatText(currentStreamText);
      currentMsgEl = null;
      currentStreamText = '';
    }
  }

  function addAIMessage(text) {
    const div = document.createElement('div');
    div.className = 'message ai';
    div.innerHTML = `<span class="role">flabs</span><div class="text">${formatText(text)}</div>`;
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
      sim_set_param: 'set parameter',
      sim_switch_scene: 'switch scene',
      sim_reset: 'reset',
      sim_highlight: 'highlight',
      source_search: 'search sources',
      space_get_current: 'check space',
      space_write_current_file: 'write file',
      space_verify_current: 'verify space',
      sim_build: 'build sim',
      bash: 'bash',
      write: 'write',
      compaction: 'compacting',
    };
    const label = labels[tool] || tool;
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

  function formatText(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function scrollDown() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function destroy() {
    unsubs.forEach(fn => fn());
    unsubs = [];
  }

  return { init, destroy, addSystemMessage, addAIMessage };
})();
