/**
 * ws/client.js — WebSocket Client für pi Agent Server
 * 
 * Verbindet Browser ↔ pi Agent (via Node.js Server).
 * Streamed Chat and Sim-Controls.
 */

const PiClient = (() => {
  'use strict';

  let ws = null;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let listeners = {};
  let isConnected = false;
  let useMock = false; // Fallback wenn Server nicht erreichbar

  const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const WS_URL = `${WS_PROTOCOL}//${window.location.host}`;

  // ── Event System ──────────────────────────────
  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
    return () => {
      listeners[event] = listeners[event].filter(f => f !== fn);
    };
  }

  function emit(event, data) {
    (listeners[event] || []).forEach(fn => {
      try { fn(data); } catch (e) { console.warn('[PiClient] handler error:', e); }
    });
  }

  // ── WebSocket Verbindung ──────────────────────
  function connect() {
    if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;

    try {
      ws = new WebSocket(WS_URL);
    } catch (e) {
      console.warn('[PiClient] WebSocket failed, using mock mode');
      useMock = true;
      emit('connected', { mock: true });
      if (onReady) onReady();
      return;
    }

    ws.onopen = () => {
      console.log('[PiClient] Connected');
      isConnected = true;
      reconnectAttempts = 0;
      emit('connected', { mock: false });
      if (onReady) onReady();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
      } catch (e) {
        console.warn('[PiClient] Parse error:', e);
      }
    };

    ws.onclose = () => {
      console.log('[PiClient] Disconnected');
      isConnected = false;
      emit('disconnected');
      scheduleReconnect();
    };

    ws.onerror = (err) => {
      console.warn('[PiClient] Error:', err);
    };
  }

  let onReady = null;
  function ready(fn) {
    if (isConnected || useMock) { fn(); return; }
    onReady = fn;
    connect();
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
    console.log(`[PiClient] Reconnect in ${delay}ms (${reconnectAttempts})`);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  }

  // ── Nachrichten senden ────────────────────────
  function send(type, data = {}) {
    if (useMock) {
      handleMockSend(type, data);
      return;
    }
    if (!ws || ws.readyState !== 1) {
      console.warn('[PiClient] Not connected');
      return;
    }
    ws.send(JSON.stringify({ type, ...data }));
  }

  function chat(text) {
    send('chat_message', { text });
  }

  function updateSimState(state) {
    send('sim_state_update', { state });
  }

  function sceneChanged(scene) {
    send('sim_scene_changed', { scene });
  }

  // ── Eingehende Nachrichten ────────────────────
  function handleMessage(msg) {
    switch (msg.type) {
      // Chat Streaming
      case 'chat_delta':
        emit('chat_delta', msg.text);
        break;
      case 'chat_thinking':
        emit('chat_thinking', msg.text);
        break;
      case 'chat_user':
        emit('chat_user', msg.text);
        break;
      case 'chat_error':
        emit('chat_error', msg.text);
        break;

      // Agent State
      case 'agent_start':
        emit('agent_start');
        break;
      case 'agent_thinking':
        emit('agent_thinking');
        break;
      case 'agent_done':
        emit('agent_done');
        break;
      case 'agent_end':
        emit('agent_done');
        break;

      // Tool Execution
      case 'tool_start':
        emit('tool_start', { tool: msg.tool, args: msg.args });
        break;
      case 'tool_end':
        emit('tool_end', { tool: msg.tool, isError: msg.isError });
        break;

      // Simulation Control
      case 'sim_set_param':
        emit('sim_set_param', msg);
        break;
      case 'sim_reset':
        emit('sim_reset', msg);
        break;
      case 'sim_highlight':
        emit('sim_highlight', msg);
        break;

      // Sim Build / Space Updates
      case 'sim_build_start':
        emit('sim_build_start', msg);
        break;
      case 'space_updated':
        emit('space_updated', msg);
        break;

      // State Sync
      case 'sim_state':
        emit('sim_state', msg.state);
        break;

      // Info
      case 'info':
        emit('info', msg.text);
        break;
      case 'chat_system':
        emit('chat_system', msg.text);
        break;
    }
  }

  // ── Mock Mode (wenn Server offline) ──────────
  let mockResponses = [
    "That is an interesting question!\n\nWhat do YOU think? Form a hypothesis!",
    "Interesting! What do you guess will happen?",
    "Good idea! Let us test it.\nI will adjust the simulation -- watch closely!",
    "Interessant! Hast du eine Vermutung? Dann probieren wir es aus!",
  ];
  let mockResponseIdx = 0;

  function handleMockSend(type, data) {
    if (type !== 'chat_message') return;

    emit('chat_user', data.text);
    emit('agent_thinking');

    setTimeout(() => {
      const reply = mockResponses[mockResponseIdx % mockResponses.length];
      mockResponseIdx++;

      // Stream character by character
      let idx = 0;
      const interval = setInterval(() => {
        if (idx < reply.length) {
          emit('chat_delta', reply[idx]);
          idx++;
        } else {
          clearInterval(interval);
          emit('agent_done');
        }
      }, 15);
    }, 800);
  }

  // ── Initialisierung ────────────────────────────
  function init() {
    connect();
  }

  // ── Public API ────────────────────────────────
  return {
    init,
    connect,
    ready,
    send,
    chat,
    updateSimState,
    on,
    get isConnected() { return isConnected || useMock; },
    get isMock() { return useMock; },
  };
})();
