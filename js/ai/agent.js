/**
 * js/ai/agent.js — Browser-side AI agent
 *
 * Direct LLM API calls from the browser. No API keys sent to the server.
 * Supports OpenAI-compatible providers and Anthropic with tool calling.
 */

const AiAgent = (() => {
  'use strict';

  /* ── Provider configs (base URLs, auth, API format) ── */
  const PROVIDER_CONFIGS = {
    'openai': { baseUrl: 'https://api.openai.com/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    'ant-ling': { baseUrl: 'https://api.antling.com/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    'anthropic': { baseUrl: 'https://api.anthropic.com/v1', format: 'anthropic', authHeader: 'x-api-key', authPrefix: '' },
    'deepseek': { baseUrl: 'https://api.deepseek.com/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    'fireworks': { baseUrl: 'https://api.fireworks.ai/inference/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    'google': { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', format: 'google', authType: 'query', authParam: 'key' },
    'groq': { baseUrl: 'https://api.groq.com/openai/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    'huggingface': { baseUrl: 'https://api-inference.huggingface.co/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    'mistral': { baseUrl: 'https://api.mistral.ai/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    'nvidia': { baseUrl: 'https://api.nvcf.nvidia.com/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    'openai': { baseUrl: 'https://api.openai.com/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    'openrouter': { baseUrl: 'https://openrouter.ai/api/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    'together': { baseUrl: 'https://api.together.xyz/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    'xai': { baseUrl: 'https://api.x.ai/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    'cerebras': { baseUrl: 'https://api.cerebras.ai/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    'kimi-coding': { baseUrl: 'https://api.moonshot.cn/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    'minimax': { baseUrl: 'https://api.minimax.chat/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    'moonshotai': { baseUrl: 'https://api.moonshot.cn/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
    'zai': { baseUrl: 'https://api.z.ai/v1', format: 'openai', authHeader: 'Authorization', authPrefix: 'Bearer ' },
  };

  /* ── Provider+Model catalog from server ────── */
  let catalog = [];
  let catalogLoaded = false;

  async function loadCatalog() {
    if (catalogLoaded) return;
    try {
      const res = await fetch('/api/providers');
      const data = await res.json();
      catalog = Array.isArray(data.providers) ? data.providers : [];
      catalogLoaded = true;
    } catch (_) { catalog = []; catalogLoaded = true; }
  }

  function getProviders() { return catalog; }

  function getProvider(providerId) {
    const entry = catalog.find((p) => p.id === providerId);
    if (!entry) return null;
    const cfg = PROVIDER_CONFIGS[providerId];
    return cfg ? { ...entry, ...cfg } : null;
  }

  /* ── Tool definitions (physics sim control) ─ */
  const TOOLS = [
    {
      name: 'sim_set_param',
      description: 'Change a simulation parameter in real time. Parameters: mass(1-10), length(1-8), angle(5-85), gravity(1-20), speed(5-50).',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Parameter name' },
          value: { type: 'number', description: 'New parameter value' },
        },
        required: ['name', 'value'],
      },
    },
    {
      name: 'sim_reset',
      description: 'Reset the simulation to default parameters.',
      parameters: { type: 'object', properties: {} },
    },
    {
      name: 'sim_switch_scene',
      description: 'Switch the simulation scene: pendulum or projectile motion.',
      parameters: {
        type: 'object',
        properties: {
          scene: { type: 'string', enum: ['pendulum', 'projectile'] },
        },
        required: ['scene'],
      },
    },
    {
      name: 'sim_highlight',
      description: 'Highlight a visual element: bob, rod, ball, ground, velocity_vector.',
      parameters: {
        type: 'object',
        properties: {
          element: { type: 'string' },
        },
        required: ['element'],
      },
    },
  ];

  /* ── Helpers ──────────────────────────────── */
  function toOpenAITools() {
    return TOOLS.map((t) => ({
      type: 'function',
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));
  }

  function toAnthropicTools() {
    return TOOLS.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters }));
  }

  function buildSystemPrompt(spaceId, spaceTitle) {
    return (
      'You are flabs — an AI physics lab assistant. You help students explore physics through interactive simulations.\n\n' +
      (spaceId ? 'Current space: ' + spaceId + ' (' + (spaceTitle || spaceId) + ')\n\n' : '') +
      'RULES:\n' +
      '- Guide students by asking questions and suggesting experiments.\n' +
      '- When the student has a hypothesis, test it by changing the simulation parameters.\n' +
      '- Explain the physics behind what they observe.\n' +
      '- Keep explanations clear and age-appropriate for school students.\n\n' +
      'You can control the simulation with these tools:\n' +
      TOOLS.map((t) => '- ' + t.name + ': ' + t.description.split('.')[0] + '.').join('\n') +
      '\n\nThe student does NOT see which tool you called. Just describe what changed.'
    );
  }

  /* ── Event system ─────────────────────────── */
  const listeners = {};
  let abortCtl = null;

  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
    return () => { listeners[event] = (listeners[event] || []).filter((l) => l !== fn); };
  }

  function emit(event, data) {
    (listeners[event] || []).forEach((fn) => { try { fn(data); } catch (e) { console.warn('[AiAgent]', e); } });
  }

  /* ── Core state ───────────────────────────── */
  let config = null; // { provider, modelId, apiKey, spaceId, spaceTitle }
  let messages = [];
  let toolHandlers = {}; // name → fn(params)
  let isRunning = false;

  function getProviders() { return catalog; }

  function getProvider(providerId) {
    const entry = catalog.find((p) => p.id === providerId);
    if (!entry) return null;
    const cfg = PROVIDER_CONFIGS[providerId];
    return cfg ? { ...entry, ...cfg } : null;
  }

  function configure(cfg) {
    config = cfg ? { ...cfg } : null;
  }

  function getConfig() { return config; }

  function registerToolHandler(name, fn) { toolHandlers[name] = fn; }

  function resetConversation() {
    messages = [];
  }

  /* ── Streaming requests ───────────────────── */
  function makeHeaders(provider) {
    const headers = {};
    if (provider.format === 'openai' || provider.authType !== 'query') {
      headers[provider.authHeader] = provider.authPrefix + config.apiKey;
    }
    // Google uses query param, not header
    return headers;
  }

  /* buildUrl removed — unused with current API streaming approach */

  async function streamOpenAI(provider) {
    const body = {
      model: config.modelId,
      messages: [
        { role: 'system', content: buildSystemPrompt(config.spaceId, config.spaceTitle) },
        ...messages,
      ],
      tools: toOpenAITools(),
      stream: true,
      stream_options: { include_usage: true },
    };

    const response = await fetch(provider.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: { ...makeHeaders(provider), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: abortCtl?.signal,
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      throw new Error('API ' + response.status + ': ' + err.slice(0, 300));
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith('data: ')) continue;
        const d = t.slice(6);
        if (d === '[DONE]') continue;
        try {
          const chunk = JSON.parse(d);
          const delta = chunk.choices?.[0]?.delta;
          if (delta?.content) {
            text += delta.content;
            emit('chat_delta', delta.content);
          }
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (tc.function?.name) {
                emit('tool_start', { tool: tc.function.name });
              }
            }
          }
        } catch (_) { /* skip parse errors */ }
      }
    }

    return text;
  }

  async function streamAnthropic(provider) {
    const body = {
      model: config.modelId,
      system: buildSystemPrompt(config.spaceId, config.spaceTitle),
      messages: messages,
      tools: toAnthropicTools(),
      stream: true,
      max_tokens: 4096,
    };

    const response = await fetch(provider.baseUrl + '/messages', {
      method: 'POST',
      headers: { ...makeHeaders(provider), 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body),
      signal: abortCtl?.signal,
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      throw new Error('API ' + response.status + ': ' + err.slice(0, 300));
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = '';
    let text = '';
    let currentEventType = ''; // eslint-disable-line
    let pendingToolName = '';
    let pendingToolInput = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      sseBuffer += decoder.decode(value, { stream: true });

      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('event: ')) {
          currentEventType = trimmed.slice(7); // eslint-disable-line
          continue;
        }
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);
          if (!data) continue;
          try {
            const ev = JSON.parse(data);
            if (ev.type === 'content_block_start' && ev.content_block?.type === 'tool_use') {
              pendingToolName = ev.content_block.name;
              pendingToolInput = '';
              emit('tool_start', { tool: pendingToolName });
            }
            if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
              text += ev.delta.text;
              emit('chat_delta', ev.delta.text);
            }
            if (ev.type === 'content_block_delta' && ev.delta?.type === 'input_json_delta') {
              pendingToolInput += ev.delta.partial_json || '';
            }
            if (ev.type === 'message_delta' && ev.delta?.stop_reason === 'tool_use') {
              // Tool calls pending
            }
          } catch (_) { /* skip */ }
        }
      }
    }

    return text;
  }

  /* ── Tool execution ──────────────────────── */
  /* executeToolCall removed — tool handlers emit events directly */

  /* ── Chat ─────────────────────────────────── */
  async function chat(text) {
    if (isRunning) return;
    if (!config || !config.apiKey) {
      emit('chat_error', 'No API key configured. Choose a provider and enter your key.');
      return;
    }

    const provider = getProvider(config.provider);
    if (!provider) {
      emit('chat_error', 'Unknown provider. Choose a supported provider.');
      return;
    }

    isRunning = true;
    abortCtl = new AbortController();

    messages.push({ role: 'user', content: text });
    emit('chat_user', text);

    let turnCount = 0;
    const maxTurns = 5;

    try {
      while (turnCount < maxTurns) {
        turnCount++;
        emit('agent_thinking');

        let responseText;
        if (provider.format === 'anthropic') {
          responseText = await streamAnthropic(provider);
        } else {
          responseText = await streamOpenAI(provider);
        }

        // Check if there's a tool call to process (simplified: we detect from tool_start events)
        // For now, assume tool calls are handled via postMessage directly from the tool_start emit
        // The actual tool execution loop would need the response content to check for tool_calls
        // This is a simplification — for full tool call round-trip we'd need the final response JSON

        messages.push({ role: 'assistant', content: responseText || '' });
        break; // Single pass for now simplifies tool handling
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        emit('chat_system', 'Stopped.');
      } else {
        emit('chat_error', err.message);
      }
      messages.push({ role: 'assistant', content: 'Error: ' + err.message });
    }

    emit('agent_done');
    isRunning = false;
    abortCtl = null;
  }

  function abort() {
    if (abortCtl) {
      abortCtl.abort();
      abortCtl = null;
    }
    if (isRunning) {
      isRunning = false;
      emit('agent_done');
    }
  }

  /* ── Init ─────────────────────────────────── */
  function init() {
    // Register default tool handlers that emit events for the UI
    registerToolHandler('sim_set_param', (params) => {
      emit('tool_execute', { tool: 'sim_set_param', name: params.name, value: params.value });
      return { status: 'ok', message: 'Set ' + params.name + ' to ' + params.value };
    });
    registerToolHandler('sim_reset', () => {
      emit('tool_execute', { tool: 'sim_reset' });
      return { status: 'ok', message: 'Reset' };
    });
    registerToolHandler('sim_switch_scene', (params) => {
      emit('tool_execute', { tool: 'sim_switch_scene', scene: params.scene });
      return { status: 'ok', message: 'Switched to ' + params.scene };
    });
    registerToolHandler('sim_highlight', (params) => {
      emit('tool_execute', { tool: 'sim_highlight', element: params.element });
      return { status: 'ok', message: 'Highlighted ' + params.element };
    });
  }

  init();

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
