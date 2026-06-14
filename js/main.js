/**
 * main.js — App Entry Point
 * 
 * Initialisiert SimEngine, ChatPanel, PiClient WebSocket.
 * Verbindet pi-Agent-Events mit der Simulation.
 */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {

    // ── SimEngine Init ──────────────────────────
    const canvas = document.getElementById('sim-canvas');
    if (!canvas) { console.error('Canvas missing'); return; }

    SimEngine.registerScene('pendulum', PendulumScene);
    SimEngine.registerScene('projectile', ProjectileScene);
    SimEngine.init(canvas);
    SimEngine.loadScene('pendulum', { mass: 2, length: 4, angle: 45, gravity: 9.81 });

    // ── ChatPanel Init ──────────────────────────
    ChatPanel.init();

    // ── PiClient Events → SimEngine ────────────
    PiClient.on('sim_set_param', (msg) => {
      SimEngine.setParam(msg.name, msg.value);
    });

    PiClient.on('sim_switch_scene', (msg) => {
      SimEngine.loadScene(msg.scene, msg.params);
      updatePlayButton(msg.scene);
      updateParamPanel();
    });

    PiClient.on('sim_reset', (msg) => {
      SimEngine.reset();
      updateParamPanel();
    });

    PiClient.on('sim_highlight', (msg) => {
      SimEngine.highlightElement(msg.element);
    });

    PiClient.on('sim_state', (state) => {
      // State vom Server bei Verbindung
      if (state.scene && state.scene !== getCurrentScene()) {
        SimEngine.loadScene(state.scene, state.params);
        updatePlayButton(state.scene);
      }
      updateParamPanel();
    });

    // ── Sim Controls ────────────────────────────
    const playBtn = document.getElementById('btn-play');
    const resetBtn = document.getElementById('btn-reset');
    const simSelect = document.getElementById('sim-select');
    const paramPanel = document.getElementById('param-panel');

    // Play/Pause
    playBtn.addEventListener('click', () => {
      const scene = getCurrentScene();
      if (scene === 'projectile') {
        const sim = SimEngine.currentScene;
        if (sim && sim.launch && !sim.hasLaunched) {
          sim.launch(SimEngine.engine);
          playBtn.textContent = '⏸';
          return;
        }
      }
      const running = SimEngine.togglePause();
      playBtn.textContent = running ? '⏸' : '▶';
    });

    // Reset
    resetBtn.addEventListener('click', () => {
      SimEngine.reset();
      PiClient.send('sim_state_update', { state: SimEngine.getParams() });
      updateParamPanel();
      ChatPanel.addSystemMessage('🔄 Simulation zurückgesetzt');
    });

    // Scene Selector
    simSelect.addEventListener('change', (e) => {
      const scene = e.target.value;
      const defaults = {
        pendulum: { mass: 2, length: 4, angle: 45, gravity: 9.81 },
        projectile: { angle: 45, speed: 20, mass: 2, gravity: 9.81 },
      };
      SimEngine.loadScene(scene, defaults[scene]);
      updatePlayButton(scene);
      PiClient.sceneChanged(scene);
      updateParamPanel();

      ChatPanel.addSystemMessage(`🔄 Zu "${scene === 'pendulum' ? 'Pendel' : 'Schiefer Wurf'}" gewechselt`);
    });

    // ── Params Panel ────────────────────────────
    SimEngine.onParamsChanged((params) => {
      renderParamPanel(params);
      PiClient.updateSimState(params);
    });

    // ── Keyboard ─────────────────────────────────
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        playBtn.click();
      }
    });

    console.log('[LabResurrector] ✅ Ready');
  });

  // ── Helpers ───────────────────────────────────
  function getCurrentScene() {
    return document.getElementById('sim-select').value;
  }

  function updatePlayButton(scene) {
    const btn = document.getElementById('btn-play');
    if (scene === 'projectile') {
      btn.textContent = '🚀';
      btn.title = 'Starten';
    } else {
      btn.textContent = '⏸';
      btn.title = 'Play/Pause';
    }
  }

  function updateParamPanel() {
    const params = SimEngine.getParams();
    renderParamPanel(params);
  }

  function renderParamPanel(params) {
    const panel = document.getElementById('param-panel');
    if (!panel || !params) return;

    const labels = {
      mass: 'Masse', length: 'Länge', angle: 'Winkel',
      gravity: 'Gravitation', speed: 'Geschw.'
    };
    const units = {
      mass: 'kg', length: 'm', angle: '°', gravity: 'm/s²', speed: 'm/s'
    };
    const min = { mass: 1, length: 1, angle: 5, gravity: 1, speed: 5 };
    const max = { mass: 10, length: 8, angle: 85, gravity: 20, speed: 50 };
    const step = { mass: 0.5, length: 0.5, angle: 1, gravity: 0.5, speed: 1 };

    panel.innerHTML = '';
    for (const [name, value] of Object.entries(params)) {
      const item = document.createElement('div');
      item.className = 'param-item';
      item.innerHTML = `
        <label>${labels[name] || name}</label>
        <input type="range" min="${min[name] || 0}" max="${max[name] || 100}"
               step="${step[name] || 1}" value="${value}" data-param="${name}">
        <span id="pv-${name}">${value}${units[name] || ''}</span>
      `;
      panel.appendChild(item);

      const slider = item.querySelector('input');
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        SimEngine.setParam(name, val);
        document.getElementById(`pv-${name}`).textContent = val + (units[name] || '');
        PiClient.updateSimState({ [name]: val });
      });
    }
  }
})();
