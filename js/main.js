/**
 * main.js — flabs app entry point
 *
 * Two views: launchpad (card grid) <-> space (iframe + sidebar)
 * AI: browser-native via AiAgent (keys never reach server)
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const viewLaunchpad = document.getElementById('view-launchpad');
    const viewSpace = document.getElementById('view-space');
    const cardGrid = document.getElementById('card-grid');
    const emptyState = document.getElementById('empty-state');
    const newSpaceBtn = document.getElementById('btn-new-space');
    const apiKeyBtn = document.getElementById('btn-api-key');
    const accountBtn = document.getElementById('btn-account');
    const apiKeyStatus = document.getElementById('api-key-status');
    const backBtn = document.getElementById('btn-back');
    const deleteBtn = document.getElementById('btn-delete-space');
    const spaceTitle = document.getElementById('space-title');
    const spaceMeta = document.getElementById('space-meta');
    const spaceFrame = document.getElementById('space-frame');
    const sidebar = document.getElementById('space-sidebar');
    const sidebarResizer = document.getElementById('sidebar-resizer');
    const paramPanel = document.getElementById('param-panel');
    const liveValues = document.getElementById('live-values');
    const playBtn = document.getElementById('btn-play');
    const resetBtn = document.getElementById('btn-reset');
    const exportBtn = document.getElementById('btn-export-csv');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');

    const authModal = document.getElementById('auth-modal');
    const authForm = document.getElementById('auth-form');
    const authProvider = document.getElementById('auth-provider');
    const authModel = document.getElementById('auth-model');
    const authApiKey = document.getElementById('auth-api-key');
    const authRemember = document.getElementById('auth-remember');
    const authStorageNote = document.getElementById('auth-storage-note');
    const authClearBtn = document.getElementById('btn-auth-clear');
    const authCloseBtn = document.getElementById('btn-auth-close');

    const accountModal = document.getElementById('account-modal');
    const accountCurrent = document.getElementById('account-current');
    const accountCreateForm = document.getElementById('account-create-form');
    const accountLoginForm = document.getElementById('account-login-form');
    const accountDisplayName = document.getElementById('account-display-name');
    const accountRecoveryCode = document.getElementById('account-recovery-code');
    const accountRecoveryResult = document.getElementById('account-recovery-result');
    const accountLogoutBtn = document.getElementById('btn-account-logout');
    const accountCloseBtn = document.getElementById('btn-account-close');

    let spaces = [];
    let currentSpace = null;
    let isPlaying = true;
    let isDeleting = false;
    let providerCatalog = [];
    let authConfig = readStoredAuth();
    let account = null;
    let didRestoreLastSpace = false;
    let isAiProcessing = false;

    /* ── Auth storage helpers ────────────────── */
    function parseStoredAuth(raw, remember, includeKey) {
      if (!raw) return null;
      try {
        const p = JSON.parse(raw);
        return {
          provider: String(p.provider || ''),
          modelId: String(p.modelId || ''),
          apiKey: includeKey ? String(p.apiKey || '') : '',
          remember: !!remember,
        };
      } catch (_) { return null; }
    }

    function readStoredAuth() {
      const prefs = parseStoredAuth(localStorage.getItem('flabs_auth_prefs'), true, false)
        || parseStoredAuth(localStorage.getItem('flabs_auth'), true, false);
      const runtime = parseStoredAuth(sessionStorage.getItem('flabs_auth_runtime'), false, true)
        || parseStoredAuth(sessionStorage.getItem('flabs_auth'), false, true);
      return {
        provider: runtime?.provider || prefs?.provider || '',
        modelId: runtime?.modelId || prefs?.modelId || '',
        apiKey: runtime?.apiKey || '',
        remember: !!prefs,
      };
    }

    function persistAuth() {
      sessionStorage.removeItem('flabs_auth');
      localStorage.removeItem('flabs_auth');
      sessionStorage.removeItem('flabs_auth_runtime');
      localStorage.removeItem('flabs_auth_prefs');
      if (authConfig.provider || authConfig.modelId) {
        const prefs = JSON.stringify({ provider: authConfig.provider, modelId: authConfig.modelId });
        if (authConfig.remember) localStorage.setItem('flabs_auth_prefs', prefs);
      }
      if (authConfig.apiKey) {
        sessionStorage.setItem('flabs_auth_runtime', JSON.stringify({ provider: authConfig.provider, modelId: authConfig.modelId, apiKey: authConfig.apiKey }));
      }
    }

    function clearStoredAuth() {
      authConfig = { provider: '', modelId: '', apiKey: '', remember: false };
      sessionStorage.removeItem('flabs_auth');
      localStorage.removeItem('flabs_auth');
      sessionStorage.removeItem('flabs_auth_runtime');
      localStorage.removeItem('flabs_auth_prefs');
    }

    function configureAiForCurrentSpace() {
      if (!authConfig.apiKey || !authConfig.provider || !authConfig.modelId) { AiAgent.configure(null); return; }
      AiAgent.configure({
        provider: authConfig.provider,
        modelId: authConfig.modelId,
        apiKey: authConfig.apiKey,
        spaceId: currentSpace?.private ? currentSpace.id : '',
        spaceTitle: currentSpace?.title || '',
      });
    }

    function setApiStatus(mode, label) {
      if (!apiKeyStatus) return;
      apiKeyStatus.title = '';
      if (mode === 'ready') {
        apiKeyStatus.textContent = 'ai on';
        apiKeyStatus.title = label || 'AI connected';
      } else {
        apiKeyStatus.textContent = 'locked';
        apiKeyStatus.title = 'AI disabled';
      }
    }

    function updateAccountUi() {
      if (accountBtn) accountBtn.textContent = account ? '👤 ' + (account.displayName || 'Account') : '👤 Account';
      if (accountCurrent) accountCurrent.textContent = account
        ? 'Signed in as ' + (account.displayName || 'Demo account') + '. Private labs are visible only in this account.'
        : 'Not signed in. Create a private account before making labs.';
      if (accountLogoutBtn) accountLogoutBtn.classList.toggle('hidden', !account);
    }

    async function loadAccount() {
      try {
        const res = await fetch('/api/account', { credentials: 'same-origin' });
        const data = await res.json();
        account = data.user || null;
      } catch (_) { account = null; }
      updateAccountUi();
      return account;
    }

    function openAccountModal() {
      if (!accountModal) return;
      accountRecoveryResult.classList.add('hidden');
      accountRecoveryResult.textContent = '';
      updateAccountUi();
      accountModal.classList.remove('hidden');
      accountModal.setAttribute('aria-hidden', 'false');
    }

    function closeAccountModal() {
      if (!accountModal) return;
      accountModal.classList.add('hidden');
      accountModal.setAttribute('aria-hidden', 'true');
    }

    /* ── Provider/model modal ───────────────── */
    function populateProviderOptions(selectedProvider) {
      authProvider.innerHTML = '';
      if (!providerCatalog.length) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No providers loaded';
        authProvider.appendChild(opt);
        authProvider.disabled = true;
        return;
      }
      authProvider.disabled = false;
      providerCatalog.forEach((p) => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name || p.id;
        if (p.models) opt.textContent += ' (' + p.models.length + ')';
        authProvider.appendChild(opt);
      });
      const match = providerCatalog.some((p) => p.id === selectedProvider);
      authProvider.value = match ? selectedProvider : providerCatalog[0].id;
      populateModelOptions(authProvider.value, authConfig.modelId);
    }

    function populateModelOptions(providerId, selectedModelId) {
      authModel.innerHTML = '';
      const p = providerCatalog.find((entry) => entry.id === providerId);
      const models = (p && Array.isArray(p.models)) ? p.models : [];
      if (!models.length) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No models';
        authModel.appendChild(opt);
        authModel.disabled = true;
        return;
      }
      authModel.disabled = false;
      models.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name || m.id;
        authModel.appendChild(opt);
      });
      authModel.value = models.some((m) => m.id === selectedModelId) ? selectedModelId : models[0].id;
    }

    function openAuthModal() {
      authConfig = readStoredAuth();
      populateProviderOptions(authConfig.provider);
      authApiKey.value = authConfig.apiKey || '';
      authRemember.checked = !!authConfig.remember;
      authClearBtn.classList.toggle('hidden', !authConfig.apiKey);
      authStorageNote.textContent = authRemember.checked
        ? 'Provider/model stored in localStorage. Key stays in this browser session only.'
        : 'Key stays only for this browser session.';
      authModal.classList.remove('hidden');
      authModal.setAttribute('aria-hidden', 'false');
      setTimeout(() => {
        if (authApiKey.value) authApiKey.focus();
        else authProvider.focus();
      }, 0);
    }

    function closeAuthModal() {
      authModal.classList.add('hidden');
      authModal.setAttribute('aria-hidden', 'true');
    }

    authProvider.addEventListener('change', () => {
      populateModelOptions(authProvider.value, '');
    });
    authRemember.addEventListener('change', () => {
      authStorageNote.textContent = authRemember.checked
        ? 'Provider/model stored in localStorage. Key stays in this browser session only.'
        : 'Key stays only for this browser session.';
    });

    /* ── Chat / AI helpers ──────────────────── */
    function addChatSystemMessage(text) {
      const div = document.createElement('div');
      div.className = 'message system';
      const t = document.createElement('div');
      t.className = 'text';
      t.textContent = text;
      div.appendChild(t);
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function formatChatText(text) {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    }

    function handleAiChat() {
      const text = chatInput.value.trim();
      if (!text || isAiProcessing) return;
      chatInput.value = '';
      isAiProcessing = true;
      chatSend.disabled = true;
      chatInput.placeholder = 'Waiting...';
      AiAgent.chat(text);
    }

    chatSend.addEventListener('click', handleAiChat);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiChat(); }
    });

    /* ── AiAgent events ─────────────────────── */
    AiAgent.on('chat_delta', (text) => {
      let streamEl = chatMessages.querySelector('.message.ai.streaming');
      if (!streamEl) {
        streamEl = document.createElement('div');
        streamEl.className = 'message ai streaming';
        streamEl.innerHTML = '<span class="role">flabs</span><div class="text"></div>';
        chatMessages.appendChild(streamEl);
      }
      const textEl = streamEl.querySelector('.text');
      if (textEl) textEl.innerHTML = formatChatText(textEl.textContent.replace(/\|$/, '') + text) + '<span class="cursor">|</span>';
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    AiAgent.on('chat_user', (text) => {
      const div = document.createElement('div');
      div.className = 'message user';
      div.innerHTML = '<div class="text">' + formatChatText(text) + '</div>';
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    AiAgent.on('agent_thinking', () => {
      if (!document.getElementById('typing-indicator')) {
        const div = document.createElement('div');
        div.className = 'typing';
        div.id = 'typing-indicator';
        div.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    });

    AiAgent.on('agent_done', () => {
      const typing = document.getElementById('typing-indicator');
      if (typing) typing.remove();
      const streamEl = chatMessages.querySelector('.message.ai.streaming');
      if (streamEl) {
        const textEl = streamEl.querySelector('.text');
        if (textEl) textEl.innerHTML = formatChatText(textEl.textContent.replace(/\|$/, ''));
        streamEl.classList.remove('streaming');
      }
      chatInput.placeholder = 'Ask the lab assistant...';
      chatSend.disabled = false;
      isAiProcessing = false;
    });

    AiAgent.on('chat_error', (text) => {
      const typing = document.getElementById('typing-indicator');
      if (typing) typing.remove();
      const streamEl = chatMessages.querySelector('.message.ai.streaming');
      if (streamEl) streamEl.remove();
      addChatSystemMessage(text);
      chatInput.placeholder = 'Ask the lab assistant...';
      chatSend.disabled = false;
      isAiProcessing = false;
    });

    AiAgent.on('chat_system', (text) => addChatSystemMessage(text));

    AiAgent.on('space_updated', (msg) => {
      if (!currentSpace || msg.spaceId !== currentSpace.id) return;
      fetchSpaceManifest(currentSpace.id);
      try { spaceFrame.contentWindow.location.reload(); } catch (_) { spaceFrame.src = currentSpace.path; }
      addChatSystemMessage('Lab files updated: ' + (msg.files || []).join(', '));
    });

    AiAgent.on('tool_execute', (msg) => {
      if (msg.tool === 'sim_set_param' && spaceFrame && spaceFrame.contentWindow) {
        spaceFrame.contentWindow.postMessage({ type: 'param:set', name: msg.name, value: msg.value }, window.location.origin);
      }
      if (msg.tool === 'sim_reset' && spaceFrame && spaceFrame.contentWindow) {
        spaceFrame.contentWindow.postMessage({ type: 'control:reset' }, window.location.origin);
      }
      if (msg.tool === 'sim_highlight' && spaceFrame && spaceFrame.contentWindow) {
        spaceFrame.contentWindow.postMessage({ type: 'sim_highlight', element: msg.element }, window.location.origin);
      }
      if (msg.tool === 'sim_switch_scene') {
        addChatSystemMessage('Switch scene: ' + msg.scene);
      }
    });

    /* ── Auth form submit / clear ────────────── */
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const provider = authProvider.value;
      const modelId = authModel.value;
      const apiKey = authApiKey.value.trim();
      if (!provider || !apiKey) { addChatSystemMessage('Choose a provider and enter an API key.'); return; }

      const providerEntry = providerCatalog.find((p) => p.id === provider);
      if (!providerEntry) { addChatSystemMessage('Unknown provider.'); return; }

      authConfig = { provider, modelId, apiKey, remember: authRemember.checked };
      persistAuth();
      configureAiForCurrentSpace();
      setApiStatus('ready', (providerEntry.name || provider) + ' / ' + modelId);
      closeAuthModal();
      addChatSystemMessage('AI connected: ' + (providerEntry.name || provider) + ' / ' + modelId);
    });

    authClearBtn.addEventListener('click', () => {
      clearStoredAuth();
      AiAgent.configure(null);
      authApiKey.value = '';
      authRemember.checked = false;
      authClearBtn.classList.add('hidden');
      setApiStatus('locked');
      closeAuthModal();
    });

    /* ── View switching ──────────────────────── */
    function showLaunchpad() {
      viewSpace.classList.remove('active');
      viewLaunchpad.classList.add('active');
    }

    function showSpace(sp) {
      currentSpace = sp;
      configureAiForCurrentSpace();
      try { localStorage.setItem('flabs_last_space_id', sp.id); } catch (_) {}
      if (window.ExperimentAPI) { window.ExperimentAPI.configure(null); window.ExperimentAPI.clear(); }
      viewLaunchpad.classList.remove('active');
      viewSpace.classList.add('active');
      spaceTitle.textContent = sp.title || sp.id;
      const concepts = (sp.concepts || []).join(', ');
      const created = sp.createdAt ? new Date(sp.createdAt).toLocaleDateString() : '';
      spaceMeta.textContent = [concepts, created].filter(Boolean).join(' -- ');
      spaceFrame.src = sp.path || '/experiments/spaces/' + sp.id + '/';
      fetchSpaceManifest(sp.id);
      addChatSystemMessage('Opened lab "' + sp.title + '".');
    }

    function closeSpace() {
      currentSpace = null;
      configureAiForCurrentSpace();
      try { localStorage.removeItem('flabs_last_space_id'); } catch (_) {}
      spaceFrame.removeAttribute('src');
      renderParamPanel(null);
      setFormulaPanel(null);
      if (window.ExperimentAPI) window.ExperimentAPI.configure(null);
      clearDataPanel();
      showLaunchpad();
      renderCardGrid();
    }

    /* ── Card grid ──────────────────────────── */
    function loadAndRenderSpaces() {
      return fetch('/api/spaces', { credentials: 'same-origin' })
        .then((r) => r.json())
        .then((data) => {
          spaces = data.spaces || [];
          renderCardGrid();
          if (!didRestoreLastSpace) {
            didRestoreLastSpace = true;
            let last = '';
            try { last = localStorage.getItem('flabs_last_space_id') || ''; } catch (_) {}
            const match = last && spaces.find((sp) => sp.id === last);
            if (match) showSpace(match);
          }
        })
        .catch(() => { spaces = []; renderCardGrid(); });
    }

    function renderCardGrid() {
      cardGrid.innerHTML = '';
      if (spaces.length === 0) { emptyState.classList.remove('hidden'); return; }
      emptyState.classList.add('hidden');
      spaces.forEach((sp) => {
        const card = document.createElement('div');
        card.className = 'space-card';
        card.dataset.id = sp.id;
        const title = document.createElement('div');
        title.className = 'card-title';
        title.textContent = sp.title;
        const concepts = document.createElement('div');
        concepts.className = 'card-concepts';
        (sp.concepts || ['physics']).slice(0, 4).forEach((c) => {
          const tag = document.createElement('span');
          tag.textContent = c;
          concepts.appendChild(tag);
        });
        const preview = document.createElement('div');
        preview.className = 'card-preview';
        const pf = document.createElement('iframe');
        pf.className = 'preview-frame';
        pf.loading = 'lazy';
        pf.src = sp.path || '/experiments/spaces/' + sp.id + '/';
        pf.title = '';
        const fallback = document.createElement('div');
        fallback.className = 'preview-fallback';
        fallback.textContent = 'lab preview';
        preview.appendChild(pf);
        preview.appendChild(fallback);
        pf.addEventListener('load', () => { fallback.style.display = 'none'; });
        pf.addEventListener('error', () => { fallback.style.display = 'flex'; });
        const time = document.createElement('div');
        time.className = 'card-time';
        time.textContent = sp.createdAt ? new Date(sp.createdAt).toLocaleDateString() : '';
        card.appendChild(title);
        card.appendChild(concepts);
        card.appendChild(preview);
        card.appendChild(time);
        card.addEventListener('click', () => showSpace(sp));
        cardGrid.appendChild(card);
      });
    }

    /* ── Manifest / panels ──────────────────── */
    function fetchSpaceManifest(spaceId) {
      fetch('/api/spaces/' + encodeURIComponent(spaceId) + '/manifest', { credentials: 'same-origin' })
        .then((r) => (r.ok ? r.json() : null))
        .then((manifest) => {
          if (window.ExperimentAPI) window.ExperimentAPI.configure(manifest);
          renderParamPanel(manifest);
          setFormulaPanel(manifest);
          syncAllSectionHeights();
        })
        .catch(() => {});
    }

    function renderParamPanel(manifest) {
      if (!paramPanel) return;
      const params = manifest && manifest.parameters;
      if (!params || Object.keys(params).length === 0) {
        paramPanel.innerHTML = '<div class="param-empty">No controls</div>';
        return;
      }
      paramPanel.innerHTML = '';
      for (const name in params) {
        if (!Object.prototype.hasOwnProperty.call(params, name)) continue;
        const cfg = params[name];
        const idSafe = 'pv-' + name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const item = document.createElement('div');
        item.className = 'param-item';
        const label = document.createElement('label');
        label.textContent = cfg.label;
        label.title = cfg.meaning || '';
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = cfg.min;
        slider.max = cfg.max;
        slider.step = cfg.step;
        slider.value = cfg.default;
        slider.dataset.param = name;
        const val = document.createElement('span');
        val.className = 'pv';
        val.id = idSafe;
        val.textContent = cfg.default + (cfg.unit || '');
        item.appendChild(label);
        item.appendChild(slider);
        item.appendChild(val);
        paramPanel.appendChild(item);
        slider.addEventListener('input', ((n, vid) => {
          return function (e) {
            const v = parseFloat(e.target.value);
            const pvEl = document.getElementById(vid);
            if (pvEl) pvEl.textContent = v + (params[n].unit || '');
            if (spaceFrame && spaceFrame.contentWindow) {
              spaceFrame.contentWindow.postMessage({ type: 'param:set', name: n, value: v }, window.location.origin);
            }
          };
        })(name, idSafe));
      }
    }

    function setFormulaPanel(manifest) {
      const box = document.querySelector('.formula-box');
      const vars = document.querySelector('.formula-vars');
      const result = document.querySelector('.result-value');
      if (!box || !vars || !result) return;
      const formula = manifest && manifest.formulas && manifest.formulas[0];
      if (!formula) { box.textContent = '--'; vars.innerHTML = ''; result.textContent = '--'; return; }
      box.textContent = formula.formula;
      vars.innerHTML = '';
      for (const k in (formula.variables || {})) {
        if (!Object.prototype.hasOwnProperty.call(formula.variables, k)) continue;
        const row = document.createElement('div');
        row.className = 'var-row';
        const n = document.createElement('span');
        n.className = 'var-name';
        n.textContent = k;
        const d = document.createElement('span');
        d.className = 'var-desc';
        d.textContent = formula.variables[k];
        row.appendChild(n);
        row.appendChild(d);
        vars.appendChild(row);
      }
      result.textContent = formula.exampleCalculation || formula.validWhen || '--';
    }

    function clearDataPanel() {
      if (liveValues) liveValues.innerHTML = '';
      if (window.ExperimentAPI) window.ExperimentAPI.clear();
    }

    /* ── Collapsible sections ──────────────── */
    function syncSectionHeight(section) {
      if (!section) return;
      const body = section.querySelector('.section-body');
      if (!body) return;
      body.style.maxHeight = section.classList.contains('collapsed') ? '0px' : body.scrollHeight + 'px';
    }

    function syncAllSectionHeights() {
      document.querySelectorAll('.collapsible').forEach(syncSectionHeight);
    }

    document.querySelectorAll('.section-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const body = document.getElementById(targetId);
        const section = btn.closest('.collapsible');
        if (!body || !section) return;
        const opening = section.classList.contains('collapsed');
        section.classList.toggle('collapsed');
        syncSectionHeight(section);
        try { localStorage.setItem('section-' + targetId, opening ? 'open' : 'closed'); } catch (_) {}
      });
      const targetId = btn.dataset.target;
      const section = btn.closest('.collapsible');
      if (!section) return;
      let stored;
      try { stored = localStorage.getItem('section-' + targetId); } catch (_) {}
      const dc = targetId === 'formula-body';
      if (stored === 'open') section.classList.remove('collapsed');
      else if (stored === 'closed') section.classList.add('collapsed');
      else if (dc) section.classList.add('collapsed');
      syncSectionHeight(section);
    });

    window.addEventListener('resize', syncAllSectionHeights);

    /* ── Sidebar resize ────────────────────── */
    (function setupSidebarResize() {
      if (!sidebar || !sidebarResizer) return;
      let dragging = false;
      try {
        const w = localStorage.getItem('flabs_sidebar_width');
        if (w && window.innerWidth > 800) sidebar.style.width = w + 'px';
      } catch (_) {}
      function clamp(w) { return Math.max(260, Math.min(Math.min(520, Math.max(320, window.innerWidth - 260)), w)); }
      function move(e) {
        if (!dragging || window.innerWidth <= 800) return;
        sidebar.style.width = clamp(window.innerWidth - e.clientX) + 'px';
        syncAllSectionHeights();
      }
      function stop() {
        if (!dragging) return;
        dragging = false;
        sidebarResizer.classList.remove('dragging');
        document.body.style.userSelect = '';
        try { localStorage.setItem('flabs_sidebar_width', String(parseInt(sidebar.style.width, 10))); } catch (_) {}
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', stop);
      }
      sidebarResizer.addEventListener('mousedown', (e) => {
        if (window.innerWidth <= 800) return;
        dragging = true;
        sidebarResizer.classList.add('dragging');
        document.body.style.userSelect = 'none';
        e.preventDefault();
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', stop);
      });
    })();

    /* ── Play / Reset / Export ──────────────── */
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        playBtn.innerHTML = isPlaying ? '&#9646;&#9646;' : '&#9654;';
        playBtn.title = isPlaying ? 'Pause' : 'Play';
        if (spaceFrame && spaceFrame.contentWindow) {
          spaceFrame.contentWindow.postMessage({ type: 'control:play', playing: isPlaying }, window.location.origin);
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (spaceFrame && spaceFrame.contentWindow) {
          spaceFrame.contentWindow.postMessage({ type: 'control:reset' }, window.location.origin);
        }
        if (window.ExperimentAPI) window.ExperimentAPI.clear();
        addChatSystemMessage('Reset');
      });
    }

    document.addEventListener('keydown', (e) => {
      if (!authModal.classList.contains('hidden') && e.key === 'Escape') { e.preventDefault(); closeAuthModal(); return; }
      if (accountModal && !accountModal.classList.contains('hidden') && e.key === 'Escape') { e.preventDefault(); closeAccountModal(); return; }
      if (e.key === ' ' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        if (playBtn) playBtn.click();
      }
    });

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (window.ExperimentAPI && typeof window.ExperimentAPI.exportCSV === 'function') window.ExperimentAPI.exportCSV();
      });
    }

    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;
      const d = event.data;
      if (d && d.type === 'experiment:measurement' && window.ExperimentAPI && d.payload) {
        window.ExperimentAPI.emitMeasurement(d.payload);
      }
    });

    /* ── Navigation ─────────────────────────── */
    if (accountBtn) accountBtn.addEventListener('click', openAccountModal);
    if (accountCloseBtn) accountCloseBtn.addEventListener('click', closeAccountModal);
    document.querySelectorAll('[data-close-account="true"]').forEach((el) => {
      el.addEventListener('click', closeAccountModal);
    });

    if (accountCreateForm) {
      accountCreateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const res = await fetch('/api/account/create', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ displayName: accountDisplayName.value.trim() }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Could not create account');
          account = data.user;
          updateAccountUi();
          accountRecoveryResult.textContent = 'Save this recovery code now. It is shown only once:\n\n' + data.recoveryCode;
          accountRecoveryResult.classList.remove('hidden');
          addChatSystemMessage('Private account created. Save your recovery code.');
          await loadAndRenderSpaces();
        } catch (err) { addChatSystemMessage(err.message); }
      });
    }

    if (accountLoginForm) {
      accountLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const res = await fetch('/api/account/login', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recoveryCode: accountRecoveryCode.value.trim() }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Could not log in');
          account = data.user;
          updateAccountUi();
          closeAccountModal();
          addChatSystemMessage('Signed in. Private labs loaded.');
          await loadAndRenderSpaces();
        } catch (err) { addChatSystemMessage(err.message); }
      });
    }

    if (accountLogoutBtn) {
      accountLogoutBtn.addEventListener('click', async () => {
        await fetch('/api/account/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
        account = null;
        currentSpace = null;
        updateAccountUi();
        closeAccountModal();
        closeSpace();
        await loadAndRenderSpaces();
      });
    }

    if (apiKeyBtn) apiKeyBtn.addEventListener('click', openAuthModal);
    if (authCloseBtn) authCloseBtn.addEventListener('click', closeAuthModal);
    document.querySelectorAll('[data-close-auth="true"]').forEach((el) => {
      el.addEventListener('click', closeAuthModal);
    });

    backBtn.addEventListener('click', closeSpace);

    deleteBtn.addEventListener('click', async function () {
      if (!currentSpace || isDeleting) return;
      if (!currentSpace.private) { addChatSystemMessage('Public demo labs cannot be deleted.'); return; }
      if (!confirm('Delete lab "' + currentSpace.title + '"? This cannot be undone.')) return;
      isDeleting = true;
      try {
        const res = await fetch('/api/spaces/' + encodeURIComponent(currentSpace.id), { method: 'DELETE', credentials: 'same-origin' });
        if (!res.ok) throw new Error('Delete failed');
        addChatSystemMessage('Deleted lab "' + currentSpace.title + '".');
        isDeleting = false;
        closeSpace();
        await loadAndRenderSpaces();
      } catch (err) {
        addChatSystemMessage(err.message);
        isDeleting = false;
      }
    });

    newSpaceBtn.addEventListener('click', async function () {
      const title = prompt('Name your new lab:');
      if (!title || !title.trim()) return;
      try {
        if (!account) { openAccountModal(); throw new Error('Create a private account first.'); }
        const res = await fetch('/api/spaces', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not create lab');
        await loadAndRenderSpaces();
        showSpace(data.space);
        addChatSystemMessage('New lab created. Describe what you want to build!');
      } catch (err) { addChatSystemMessage(err.message); }
    });

    /* ── Load providers & restore auth ──────── */
    function loadProviderCatalog() {
      return fetch('/api/providers', { credentials: 'same-origin' })
        .then((r) => (r.ok ? r.json() : { providers: [] }))
        .then((data) => {
          providerCatalog = Array.isArray(data.providers) ? data.providers : [];
          populateProviderOptions(authConfig.provider);
        })
        .catch(() => { providerCatalog = []; populateProviderOptions(''); });
    }

    // Check if persistent storage is available
    fetch('/api/health', { credentials: 'same-origin' }).then(r=>r.json()).then(data => {
      const warn = document.getElementById('volatile-warning');
      const note = document.getElementById('account-volatile-note');
      if (!data.persistent) {
        if (warn) warn.classList.remove('hidden');
        if (note) note.classList.remove('hidden');
      }
    }).catch(() => {});

    setApiStatus('locked');
    updateAccountUi();
    loadAccount().then(loadAndRenderSpaces);
    loadProviderCatalog();

    // Restore saved provider key for this browser session only.
    AiAgent.loadCatalog().then(() => {
      if (authConfig.apiKey && authConfig.provider) {
        configureAiForCurrentSpace();
        const p = providerCatalog.find((pr) => pr.id === authConfig.provider);
        setApiStatus('ready', (p?.name || authConfig.provider) + ' / ' + authConfig.modelId);
        addChatSystemMessage('AI restored from browser session.');
      }
    });

    console.log('flabs ready — server-side pi SDK builder');
  });
})();
