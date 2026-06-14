/**
 * sim/pendulum.js — Pendulum Simulation Scene
 * 
 * Ein mathematisches Pendel mit einstellbarer Masse, Länge, Winkel.
 * AI kann Parameter live ändern.
 * 
 * Parameter:
 *   mass   (1–10)   Masse des Pendelkörpers
 *   length (1–8)    Fadenlänge
 *   angle  (5–80)   Auslenkwinkel in Grad
 *   gravity (1–20)  Gravitation
 */

const PendulumScene = (() => {
  'use strict';

  let bob, rod, pivot;
  let params = { mass: 2, length: 4, angle: 45, gravity: 9.81 };
  let initialParams = {};
  let pivotPos = { x: 0, y: 0 };
  let trail = [];
  const MAX_TRAIL = 200;
  let lastBobPos = null;

  // ── Init ───────────────────────────────────────
  function init(engine, canvas, sceneParams) {
    Object.assign(params, sceneParams);
    initialParams = { ...params };

    pivotPos = { x: canvas.width * 0.5, y: canvas.height * 0.25 };

    // Set gravity
    engine.gravity.y = params.gravity / 9.81;

    // Pivot point (static)
    pivot = Matter.Bodies.circle(pivotPos.x, pivotPos.y, 6, {
      isStatic: true,
      collisionFilter: { group: -1 },
      render: { fillStyle: '#8888aa', strokeStyle: '#8888aa' }
    });

    // Bob
    const bobRadius = Math.max(8, params.mass * 3);
    const rodLengthPx = params.length * 30;
    const bobX = pivotPos.x + rodLengthPx * Math.sin(params.angle * Math.PI / 180);
    const bobY = pivotPos.y + rodLengthPx * Math.cos(params.angle * Math.PI / 180);

    bob = Matter.Bodies.circle(bobX, bobY, bobRadius, {
      density: 0.01 * params.mass,
      collisionFilter: { group: -1 },
      render: { fillStyle: params.mass > 5 ? '#ff6b6b' : '#6c63ff' }
    });

    // Constraint (rod)
    rod = Matter.Constraint.create({
      pointA: { x: pivotPos.x, y: pivotPos.y },
      bodyB: bob,
      pointB: { x: 0, y: 0 },
      length: rodLengthPx,
      stiffness: 1.0,
      damping: 0.001,
      render: { strokeStyle: '#8888aa', lineWidth: 2 }
    });

    Matter.Composite.add(engine.world, [pivot, bob, rod]);

    // Track for highlight
    lastBobPos = { x: bobX, y: bobY };
    trail = [];
  }

  // ── Reset ──────────────────────────────────────
  function reset(engine) {
    // Remove old bodies
    Matter.Composite.clear(engine.world, false);
    Matter.Engine.clear(engine);
    trail = [];
    params = { ...initialParams };
    init(engine, SimEngine.canvas, params);
  }

  // ── Set Param ──────────────────────────────────
  function setParam(engine, name, value) {
    const oldParams = { ...params };
    params[name] = value;

    switch (name) {
      case 'mass':
        if (bob) {
          const r = Math.max(8, value * 3);
          // Scale body
          Matter.Body.setMass(bob, 0.01 * value);
          // Resize circle by creating new body
          const newBob = Matter.Bodies.circle(bob.position.x, bob.position.y, r, {
            density: 0.01 * value,
            collisionFilter: { group: -1 },
            render: { fillStyle: value > 5 ? '#ff6b6b' : '#6c63ff' }
          });
          replaceBody(engine, bob, newBob, rod);
          bob = newBob;
          rod.bodyB = bob;
        }
        break;

      case 'length':
        if (bob && pivot) {
          const newLen = value * 30;
          rod.length = newLen;
          // Reposition bob along current angle
          const angleRad = params.angle * Math.PI / 180;
          const newX = pivotPos.x + newLen * Math.sin(angleRad);
          const newY = pivotPos.y + newLen * Math.cos(angleRad);
          Matter.Body.setPosition(bob, { x: newX, y: newY });
          Matter.Body.setVelocity(bob, { x: 0, y: 0 });
        }
        break;

      case 'angle':
        if (bob && pivot) {
          const angleRad = value * Math.PI / 180;
          const newLen = rod.length;
          const newX = pivotPos.x + newLen * Math.sin(angleRad);
          const newY = pivotPos.y + newLen * Math.cos(angleRad);
          Matter.Body.setPosition(bob, { x: newX, y: newY });
          Matter.Body.setVelocity(bob, { x: 0, y: 0 });
        }
        break;

      case 'gravity':
        engine.gravity.y = value / 9.81;
        break;
    }

    // Update render
    if (bob) {
      bob.render.fillStyle = params.mass > 5 ? '#ff6b6b' : '#6c63ff';
    }

    // Reset trail on significant change
    if (['length', 'angle', 'gravity'].includes(name) && 
        Math.abs(value - (oldParams[name] || 0)) > 0.1) {
      trail = [];
    }
  }

  function replaceBody(engine, oldBody, newBody, constraint) {
    Matter.Composite.remove(engine.world, oldBody);
    Matter.Composite.add(engine.world, newBody);
  }

  // ── Get Body Refs ──────────────────────────────
  function getBodyRefs() {
    return { bob, pivot };
  }

  // ── Get Params ────────────────────────────────
  function getParams() {
    const len = rod ? rod.length / 30 : params.length;
    return {
      mass: params.mass,
      length: Math.round(len * 10) / 10,
      angle: params.angle,
      gravity: params.gravity
    };
  }

  // ── Highlight ──────────────────────────────────
  function highlight(engine, elementName) {
    if (elementName === 'bob' && bob) {
      bob.render.strokeStyle = '#ffd700';
      bob.render.lineWidth = 3;
      setTimeout(() => {
        if (bob) {
          bob.render.strokeStyle = undefined;
          bob.render.lineWidth = 0;
        }
      }, 2000);
    }
    if (elementName === 'rod' && rod) {
      rod.render.strokeStyle = '#ffd700';
      rod.render.lineWidth = 4;
      setTimeout(() => {
        if (rod) {
          rod.render.strokeStyle = '#8888aa';
          rod.render.lineWidth = 2;
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

    // Trail
    if (bob) {
      const pos = bob.position;
      if (lastBobPos) {
        const dist = Math.hypot(pos.x - lastBobPos.x, pos.y - lastBobPos.y);
        if (dist > 2) {
          trail.push({ x: pos.x, y: pos.y, alpha: 1 });
          if (trail.length > MAX_TRAIL) trail.shift();
          lastBobPos = { x: pos.x, y: pos.y };
        }
      } else {
        lastBobPos = { x: pos.x, y: pos.y };
      }

      // Fade trail
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        t.alpha = (i / trail.length) * 0.5;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(108,99,255,${t.alpha})`;
        ctx.fill();
      }
    }

    // Draw rod
    if (rod && bob) {
      ctx.beginPath();
      ctx.moveTo(rod.pointA.x, rod.pointA.y);
      ctx.lineTo(bob.position.x, bob.position.y);
      ctx.strokeStyle = rod.render.strokeStyle || '#8888aa';
      ctx.lineWidth = rod.render.lineWidth || 2;
      ctx.stroke();
    }

    // Draw pivot
    if (pivot) {
      ctx.beginPath();
      ctx.arc(pivotPos.x, pivotPos.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#8888aa';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pivotPos.x, pivotPos.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a14';
      ctx.fill();
    }

    // Draw bob
    if (bob) {
      const r = bob.circleRadius || 10;
      ctx.beginPath();
      ctx.arc(bob.position.x, bob.position.y, r, 0, Math.PI * 2);
      ctx.fillStyle = bob.render.fillStyle || '#6c63ff';
      ctx.fill();
      if (bob.render.strokeStyle) {
        ctx.strokeStyle = bob.render.strokeStyle;
        ctx.lineWidth = bob.render.lineWidth || 2;
        ctx.stroke();
      }

      // Velocity vector
      const vel = bob.velocity;
      const scale = 15;
      ctx.beginPath();
      ctx.moveTo(bob.position.x, bob.position.y);
      ctx.lineTo(bob.position.x + vel.x * scale, bob.position.y + vel.y * scale);
      ctx.strokeStyle = 'rgba(255,107,107,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Mass label
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${params.mass}kg`, bob.position.x, bob.position.y + r + 14);
    }

    // Info
    ctx.fillStyle = 'rgba(136,136,170,0.4)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`L = ${(params.length).toFixed(1)}m  g = ${params.gravity.toFixed(1)}m/s²  θ = ${params.angle}°`, 12, 20);
  }

  // ── Destroy ────────────────────────────────────
  function destroy(engine) {
    Matter.Composite.remove(engine.world, [pivot, bob, rod].filter(Boolean));
    trail = [];
    lastBobPos = null;
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
    destroy
  };
})();
