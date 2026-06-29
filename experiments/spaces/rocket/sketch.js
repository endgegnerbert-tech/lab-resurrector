/**
 * sketch.js — Water Rocket Simulation (2D Projectile)
 *
 * Physically motivated model of a pressurized water rocket:
 * - Realistic dry mass (~0.15 kg for a 1.5L PET bottle)
 * - Thrust from mass flow rate: F = ṁ · v_exhaust (momentum thrust)
 * - Exhaust velocity via Bernoulli: v_exhaust = sqrt(2·P/ρ)
 * - Mass flow via nozzle area: ṁ = ρ · A_nozzle · v_exhaust
 * - After water depletion, coasts as projectile under gravity
 * - Predictions using Tsiolkovsky rocket equation + projectile motion
 *
 * Controls via postMessage bridge (parent app control bar).
 * Measurements emitted via postMessage to parent data panel.
 */

(function () {
  'use strict';

  const canvas = document.getElementById('sim');
  const ctx = canvas.getContext('2d');

  // ── Constants ──────────────────────────────────
  const G = 9.81;               // m/s² gravity
  const RHO_WATER = 1000;       // kg/m³
  const P_ATM = 1.013e5;        // Pa atmospheric pressure
  const NOZZLE_RADIUS = 0.009;  // m (~9 mm typical soda bottle nozzle)
  const NOZZLE_AREA = Math.PI * NOZZLE_RADIUS * NOZZLE_RADIUS; // m²
  const DRY_MASS = 0.15;        // kg (empty 1.5L PET bottle)
  const MAX_WATER_VOL = 0.8;    // L (80% of 1L usable volume)
  const TANK_VOL = 0.001;       // m³ (1L = 0.001 m³)

  const SCENE_LEFT = -40;       // m left edge
  const SCENE_RIGHT = 200;      // m right edge
  const SCENE_TOP = 100;        // m top edge
  const PIXELS_PER_METER = 6;   // px/m scaling

  // ── State ──────────────────────────────────────
  const state = {
    // User params
    pressure: 3,        // bar
    waterRatio: 0.3,    // fraction of tank volume
    angle: 45,          // degrees

    // Simulation
    running: false,
    time: 0,

    // Dynamics
    x: 0, y: 0,
    vx: 0, vy: 0,
    phase: 'idle',      // idle | burn | coast | landed
    waterMass: 0,       // kg
    initWaterMass: 0,   // kg initial
    totalMass: 0,       // kg current

    // Tracking
    trail: [],
    maxHeight: 0,
    flightRange: 0,
    flightTime: 0,
    maxSpeed: 0,

    frameCount: 0
  };

  // ── Canvas sizing ──────────────────────────
  let W, H;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = canvas.width = Math.max(320, Math.floor(rect.width || window.innerWidth));
    H = canvas.height = Math.max(240, Math.floor(rect.height || window.innerHeight));
  }
  window.addEventListener('resize', resize);
  resize();

  // ── Coordinate conversion ──────────────────
  function worldToScreen(wx, wy) {
    const originX = W * 0.08;
    const originY = H * 0.92;
    return {
      sx: originX + wx * PIXELS_PER_METER,
      sy: originY - wy * PIXELS_PER_METER
    };
  }

  function groundScreenY() {
    return worldToScreen(0, 0).sy;
  }

  // ── Physics: Water Rocket ──────────────────
  function getExhaustVelocity(pressureBar) {
    // Bernoulli: v = sqrt(2 * (P_inside - P_atm) / rho)
    const P_pa = pressureBar * 1e5;
    const deltaP = Math.max(0, P_pa - P_ATM);
    return Math.sqrt(2 * deltaP / RHO_WATER);
  }

  function getMassFlow(pressureBar) {
    // ṁ = ρ · A · v_exhaust
    const v_ex = getExhaustVelocity(pressureBar);
    return RHO_WATER * NOZZLE_AREA * v_ex; // kg/s
  }

  function getThrust(pressureBar) {
    // Momentum thrust: F = ṁ · v_exhaust (pressure term negligible for water)
    const v_ex = getExhaustVelocity(pressureBar);
    const mdot = getMassFlow(pressureBar);
    return mdot * v_ex; // N
  }

  // ── Prediction via Tsiolkovsky + Projectile ──
  function predictFlight(pBar, wRatio, angleDeg) {
    const mWater0 = wRatio * MAX_WATER_VOL; // kg (water density ~1 kg/L)
    const m0 = DRY_MASS + mWater0;
    const mDry = DRY_MASS;

    // If no water, no thrust
    if (mWater0 < 0.01) {
      return { range: 0, height: 0, v0: 0, deltaV: 0 };
    }

    // Rocket equation: delta-v = v_exhaust * ln(m0 / m_dry)
    const vExhaust = getExhaustVelocity(pBar);
    const deltaV = vExhaust * Math.log(m0 / mDry);

    // This delta-V is along the launch angle
    const theta = angleDeg * Math.PI / 180;
    const vx0 = deltaV * Math.cos(theta);
    const vy0 = deltaV * Math.sin(theta);

    // Projectile motion from ground level
    // Range = (v0^2 * sin(2*theta)) / g
    const v0_sq = vx0 * vx0 + vy0 * vy0;
    const range = v0_sq * Math.sin(2 * theta) / G;
    const height = vy0 * vy0 / (2 * G);

    return {
      v0: Math.sqrt(v0_sq),
      deltaV: deltaV,
      range: Math.max(0, range),
      height: Math.max(0, height)
    };
  }

  // ── Burn time estimate ────────────────────
  function estimateBurnTime(pBar, wRatio) {
    const mWater = wRatio * MAX_WATER_VOL;
    if (mWater < 0.01) return 0;
    const mdot = getMassFlow(pBar);
    return mWater / mdot; // seconds
  }

  // ── Reset ──────────────────────────────────
  function resetSim() {
    const wRatio = state.waterRatio;
    state.time = 0;
    state.phase = 'idle';
    state.x = 0;
    state.y = 0.05;
    state.vx = 0;
    state.vy = 0;
    state.waterMass = wRatio * MAX_WATER_VOL;
    state.initWaterMass = wRatio * MAX_WATER_VOL;
    state.totalMass = DRY_MASS + state.waterMass;
    state.trail = [];
    state.maxHeight = 0;
    state.flightRange = 0;
    state.flightTime = 0;
    state.maxSpeed = 0;
    state.running = false;
  }

  // ── Physics step ──────────────────────────
  function step(dt) {
    if (state.phase === 'idle' || state.phase === 'landed') return;

    let subSteps = 4;
    let subDt = dt / subSteps;
    for (let s = 0; s < subSteps; s++) {
      subStep(subDt);
    }
  }

  function subStep(dt) {
    const pBar = state.pressure;
    const wMass = state.waterMass;

    // --- Burn phase ---
    if (state.phase === 'burn' && wMass > 0.001) {
      const thrustN = getThrust(pBar);
      const mdot = getMassFlow(pBar);
      const currentMass = state.totalMass;

      // Thrust acceleration along launch angle
      const theta = state.angle * Math.PI / 180;
      const aThrust = thrustN / currentMass; // m/s²

      state.vx += aThrust * Math.cos(theta) * dt;
      state.vy += aThrust * Math.sin(theta) * dt;

      // Deplete water
      const dm = Math.min(mdot * dt, state.waterMass);
      state.waterMass -= dm;
      state.totalMass -= dm;

      if (state.waterMass <= 0.001) {
        state.waterMass = 0;
        state.totalMass = DRY_MASS;
        state.phase = 'coast';
      }
    }

    // --- Gravity ---
    state.vy -= G * dt;

    // --- Move ---
    state.x += state.vx * dt;
    state.y += state.vy * dt;

    // Track max height after leaving the pad
    if (state.phase !== 'idle') {
      if (state.y > state.maxHeight) {
        state.maxHeight = state.y;
      }
    }

    // Track trail (every 0.5 m traveled)
    if (state.phase === 'burn' || state.phase === 'coast') {
      const spd = Math.hypot(state.vx, state.vy);
      if (spd > state.maxSpeed) state.maxSpeed = spd;

      const last = state.trail[state.trail.length - 1];
      if (!last || Math.hypot(state.x - last.x, state.y - last.y) > 0.5) {
        state.trail.push({ x: state.x, y: state.y });
        if (state.trail.length > 1000) state.trail.shift();
      }
    }

    // --- Landed ---
    if (state.y <= 0 && (state.phase === 'burn' || state.phase === 'coast')) {
      state.y = 0;
      state.phase = 'landed';
      state.flightRange = state.x;
      state.flightTime = state.time;
      state.running = false;
    }
  }

  // ── Drawing ───────────────────────────────
  function drawBackground() {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0b0e2a');
    grad.addColorStop(0.4, '#1a2a5a');
    grad.addColorStop(0.7, '#2a4a7a');
    grad.addColorStop(1, '#3a6a8a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawStars() {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 80; i++) {
      const sx = (i * 137.5 + i * i * 3) % W;
      const sy = (i * 89.3 + i * 7) % (H * 0.6);
      ctx.globalAlpha = 0.15 + (i % 5) * 0.07;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.5 + (i % 3) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawGround() {
    const gy = groundScreenY();
    // Ground fill
    const grad = ctx.createLinearGradient(0, gy, 0, H);
    grad.addColorStop(0, '#2d5a27');
    grad.addColorStop(0.3, '#1e4a1a');
    grad.addColorStop(1, '#0f2a0e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, gy, W, H - gy);

    // Ground line
    ctx.strokeStyle = '#4a8a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    ctx.lineWidth = 1;
    // Vertical grid lines every 10 m
    for (let x = 0; x <= SCENE_RIGHT; x += 10) {
      const p = worldToScreen(x, 0);
      if (p.sx < 0 || p.sx > W) continue;
      ctx.beginPath();
      ctx.moveTo(p.sx, 0);
      ctx.lineTo(p.sx, groundScreenY());
      ctx.stroke();
    }
    // Horizontal grid lines every 10 m
    for (let y = 0; y <= SCENE_TOP; y += 10) {
      const p = worldToScreen(0, y);
      if (p.sy < 0 || p.sy > H) continue;
      ctx.beginPath();
      ctx.moveTo(W * 0.08, p.sy);
      ctx.lineTo(W, p.sy);
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    for (let x = 10; x <= SCENE_RIGHT; x += 20) {
      const p = worldToScreen(x, 0);
      if (p.sx < 0 || p.sx > W) continue;
      ctx.fillText(x + 'm', p.sx - 8, groundScreenY() + 14);
    }
  }

  function drawLaunchPad() {
    const pad = worldToScreen(0, 0);
    // Base
    ctx.fillStyle = '#555';
    ctx.fillRect(pad.sx - 18, pad.sy - 5, 36, 10);

    // Angle indicator
    const angleRad = state.angle * Math.PI / 180;
    ctx.strokeStyle = 'rgba(255,200,50,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pad.sx, pad.sy);
    ctx.lineTo(pad.sx + 80 * Math.cos(angleRad), pad.sy - 80 * Math.sin(angleRad));
    ctx.stroke();
    ctx.setLineDash([]);

    // Angle arc
    ctx.strokeStyle = 'rgba(255,200,50,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pad.sx, pad.sy, 30, 0, -angleRad, true);
    ctx.stroke();

    // Angle label
    ctx.fillStyle = 'rgba(255,200,50,0.35)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    const labelPos = worldToScreen(7 * Math.cos(angleRad / 2), 7 * Math.sin(angleRad / 2));
    ctx.fillText(state.angle + '°', labelPos.sx, labelPos.sy + 4);
  }

  function drawRocket(sx, sy, angleDeg, waterFrac) {
    ctx.save();
    ctx.translate(sx, sy);
    const rad = -angleDeg * Math.PI / 180;
    ctx.rotate(rad);

    const L = 16;  // body half-length in px
    const W = 5;

    // Body
    ctx.fillStyle = '#ddd';
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.fillRect(-W / 2, -L, W, L);
    ctx.strokeRect(-W / 2, -L, W, L);

    // Nose cone
    ctx.fillStyle = '#e33';
    ctx.beginPath();
    ctx.moveTo(0, -L - 6);
    ctx.lineTo(-W / 2 - 0.5, -L);
    ctx.lineTo(W / 2 + 0.5, -L);
    ctx.closePath();
    ctx.fill();

    // Fins (left)
    ctx.fillStyle = '#c33';
    ctx.beginPath();
    ctx.moveTo(-W / 2, 0);
    ctx.lineTo(-W / 2 - 4, 4);
    ctx.lineTo(-W / 2, 1.5);
    ctx.closePath();
    ctx.fill();
    // Fins (right)
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2 + 4, 4);
    ctx.lineTo(W / 2, 1.5);
    ctx.closePath();
    ctx.fill();

    // Water level inside
    if (waterFrac > 0.01) {
      const waterH = L * waterFrac;
      ctx.fillStyle = 'rgba(60, 120, 255, 0.5)';
      ctx.fillRect(-W / 2 + 1, -waterH, W - 2, waterH);
      ctx.strokeStyle = 'rgba(60, 120, 255, 0.7)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(-W / 2 + 1, -waterH);
      ctx.lineTo(W / 2 - 1, -waterH);
      ctx.stroke();
    }

    // Exhaust flame during burn
    if (state.phase === 'burn') {
      const flameLen = 8 + Math.random() * 10;
      // Outer glow
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 15;

      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.moveTo(-3, 1.5);
      ctx.lineTo(0, flameLen);
      ctx.lineTo(3, 1.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ff4400';
      ctx.beginPath();
      ctx.moveTo(-2, 1.5);
      ctx.lineTo(0, flameLen * 0.7);
      ctx.lineTo(2, 1.5);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  function drawTrail() {
    if (state.trail.length < 2) return;

    for (let i = 1; i < state.trail.length; i++) {
      const p1 = worldToScreen(state.trail[i - 1].x, state.trail[i - 1].y);
      const p2 = worldToScreen(state.trail[i].x, state.trail[i].y);
      const alpha = 0.15 + 0.4 * (i / state.trail.length);
      ctx.strokeStyle = `rgba(255, 180, 60, ${alpha})`;
      ctx.lineWidth = 1.5 + 0.5 * (i / state.trail.length);
      ctx.beginPath();
      ctx.moveTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.stroke();
    }
  }

  function drawHUD() {
    const pred = predictFlight(state.pressure, state.waterRatio, state.angle);
    const burnTime = estimateBurnTime(state.pressure, state.waterRatio);
    const rightPanelW = Math.min(170, Math.max(130, W * 0.18));

    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(10, 10, 210, 84);

    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.fillText('Prediction', 20, 30);
    ctx.fillStyle = '#aaf';
    ctx.fillText(`Δv: ${pred.deltaV.toFixed(1)} m/s`, 20, 49);
    ctx.fillText(`H: ${pred.height.toFixed(1)} m`, 20, 66);
    ctx.fillText(`R: ${pred.range.toFixed(1)} m  Burn: ${burnTime.toFixed(2)} s`, 20, 83);

    // Right panel: params
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(W - rightPanelW - 10, 10, rightPanelW, 70);

    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`▸ ${state.phase.toUpperCase()}`, W - rightPanelW, 30);

    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.fillText(`${state.pressure.toFixed(1)} bar | ${(state.waterRatio * 100).toFixed(0)}% | ${state.angle}°`, W - rightPanelW, 48);

    // Stability warning
    if (state.waterRatio < 0.15) {
      ctx.fillStyle = '#ff8844';
      ctx.font = '10px monospace';
      ctx.fillText('⚠ low water', W - rightPanelW, 66);
    }

    // Landing overlay
    if (state.phase === 'landed') {
      const overlayW = Math.min(340, W - 32);
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(W / 2 - overlayW / 2, H / 2 - 65, overlayW, 130);

      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✧ LANDED ✧', W / 2, H / 2 - 28);

      ctx.fillStyle = '#fff';
      ctx.font = '13px monospace';
      ctx.fillText('See live results in the Data panel', W / 2, H / 2 + 10);

      ctx.fillStyle = '#aaa';
      ctx.font = '11px monospace';
      ctx.fillText(`Prediction  H:${pred.height.toFixed(1)}m  R:${pred.range.toFixed(1)}m`, W / 2, H / 2 + 36);
      ctx.textAlign = 'left';
    }
  }

  // ── Main render ──────────────────────────
  function render() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawStars();
    drawGrid();
    drawGround();
    drawLaunchPad();
    drawTrail();

    // Rocket position
    let drawAngle = state.angle;
    if (state.phase === 'coast' || state.phase === 'landed') {
      const speed = Math.hypot(state.vx, state.vy);
      if (speed > 0.5) {
        drawAngle = Math.atan2(state.vy, state.vx) * 180 / Math.PI;
      }
    }

    const pos = worldToScreen(state.x, state.y);
    const waterFrac = state.initWaterMass > 0 ? (state.waterMass / state.initWaterMass) : 0;
    drawRocket(pos.sx, pos.sy, drawAngle, waterFrac);

    drawHUD();
  }

  // ── Parameters ───────────────────────────
  function setParam(name, value) {
    switch (name) {
      case 'pressure': state.pressure = Math.max(1, Math.min(6, value)); break;
      case 'waterRatio': state.waterRatio = Math.max(0.1, Math.min(0.8, value)); break;
      case 'angle': state.angle = Math.max(10, Math.min(80, value)); break;
    }
  }

  // ── postMessage bridge ───────────────────
  window.addEventListener('message', (event) => {
    // Sandbox makes our origin "null"; bind to the parent window instead.
    if (window.parent && event.source !== window.parent) return;
    const msg = event.data;

    switch (msg.type) {
      case 'control:play':
        state.running = msg.playing;
        if (msg.playing) {
          if (state.phase === 'landed') resetSim();
          if (state.phase === 'idle') {
            state.phase = 'burn';
            state.time = 0;
          }
        }
        break;

      case 'control:reset':
        resetSim();
        break;

      case 'param:set':
        setParam(msg.name, msg.value);
        break;
    }
  });

  // ── Measurements ─────────────────────────
  function emitMeasurements() {
    const speed = Math.hypot(state.vx, state.vy);
    const pred = predictFlight(state.pressure, state.waterRatio, state.angle);
    window.parent.postMessage({
      type: 'experiment:measurement',
      payload: {
        time: state.time,
        height: state.maxHeight,
        range: state.flightRange,
        velocity: speed,
        phase: state.phase,
        predictedHeight: pred.height,
        predictedRange: pred.range,
        waterMass: Math.max(0, state.waterMass),
        maxSpeed: state.maxSpeed
      }
    }, '*');
  }

  // ── Main loop ────────────────────────────
  let lastT = 0;
  function loop(timestamp) {
    if (!lastT) lastT = timestamp;
    let dt = (timestamp - lastT) / 1000;
    if (dt > 0.04) dt = 0.04;  // cap at ~25 fps
    lastT = timestamp;

    if (state.running && state.phase !== 'landed') {
      step(dt);
      if (state.phase !== 'idle') state.time += dt;
    }

    render();

    state.frameCount++;
    if (state.frameCount >= 6) {
      emitMeasurements();
      state.frameCount = 0;
    }

    requestAnimationFrame(loop);
  }

  // ── Start ────────────────────────────────
  resetSim();
  requestAnimationFrame(loop);

})();
