/**
 * main.js — flabs app entry point
 *
 * Two views: launchpad (card grid) <-> space (iframe + sidebar)
 * Navigation via JS, not browser controls.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {

    ChatPanel.init();

    const viewLaunchpad = document.getElementById('view-launchpad');
    const viewSpace     = document.getElementById('view-space');
    const cardGrid      = document.getElementById('card-grid');
    const emptyState    = document.getElementById('empty-state');
    const newSpaceBtn   = document.getElementById('btn-new-space');
    const apiKeyBtn     = document.getElementById('btn-api-key');
    const apiKeyStatus  = document.getElementById('api-key-status');
    const backBtn       = document.getElementById('btn-back');
    const deleteBtn     = document.getElementById('btn-delete-space');
    const spaceTitle    = document.getElementById('space-title');
    const spaceMeta     = document.getElementById('space-meta');
    const spaceFrame    = document.getElementById('space-frame');
    const sidebar       = document.getElementById('space-sidebar');
    const sidebarResizer = document.getElementById('sidebar-resizer');
    const paramPanel    = document.getElementById('param-panel');
    const liveValues    = document.getElementById('live-values');
    const playBtn       = document.getElementById('btn-play');
    const resetBtn      = document.getElementById('btn-reset');
    const exportBtn     = document.getElementById('btn-export-csv');
    const chatInput     = document.getElementById('chat-input');
    const chatSend      = document.getElementById('chat-send');

    let spaces = [];
    let currentSpace = null;
    let currentManifest = null;
    let isPlaying = true;
    let isDeleting = false;
    let userApiKey = localStorage.getItem('flabs_api_key') || '';

    // ── Restore saved API key on page load ──
    if (userApiKey) {
      PiClient.ready(function() {
        PiClient.send('set_api_key', { apiKey: userApiKey });
      });
      if (apiKeyStatus) apiKeyStatus.textContent = 'unlocked';
    }

    // ── View switcher ─────────────────────
    function showLaunchpad() {
      viewSpace.classList.remove('active');
      viewLaunchpad.classList.add('active');
    }

    function showSpace(sp) {
      currentSpace = sp;
      currentManifest = null;
      if (window.ExperimentAPI) {
        window.ExperimentAPI.configure(null);
        window.ExperimentAPI.clear();
      }
      viewLaunchpad.classList.remove('active');
      viewSpace.classList.add('active');
      spaceTitle.textContent = sp.title || sp.id;
      const concepts = (sp.concepts || []).join(', ');
      const created = sp.createdAt
        ? new Date(sp.createdAt).toLocaleDateString()
        : '';
      spaceMeta.textContent = [concepts, created].filter(Boolean).join(' -- ');

      spaceFrame.src = sp.path || '/experiments/spaces/' + sp.id + '/';
      PiClient.send('space_selected', { spaceId: sp.id });
      fetchSpaceManifest(sp.id);
      ChatPanel.addSystemMessage('Opened lab "' + sp.title + '".');
    }

    function closeSpace() {
      currentSpace = null;
      currentManifest = null;
      spaceFrame.removeAttribute('src');
      renderParamPanel(null);
      setFormulaPanel(null);
      if (window.ExperimentAPI) window.ExperimentAPI.configure(null);
      clearDataPanel();
      showLaunchpad();
      renderCardGrid();
    }

    // ── Card grid ─────────────────────────
    function loadAndRenderSpaces() {
      return fetch('/api/spaces')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          spaces = data.spaces || [];
          // server might return full manifest after create
          if (data.space) {
            // called from new-space handler, we'll just use the updated list
          }
          renderCardGrid();
        })
        .catch(function () {
          spaces = [];
          renderCardGrid();
        });
    }

    function renderCardGrid() {
      cardGrid.innerHTML = '';
      if (spaces.length === 0) {
        emptyState.classList.remove('hidden');
        return;
      }
      emptyState.classList.add('hidden');

      spaces.forEach(function (sp) {
        var card = document.createElement('div');
        card.className = 'space-card';
        card.dataset.id = sp.id;

        var title = document.createElement('div');
        title.className = 'card-title';
        title.textContent = sp.title;

        var concepts = document.createElement('div');
        concepts.className = 'card-concepts';
        (sp.concepts || ['physics']).slice(0, 4).forEach(function (c) {
          var tag = document.createElement('span');
          tag.textContent = c;
          concepts.appendChild(tag);
        });

        var preview = document.createElement('div');
        preview.className = 'card-preview';

        var previewFrame = document.createElement('iframe');
        previewFrame.className = 'preview-frame';
        previewFrame.loading = 'lazy';
        previewFrame.src = sp.path || '/experiments/spaces/' + sp.id + '/';
        previewFrame.title = '';

        var fallback = document.createElement('div');
        fallback.className = 'preview-fallback';
        fallback.textContent = 'lab preview';

        preview.appendChild(previewFrame);
        preview.appendChild(fallback);

        // Hide fallback once iframe loads
        previewFrame.addEventListener('load', function () {
          fallback.style.display = 'none';
        });
        previewFrame.addEventListener('error', function () {
          fallback.style.display = 'flex';
        });

        var time = document.createElement('div');
        time.className = 'card-time';
        time.textContent = sp.createdAt
          ? new Date(sp.createdAt).toLocaleDateString()
          : '';

        card.appendChild(title);
        card.appendChild(concepts);
        card.appendChild(preview);
        card.appendChild(time);
        card.addEventListener('click', function () { showSpace(sp); });
        cardGrid.appendChild(card);
      });
    }

    // ── Manifest / panels ─────────────────
    function fetchSpaceManifest(spaceId) {
      fetch('/api/spaces/' + encodeURIComponent(spaceId) + '/manifest')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (manifest) {
          currentManifest = manifest;
          if (window.ExperimentAPI) window.ExperimentAPI.configure(manifest);
          renderParamPanel(manifest);
          setFormulaPanel(manifest);
          syncAllSectionHeights();
        })
        .catch(function () {});
    }

    function renderParamPanel(manifest) {
      if (!paramPanel) return;
      var params = manifest && manifest.parameters;
      if (!params || Object.keys(params).length === 0) {
        paramPanel.innerHTML = '<div class="param-empty">No controls</div>';
        return;
      }

      paramPanel.innerHTML = '';
      for (var name in params) {
        if (!params.hasOwnProperty(name)) continue;
        var cfg = params[name];

        var id_safe = 'pv-' + name.replace(/[^a-zA-Z0-9_-]/g, '_');
        var item = document.createElement('div');
        item.className = 'param-item';
        item.innerHTML =
          '<label title="' + (cfg.meaning || '') + '">' + cfg.label + '</label>' +
          '<input type="range" min="' + cfg.min + '" max="' + cfg.max + '"' +
                 ' step="' + cfg.step + '" value="' + cfg.default + '" data-param="' + name + '">' +
          '<span class="pv" id="' + id_safe + '">' + cfg.default + (cfg.unit || '') + '</span>';
        paramPanel.appendChild(item);

        var slider = item.querySelector('input');
        slider.addEventListener('input', (function (n, id) {
          return function (e) {
            var val = parseFloat(e.target.value);
            var pvEl = document.getElementById(id);
            if (pvEl) pvEl.textContent = val + (params[n].unit || '');
            if (spaceFrame && spaceFrame.contentWindow) {
              spaceFrame.contentWindow.postMessage({
                type: 'param:set', name: n, value: val,
              }, window.location.origin);
            }
          };
        })(name, id_safe));
      }
    }

    function setFormulaPanel(manifest) {
      var box = document.querySelector('.formula-box');
      var vars = document.querySelector('.formula-vars');
      var result = document.querySelector('.result-value');
      if (!box || !vars || !result) return;

      var formula = manifest && manifest.formulas && manifest.formulas[0];
      if (!formula) {
        box.textContent = '--';
        vars.innerHTML = '';
        result.textContent = '--';
        return;
      }

      box.textContent = formula.formula;
      vars.innerHTML = '';
      var varEntries = formula.variables || {};
      for (var k in varEntries) {
        if (!varEntries.hasOwnProperty(k)) continue;
        var row = document.createElement('div');
        row.className = 'var-row';
        row.innerHTML = '<span class="var-name">' + k + '</span><span class="var-desc">' + varEntries[k] + '</span>';
        vars.appendChild(row);
      }
      result.textContent = formula.exampleCalculation || formula.validWhen || '--';
    }

    function clearDataPanel() {
      if (liveValues) liveValues.innerHTML = '';
      if (window.ExperimentAPI) window.ExperimentAPI.clear();
    }

    // ── Collapsible sections ──────────────
    function syncSectionHeight(section) {
      if (!section) return;
      var body = section.querySelector('.section-body');
      if (!body) return;
      if (section.classList.contains('collapsed')) {
        body.style.maxHeight = '0px';
      } else {
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    }

    function syncAllSectionHeights() {
      document.querySelectorAll('.collapsible').forEach(syncSectionHeight);
    }

    document.querySelectorAll('.section-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId = btn.dataset.target;
        var body = document.getElementById(targetId);
        var section = btn.closest('.collapsible');
        if (!body || !section) return;

        var isOpening = section.classList.contains('collapsed');
        section.classList.toggle('collapsed');
        syncSectionHeight(section);
        try { localStorage.setItem('section-' + targetId, isOpening ? 'open' : 'closed'); } catch (_) {}
      });

      var targetId = btn.dataset.target;
      var section = btn.closest('.collapsible');
      if (!section) return;
      var stored;
      try { stored = localStorage.getItem('section-' + targetId); } catch (_) {}
      var defaultCollapsed = targetId === 'formula-body';
      if (stored === 'open') section.classList.remove('collapsed');
      else if (stored === 'closed') section.classList.add('collapsed');
      else if (defaultCollapsed) section.classList.add('collapsed');
      syncSectionHeight(section);
    });

    window.addEventListener('resize', syncAllSectionHeights);

    // ── Sidebar resize ───────────────────
    (function setupSidebarResize() {
      if (!sidebar || !sidebarResizer) return;
      var dragging = false;

      try {
        var savedWidth = localStorage.getItem('flabs_sidebar_width');
        if (savedWidth && window.innerWidth > 800) sidebar.style.width = savedWidth + 'px';
      } catch (_) {}

      function clampWidth(width) {
        var max = Math.min(520, Math.max(320, window.innerWidth - 260));
        return Math.max(260, Math.min(max, width));
      }

      function onMove(e) {
        if (!dragging || window.innerWidth <= 800) return;
        var width = clampWidth(window.innerWidth - e.clientX);
        sidebar.style.width = width + 'px';
        syncAllSectionHeights();
      }

      function stop() {
        if (!dragging) return;
        dragging = false;
        sidebarResizer.classList.remove('dragging');
        document.body.style.userSelect = '';
        try {
          var width = parseInt(sidebar.style.width, 10);
          if (width) localStorage.setItem('flabs_sidebar_width', String(width));
        } catch (_) {}
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', stop);
      }

      sidebarResizer.addEventListener('mousedown', function (e) {
        if (window.innerWidth <= 800) return;
        dragging = true;
        sidebarResizer.classList.add('dragging');
        document.body.style.userSelect = 'none';
        e.preventDefault();
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', stop);
      });
    })();

    // ── Play / Reset ─────────────────────
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        isPlaying = !isPlaying;
        playBtn.innerHTML = isPlaying ? '&#9646;&#9646;' : '&#9654;';
        playBtn.title = isPlaying ? 'Pause' : 'Play';
        if (spaceFrame && spaceFrame.contentWindow) {
          spaceFrame.contentWindow.postMessage({
            type: 'control:play', playing: isPlaying,
          }, window.location.origin);
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (spaceFrame && spaceFrame.contentWindow) {
          spaceFrame.contentWindow.postMessage({ type: 'control:reset' }, window.location.origin);
        }
        if (window.ExperimentAPI) window.ExperimentAPI.clear();
        ChatPanel.addSystemMessage('Reset');
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === ' ' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        if (playBtn) playBtn.click();
      }
    });

    // ── Export ────────────────────────────
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        if (window.ExperimentAPI && typeof window.ExperimentAPI.exportCSV === 'function') {
          window.ExperimentAPI.exportCSV();
        }
      });
    }

    // ── postMessage bridge ────────────────
    window.addEventListener('message', function (event) {
      if (event.origin !== window.location.origin) return;
      var data = event.data;
      if (data && data.type === 'experiment:measurement') {
        if (window.ExperimentAPI && data.payload) {
          window.ExperimentAPI.emitMeasurement(data.payload);
        }
      }
    });

    // ── API Key handling ─────────────────
    function promptApiKey() {
      var currentKey = localStorage.getItem('flabs_api_key') || '';
      var masked = currentKey.length > 8 ? currentKey.slice(0, 4) + '...' + currentKey.slice(-4) : '';
      var promptText = 'Enter your AI model API key.\n\n' +
        'Your key stays in your browser (localStorage).\n' +
        'It is sent to THIS server only (never exposed to others).\n' +
        'Supports: OpenAI, Anthropic, DeepSeek, Groq, Google, Ollama...\n\n' +
        (masked ? 'Current key: ' + masked + '\n(leave empty to clear)' : '');
      var key = prompt(promptText, currentKey);
      if (key === null) return;
      if (!key.trim()) {
        localStorage.removeItem('flabs_api_key');
        userApiKey = '';
        if (apiKeyStatus) apiKeyStatus.textContent = 'locked';
        ChatPanel.addSystemMessage('API key cleared. AI features are disabled.');
        return;
      }
      userApiKey = key.trim();
      localStorage.setItem('flabs_api_key', userApiKey);
      PiClient.send('set_api_key', { apiKey: userApiKey });
    }

    if (apiKeyBtn) apiKeyBtn.addEventListener('click', promptApiKey);

    PiClient.on('api_key_ready', function (msg) {
      if (apiKeyStatus) apiKeyStatus.textContent = 'unlocked';
      ChatPanel.addSystemMessage('AI activated: ' + (msg.model || 'connected'));
    });

    PiClient.on('needs_api_key', function () {
      if (apiKeyStatus) apiKeyStatus.textContent = 'locked';
      if (!userApiKey) {
        ChatPanel.addSystemMessage('Enter your API key (tap the key icon in the top bar) to use the AI lab assistant.');
      } else {
        PiClient.send('set_api_key', { apiKey: userApiKey });
      }
    });

    // ── PiClient events ───────────────────
    PiClient.on('space_updated', function (msg) {
      if (msg.spaceId && currentSpace && currentSpace.id === msg.spaceId && spaceFrame && spaceFrame.src) {
        if (spaceFrame.contentWindow) spaceFrame.contentWindow.location.reload();
        ChatPanel.addSystemMessage('Lab updated (' + msg.file + ')');
        fetchSpaceManifest(msg.spaceId);
      }
    });

    // ── Navigation ────────────────────────
    backBtn.addEventListener('click', closeSpace);

    deleteBtn.addEventListener('click', async function () {
      if (!currentSpace || isDeleting) return;
      if (!confirm('Delete lab "' + currentSpace.title + '"? This cannot be undone.')) return;
      isDeleting = true;
      try {
        var res = await fetch('/api/spaces/' + encodeURIComponent(currentSpace.id), { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        ChatPanel.addSystemMessage('Deleted lab "' + currentSpace.title + '".');
        isDeleting = false;
        closeSpace();
        await loadAndRenderSpaces();
      } catch (err) {
        ChatPanel.addSystemMessage(err.message);
        isDeleting = false;
      }
    });

    newSpaceBtn.addEventListener('click', async function () {
      var title = prompt('Name your new lab:');
      if (!title || !title.trim()) return;

      try {
        var res = await fetch('/api/spaces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim() }),
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not create lab');
        await loadAndRenderSpaces();
        showSpace(data.space);
        ChatPanel.addSystemMessage('New lab created. Describe what you want to build!');
      } catch (err) {
        ChatPanel.addSystemMessage(err.message);
      }
    });

    // ── Chat input (standalone, not via ChatPanel.send) ──
    if (chatSend && chatInput) {
      chatSend.addEventListener('click', function () {
        var text = chatInput.value.trim();
        if (!text) return;
        chatInput.value = '';
        PiClient.chat(text);
      });
      chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          chatSend.click();
        }
      });
    }

    // ── Init ──────────────────────────────
    loadAndRenderSpaces();

    console.log('flabs ready');
  });
})();
