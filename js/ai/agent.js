/**
 * js/ai/agent.js — Browser bridge to the server-side pi SDK agent.
 *
 * The browser keeps the provider key in memory/session storage. For each chat turn
 * it sends the key over same-origin HTTPS to /api/agent/chat; the server uses it as
 * a runtime-only pi AuthStorage override and does not persist it.
 */

const AiAgent = (() => {
  'use strict';

  let catalog = [];
  let catalogLoaded = false;
  let config = null; // { provider, modelId, apiKey, spaceId, spaceTitle }
  let isRunning = false;
  let abortCtl = null;
  const listeners = {};

  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
    return () => { listeners[event] = (listeners[event] || []).filter((l) => l !== fn); };
  }

  function emit(event, data) {
    (listeners[event] || []).forEach((fn) => { try { fn(data); } catch (e) { console.warn('[AiAgent]', e); } });
  }

  async function loadCatalog() {
    if (catalogLoaded) return;
    try {
      const res = await fetch('/api/providers', { credentials: 'same-origin' });
      const data = await res.json();
      catalog = Array.isArray(data.providers) ? data.providers : [];
    } catch (_) {
      catalog = [];
    }
    catalogLoaded = true;
  }

  function getProviders() { return catalog; }

  function getProvider(providerId) {
    return catalog.find((p) => p.id === providerId) || null;
  }

  function configure(cfg) {
    config = cfg ? { ...cfg } : null;
  }

  function getConfig() {
    if (!config) return null;
    const { apiKey: _apiKey, ...safeConfig } = config;
    return { ...safeConfig, hasApiKey: !!config.apiKey };
  }

  function registerToolHandler() {
    // Kept for API compatibility. Tools now run inside the server-side pi SDK session.
  }

  function resetConversation() {
    // Server-side pi sessions are per turn for the demo bridge.
  }

  async function chat(text) {
    if (isRunning) return;
    if (!config || !config.apiKey) {
      emit('chat_error', 'No API key configured. Choose a provider and enter your key.');
      return;
    }
    if (!config.spaceId) {
      emit('chat_error', 'Open a private lab before chatting with the builder.');
      return;
    }

    isRunning = true;
    abortCtl = new AbortController();
    emit('chat_user', text);
    emit('agent_thinking');

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.provider,
          modelId: config.modelId,
          apiKey: config.apiKey,
          spaceId: config.spaceId,
          message: text,
        }),
        signal: abortCtl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Agent request failed');
      if (data.text) emit('chat_delta', data.text);
      if (Array.isArray(data.touchedFiles) && data.touchedFiles.length > 0) {
        emit('space_updated', { spaceId: config.spaceId, files: data.touchedFiles });
      }
    } catch (err) {
      if (err.name === 'AbortError') emit('chat_system', 'Stopped.');
      else emit('chat_error', err.message || 'Agent failed');
    } finally {
      emit('agent_done');
      isRunning = false;
      abortCtl = null;
    }
  }

  function abort() {
    if (abortCtl) abortCtl.abort();
  }

  return {
    loadCatalog,
    getProviders,
    getProvider,
    configure,
    getConfig,
    registerToolHandler,
    resetConversation,
    chat,
    abort,
    on,
    get isRunning() { return isRunning; },
  };
})();
