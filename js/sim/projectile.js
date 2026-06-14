/**
 * sim/projectile.js — Projectile Motion Scene
 * 
 * Schiefer Wurf mit einstellbarem Winkel, Geschwindigkeit, Masse.
 * AI kann Parameter live ändern und Vektoren highlighten.
 * 
 * Parameter:
 *   angle   (5–85)    Abwurfwinkel in Grad
 *   speed   (5–50)    Anfangsgeschwindigkeit
 *   mass    (1–10)    Masse des Projektils
 *   gravity (1–20)    Gravitation
 */

const ProjectileScene = (() => {
  'use strict';

  let ball, ground, wallLeft, wallRight;
  let params = { angle: 45, speed: 20, mass: 2, gravity: 9.81 };
  let initialParams = {};
  let trail = [];
  const MAX_TRAIL = 300;
  let launchPoint = { x: 0, y: 0 };
  let hasLaunched = false;
  let launchVelocity = { x: 0, y: 0 };
  let groundY = 0;

  // ── Init ───────────────────────────────────────
  function init(engine, canvas, sceneParams) {
    Object.assign(params, sceneParams);
    initialParams = { ...params };
    hasLaunched = false;
    trail = [];

    engine.gravity.y = params.gravity / 9.81;

    const w = canvas.width;
    const h = canvas.height;
    groundY = h - 40;

    // Ground
    ground = Matter.Bodies.rectangle(w / 2, groundY + 15, w, 30, {
      isStatic: true,
      friction: 0.3,
      restitution: 0.2,
      render: { fillStyle: '#25253d' }
    });

    // Walls (invisible, to keep ball in frame)
    wallLeft = Matter.Bodies.rectangle(-15, h / 2, 30, h, { isStatic: true });
    wallRight = Matter.Bodies.rectangle(w + 15, h / 2, 30, h, { isStatic: true });

    // Launch point
    launchPoint = { x: 80, y: groundY };
    launchVelocity = { x: 0, y: 0 };

    // Ball (initially at launch point)
    const r = Math.max(8, params.mass * 2);
    ball = Matter.Bodies.circle(launchPoint.x, launchPoint.y, r, {
      density: 0.01 * params.mass,
      restitution: 0.3,
      friction: 0.1,
      render: { fillStyle: '#ff6b6b' }
    });
    Matter.Body.setStatic(ball, true); // Warten auf Launch

    Matter.Composite.add(engine.world, [ground, wallLeft, wallRight, ball]);

    // Angezeigte Trajektorie
    calcTrajectory();
  }

  // ── Reset ──────────────────────────────────────
  function reset(engine) {
    Matter.Composite.clear(engine.world, false);
    Matter.Engine.clear(engine);
    trail = [];
    hasLaunched = false;
    params = { ...initialParams };
    init(engine, SimEngine.canvas, params);
  }

  // ── Launch ─────────────────────────────────────
  function launch(engine) {
    if (!ball || hasLaunched) return;
    const angleRad = params.angle * Math.PI / 180;
    const vx = params.speed * Math.cos(angleRad);
    const vy = -params.speed * Math.sin(angleRad);
    
    Matter.Body.setStatic(ball, false);
    Matter.Body.setVelocity(ball, { x: vx, y: vy });
    Matter.Body.setPosition(ball, { x: launchPoint.x, y: launchPoint.y });
    launchVelocity = { x: vx, y: vy };
    hasLaunched = true;
  }

  // ── Set Param ──────────────────────────────────
  function setParam(engine, name, value) {
    const oldParams = { ...params };
    params[name] = value;

    switch (name) {
      case 'mass':
        if (ball) {
          const r = Math.max(8, value * 2);
          const wasStatic = ball.isStatic;
          const pos = { x: ball.position.x, y: ball.position.y };
          const vel = { x: ball.velocity.x, y: ball.velocity.y };
          Matter.Composite.remove(engine.world, ball);
          ball = Matter.Bodies.circle(pos.x, pos.y, r, {
            density: 0.01 * value,
            restitution: 0.3,
            friction: 0.1,
            render: { fillStyle: '#ff6b6b' }
          });
          Matter.Body.setVelocity(ball, vel);
          if (wasStatic) Matter.Body.setStatic(ball, true);
          Matter.Composite.add(engine.world, ball);
        }
        break;

      case 'angle':
      case 'speed':
        // Reset for new trajectory
        if (!hasLaunched) {
          if (ball) {
            Matter.Body.setStatic(ball, true);
            Matter.Body.setPosition(ball, { x: launchPoint.x, y: launchPoint.y });
            Matter.Body.setVelocity(ball, { x: 0, y: 0 });
          }
          calcTrajectory();
        } else {
          // If already launched, reset and show new config
          reset(engine);
        }
        break;

      case 'gravity':
        engine.gravity.y = value / 9.81;
        break;
    }
  }

  // ── Calculate Trajectory Path ──────────────────
  function calcTrajectory() {
    // Store trajectory points for visual helper
    const angleRad = params.angle * Math.PI / 180;
    const vx = params.speed * Math.cos(angleRad);
    const vy = -params.speed * Math.sin(angleRad);
    const g = params.gravity;

    trail = [];
    const dt = 0.05;
    let x = launchPoint.x;
    let y = launchPoint.y;
    for (let t = 0; t < 100; t++) {
      x = launchPoint.x + vx * t;
      y = launchPoint.y + vy * t + 0.5 * g * t * t;
      if (y > groundY + 5 || x < 0 || x > (SimEngine.canvas ? SimEngine.canvas.width : 1000)) break;
      if (t % 1 === 0) trail.push({ x, y, alpha: 0.2 });
    }
  }

  // ── Get Body Refs ──────────────────────────────
  function getBodyRefs() {
    return { ball, ground };
  }

  // ── Get Params ────────────────────────────────
  function getParams() {
    return {
      angle: params.angle,
      speed: params.speed,
      mass: params.mass,
      gravity: params.gravity
    };
  }

  // ── Highlight ──────────────────────────────────
  function highlight(engine, elementName) {
    if (elementName === 'ball' && ball) {
      ball.render.strokeStyle = '#ffd700';
      ball.render.lineWidth = 3;
      setTimeout(() => {
        if (ball) {
          ball.render.strokeStyle = undefined;
          ball.render.lineWidth = 0;
        }
      }, 2000);
    }
  }

  // ── Custom Render ─────────────────────────────
  function render(ctx, engine) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Background
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Raster
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    for (let x = 0; x < ctx.canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ctx.canvas.height); ctx.stroke();
    }
    for (let y = 0; y < ctx.canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ctx.canvas.width, y); ctx.stroke();
    }

    // Ground
    ctx.fillStyle = '#25253d';
    ctx.fillRect(0, groundY, ctx.canvas.width, ctx.canvas.height - groundY);
    ctx.strokeStyle = '#3a3a55';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(ctx.canvas.width, groundY);
    ctx.stroke();

    // Predicted trajectory (dashed)
    if (!hasLaunched) {
      const angleRad = params.angle * Math.PI / 180;
      const vx = params.speed * Math.cos(angleRad);
      const vy = -params.speed * Math.sin(angleRad);
      const g = params.gravity;
      
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(108,99,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(launchPoint.x, launchPoint.y);
      let px = launchPoint.x, py = launchPoint.y;
      for (let t = 0.1; t < 100; t += 0.1) {
        px = launchPoint.x + vx * t;
        py = launchPoint.y + vy * t + 0.5 * g * t * t;
        if (py > groundY || px < 0 || px > ctx.canvas.width) break;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Launch vector
      const scale = 3;
      ctx.beginPath();
      ctx.moveTo(launchPoint.x, launchPoint.y);
      ctx.lineTo(launchPoint.x + vx * scale, launchPoint.y + vy * scale);
      ctx.strokeStyle = 'rgba(255,107,107,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Trail (actual)
    if (hasLaunched && ball) {
      trail.push({ x: ball.position.x, y: ball.position.y, alpha: 0.7 });
      if (trail.length > MAX_TRAIL) trail.shift();
    }

    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      const alpha = hasLaunched ? (i / trail.length) * 0.6 : t.alpha;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,107,107,${alpha})`;
      ctx.fill();
    }

    // Ball
    if (ball) {
      const r = ball.circleRadius || 8;
      ctx.beginPath();
      ctx.arc(ball.position.x, ball.position.y, r, 0, Math.PI * 2);
      ctx.fillStyle = ball.render.fillStyle || '#ff6b6b';
      ctx.fill();
      if (ball.render.strokeStyle) {
        ctx.strokeStyle = ball.render.strokeStyle;
        ctx.lineWidth = ball.render.lineWidth || 2;
        ctx.stroke();
      }

      // Velocity vector
      const vel = ball.velocity;
      const vscale = 4;
      ctx.beginPath();
      ctx.moveTo(ball.position.x, ball.position.y);
      ctx.lineTo(ball.position.x + vel.x * vscale, ball.position.y + vel.y * vscale);
      ctx.strokeStyle = 'rgba(255,215,0,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Mass label
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      const labelY = ball.position.y + r + 12;
      ctx.fillText(`${params.mass}kg`, ball.position.x, labelY);
    }

    // Launch point marker
    if (!hasLaunched) {
      ctx.beginPath();
      ctx.arc(launchPoint.x, launchPoint.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#6c63ff';
      ctx.fill();
      ctx.fillStyle = 'rgba(136,136,170,0.4)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Start', launchPoint.x, launchPoint.y + 18);
    }

    // Info
    ctx.fillStyle = 'rgba(136,136,170,0.4)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`θ = ${params.angle}°  v₀ = ${params.speed}  g = ${params.gravity.toFixed(1)}m/s²`, 12, 20);

    // "Press Play to launch" hint
    if (!hasLaunched) {
      ctx.fillStyle = 'rgba(136,136,170,0.3)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▶ Play drücken um zu starten', ctx.canvas.width / 2, 20);
    }
  }

  // ── Destroy ────────────────────────────────────
  function destroy(engine) {
    Matter.Composite.remove(engine.world, [ball, ground, wallLeft, wallRight].filter(Boolean));
    trail = [];
    hasLaunched = false;
  }

  // ── Public API ────────────────────────────────
  return {
    init,
    reset,
    setParam,
    getBodyRefs,
    getParams,
    highlight,
    render,
    destroy,
    launch,
    get hasLaunched() { return hasLaunched; }
  };
})();
