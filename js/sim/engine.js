/**
 * sim/engine.js — matter.js Physics Engine Wrapper
 * 
 * Verwaltet die matter.js Engine, Renderer, World.
 * Stellt API für Scene-Wechsel und Parameter-Änderungen bereit.
 */

const SimEngine = (() => {
  'use strict';

  // ── Private State ──────────────────────────────
  let engine, render, runner;
  let canvas, ctx;
  let currentScene = null;
  let isRunning = true;
  let sceneModules = {};
  let paramListeners = [];

  // Body-References für Live-Parameter
  let bodyRefs = {};
  let frameCount = 0;

  // ── Init ───────────────────────────────────────
  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');

    // Canvas dimension
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // matter.js Engine
    engine = Matter.Engine.create({
      gravity: { x: 0, y: 1, scale: 0.001 },
      enableSleeping: false
    });

    // matter.js Render (für debugging, wir zeichnen aber selbst)
    render = Matter.Render.create({
      canvas: canvas,
      engine: engine,
      options: {
        width: canvas.width,
        height: canvas.height,
        wireframes: false,
        background: '#0a0a14',
        showVelocity: false,
        showAngleIndicator: false
      }
    });

    // matter.js Runner
    runner = Matter.Runner.create({ delta: 1000/60 });
    Matter.Runner.run(runner, engine);

    // Eigener Render-Loop (statt matter.js default)
    // Wir nutzen requestAnimationFrame für smooth rendering
    function gameLoop() {
      if (currentScene && currentScene.render) {
        currentScene.render(ctx, engine);
      } else {
        // Default rendering
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const bodies = Matter.Composite.allBodies(engine.world);
        ctx.fillStyle = '#6c63ff';
        for (const b of bodies) {
          const verts = b.vertices;
          ctx.beginPath();
          ctx.moveTo(verts[0].x, verts[0].y);
          for (let i = 1; i < verts.length; i++) {
            ctx.lineTo(verts[i].x, verts[i].y);
          }
          ctx.closePath();
          ctx.fill();
          // Highlight selected
          if (b.render.fillStyle) {
            ctx.fillStyle = b.render.fillStyle;
            ctx.fill();
            ctx.fillStyle = '#6c63ff';
          }
        }
      }

      // Emit measurements every 10 frames (~6x/sec) wenn running
      frameCount++;
      if (isRunning && frameCount % 10 === 0 && currentScene && currentScene.getMeasurements) {
        const measurements = currentScene.getMeasurements(engine);
        if (measurements && window.ExperimentAPI) {
          window.ExperimentAPI.emitMeasurement(measurements);
        }
      }

      requestAnimationFrame(gameLoop);
    }
    gameLoop();

    // Notify listeners
    paramListeners.forEach(fn => fn(getParams()));

    return true;
  }

  function resizeCanvas() {
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    if (engine) {
      // Update render bounds if needed
    }
  }

  // ── Scene Registration ────────────────────────
  function registerScene(name, module) {
    sceneModules[name] = module;
  }

  function loadScene(name, params) {
    if (currentScene && currentScene.destroy) {
      currentScene.destroy(engine);
    }
    // Clear world
    Matter.World.clear(engine.world, false);
    Matter.Engine.clear(engine);
    bodyRefs = {};

    const module = sceneModules[name];
    if (!module) {
      console.error(`Scene "${name}" not found`);
      return;
    }

    currentScene = module;
    currentScene.init(engine, canvas, params || {});
    bodyRefs = currentScene.getBodyRefs ? currentScene.getBodyRefs() : {};

    // Update param panel
    paramListeners.forEach(fn => fn(getParams()));
  }

  // ── Simulation Control ────────────────────────
  function togglePause() {
    if (isRunning) {
      Matter.Runner.stop(runner);
      isRunning = false;
    } else {
      Matter.Runner.run(runner, engine);
      isRunning = true;
    }
    return isRunning;
  }

  function reset() {
    if (currentScene && currentScene.reset) {
      currentScene.reset(engine);
    }
  }

  function setParam(name, value) {
    if (currentScene && currentScene.setParam) {
      currentScene.setParam(engine, name, value);
      bodyRefs = currentScene.getBodyRefs ? currentScene.getBodyRefs() : {};
    }
    paramListeners.forEach(fn => fn(getParams()));
  }

  function setParams(params) {
    for (const [name, value] of Object.entries(params)) {
      setParam(name, value);
    }
  }

  function getParams() {
    if (currentScene && currentScene.getParams) {
      return currentScene.getParams();
    }
    return {};
  }

  function highlightElement(name) {
    if (currentScene && currentScene.highlight) {
      currentScene.highlight(engine, name);
    }
  }

  function onParamsChanged(fn) {
    paramListeners.push(fn);
  }

  // ── Public API ────────────────────────────────
  return {
    init,
    registerScene,
    loadScene,
    togglePause,
    reset,
    setParam,
    setParams,
    getParams,
    highlightElement,
    onParamsChanged,
    get isRunning() { return isRunning; },
    get engine() { return engine; },
    get canvas() { return canvas; },
    get currentScene() { return currentScene; },
    get bodyRefs() { return bodyRefs; }
  };
})();
