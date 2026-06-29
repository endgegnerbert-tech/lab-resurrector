/**
 * sketch.js — Wave Interference (2D Two-Source Ripple Tank)
 *
 * Two coherent point sources produce circular waves.
 * Superposition is computed on a 2D grid, showing
 * interference fringes in real time.
 *
 * Controls via postMessage bridge (parent app control bar).
 * Measurements emitted via postMessage to parent data panel.
 *
 * Physics:
 *   y(r, t) = (A / sqrt(1 + r)) · sin(k·r - ω·t + φ)
 *   y_total(P) = y(r1, t) + y(r2, t)
 *   intensity ∝ y_total²
 *
 * where:
 *   k = 2π/λ   (wave number)
 *   ω = 2π·c/λ (angular frequency, c = wave speed constant)
 *   r1, r2 = distances from point P to source 1 and 2
 */

(function () {
  'use strict';

  const canvas = document.getElementById('waveCanvas');
  const ctx = canvas.getContext('2d');

  // ── State ────────────────────────────────────
  const state = {
    running: true,
    time: 0,
    params: {
      wavelength: 80,
      sourceDistance: 120,
      phaseShift: 0,
      amplitude: 1.0
    },
    frameCount: 0,
    animTime: 0
  };

  // ── Canvas sizing ────────────────────────────
  let W, H;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = canvas.width = Math.max(320, Math.floor(rect.width || window.innerWidth));
    H = canvas.height = Math.max(240, Math.floor(rect.height || window.innerHeight));
  }

  let resizePending = true;
  window.addEventListener('resize', () => { resizePending = true; });

  // ── Geometry ─────────────────────────────────
  let sourceY, source1X, source2X, viewLeft, viewRight;
  function computeLayout() {
    sourceY = Math.floor(H * 0.35);
    const cx = Math.floor(W / 2);
    const d2 = state.params.sourceDistance / 2;
    source1X = Math.floor(cx - d2);
    source2X = Math.floor(cx + d2);
    const margin = Math.floor(W * 0.04);
    viewLeft = margin;
    viewRight = W - margin;
  }

  function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  // ── Wave physics ─────────────────────────────
  const WAVE_SPEED = 2.5; // px/frame (constant, keeps c = λ·f consistent)

  function getOmega(wavelength) {
    // ω = 2π · f = 2π · (c / λ)
    return 2 * Math.PI * WAVE_SPEED / wavelength;
  }

  function getK(wavelength) {
    return 2 * Math.PI / wavelength;
  }

  function waveValue(x, y, t, qx, qy, phaseOff, amp, wl) {
    const r = dist(x, y, qx, qy);
    if (r < 1) return 0; // avoid singularity at source
    const kVal = getK(wl);
    const omegaVal = getOmega(wl);
    // Amplitude decays as 1/sqrt(r) for 2D circular waves (energy conservation)
    const decayAmp = amp / Math.sqrt(r / 20 + 1);
    const phiRad = phaseOff * Math.PI / 180;
    return decayAmp * Math.sin(kVal * r - omegaVal * t + phiRad);
  }

  function totalWave(x, y, t) {
    const p = state.params;
    const qy = sourceY;
    const phase1 = 0;
    const phase2 = p.phaseShift;
    const v1 = waveValue(x, y, t, source1X, qy, phase1, p.amplitude, p.wavelength);
    const v2 = waveValue(x, y, t, source2X, qy, phase2, p.amplitude, p.wavelength);
    return v1 + v2;
  }

  // ── Measurements ────────────────────────────
  function collectMeasurements() {
    computeLayout();
    let maxVal = 0;
    let knoten = 0;
    let prev = totalWave(viewLeft, sourceY, state.animTime);
    const step = 3;

    for (let x = viewLeft; x <= viewRight; x += step) {
      const val = Math.abs(totalWave(x, sourceY, state.animTime));
      if (val > maxVal) maxVal = val;

      const curr = totalWave(x, sourceY, state.animTime);
      if ((prev < 0 && curr >= 0) || (prev > 0 && curr <= 0)) {
        knoten++;
      }
      prev = curr;
    }

    return {
      maxAuslenkung: Math.round(maxVal * 100) / 100,
      intensitaet: Math.round(maxVal * maxVal * 100) / 100,
      knotenAnzahl: knoten
    };
  }

  // ── postMessage Bridge ──────────────────────
  window.addEventListener('message', (event) => {
    // Sandbox makes our origin "null"; bind to the parent window instead.
    if (window.parent && event.source !== window.parent) return;
    const d = event.data;
    switch (d.type) {
      case 'control:play':
        state.running = d.playing;
        break;
      case 'control:reset':
        state.animTime = 0;
        state.frameCount = 0;
        break;
      case 'param:set':
        if (d.name in state.params) {
          state.params[d.name] = d.value;
          resizePending = true;
        }
        break;
    }
  });

  // ── Rendering ───────────────────────────────
  function getColor(val, maxAmp) {
    // Normalize to [-1, 1]
    const norm = Math.max(-1, Math.min(1, val / (maxAmp + 0.01)));
    const intensity = Math.abs(norm);

    if (norm > 0) {
      // Constructive (blue/cyan)
      const r = Math.floor(20 + 30 * intensity);
      const g = Math.floor(100 + 120 * intensity);
      const b = Math.floor(180 + 75 * intensity);
      return { r, g, b, a: 100 + 80 * intensity };
    } else {
      // Destructive (orange/red)
      const r = Math.floor(200 + 55 * intensity);
      const g = Math.floor(100 - 30 * intensity);
      const b = Math.floor(30 + 40 * (1 - intensity));
      return { r, g, b, a: 100 + 80 * intensity };
    }
  }

  let pixelData = null;
  let prevW = 0, prevH = 0;

  function render() {
    if (resizePending) {
      resize();
      computeLayout();
      // Recreate ImageData on size change
      pixelData = null;
      resizePending = false;
    }

    const p = state.params;
    const t = state.animTime;
    computeLayout();

    const renderW = Math.min(W, viewRight - viewLeft);
    const renderH = Math.min(H, sourceY + 250 + 50);

    // ImageData for the 2D wave field
    if (!pixelData || prevW !== renderW || prevH !== renderH) {
      pixelData = ctx.createImageData(renderW, renderH);
      prevW = renderW;
      prevH = renderH;
    }

    const data = pixelData.data;
    const maxAmp = p.amplitude * 3; // theoretical max for constructive interference (2A + boost near sources)

    // Sample every 2 pixels for performance
    const sampling = 2;

    for (let py = 0; py < renderH; py += sampling) {
      for (let px = 0; px < renderW; px += sampling) {
        const wx = viewLeft + px;
        const wy = py;

        const val = totalWave(wx, wy, t);
        const c = getColor(val, maxAmp);

        // Fill sampling block
        for (let dy = 0; dy < sampling && py + dy < renderH; dy++) {
          for (let dx = 0; dx < sampling && px + dx < renderW; dx++) {
            const idx = ((py + dy) * renderW + (px + dx)) * 4;
            data[idx] = c.r;
            data[idx + 1] = c.g;
            data[idx + 2] = c.b;
            data[idx + 3] = c.a;
          }
        }
      }
    }

    // Dark background outside rendered area
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, W, H);

    // Draw the 2D field
    ctx.putImageData(pixelData, viewLeft, 0);

    // ── Source markers ───────────────────
    ctx.shadowColor = '#4cf';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#4cf';
    ctx.beginPath();
    ctx.arc(source1X, sourceY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = '#f86';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#f86';
    ctx.beginPath();
    ctx.arc(source2X, sourceY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Source labels
    ctx.fillStyle = 'rgba(136, 136, 170, 0.6)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('S₁', source1X, sourceY + 22);
    ctx.fillText('S₂', source2X, sourceY + 22);

    // ── Cross-section line ───────────────
    const csY = sourceY + 140;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(viewLeft, csY);
    ctx.lineTo(viewRight, csY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '9px monospace';
    ctx.fillText('cross-section', viewLeft + 10, csY - 4);

    // Cross-section wave profile
    const csPoints = [];
    for (let x = viewLeft; x <= viewRight; x += 1) {
      const v = totalWave(x, csY, t);
      const yPos = csY - v * 20;
      csPoints.push({ x, y: yPos, val: v });
    }

    // Positive fill
    ctx.beginPath();
    ctx.moveTo(viewLeft, csY);
    for (const pt of csPoints) ctx.lineTo(pt.x, pt.y < csY ? pt.y : csY);
    ctx.lineTo(viewRight, csY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(80, 200, 255, 0.06)';
    ctx.fill();

    // Negative fill
    ctx.beginPath();
    ctx.moveTo(viewLeft, csY);
    for (const pt of csPoints) ctx.lineTo(pt.x, pt.y > csY ? pt.y : csY);
    ctx.lineTo(viewRight, csY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 160, 100, 0.06)';
    ctx.fill();

    // Wave line
    ctx.beginPath();
    for (let i = 0; i < csPoints.length; i++) {
      if (i === 0) ctx.moveTo(csPoints[i].x, csPoints[i].y);
      else ctx.lineTo(csPoints[i].x, csPoints[i].y);
    }
    ctx.strokeStyle = 'rgba(80, 220, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Info overlay ────────────────────
    const infoW = Math.min(320, Math.max(220, W * 0.34));
    const legendW = Math.min(130, Math.max(110, W * 0.16));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(10, 10, infoW, 25);

    ctx.fillStyle = 'rgba(180, 200, 220, 0.7)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      `λ=${p.wavelength}  d=${p.sourceDistance}  Δφ=${p.phaseShift}°  A=${p.amplitude.toFixed(1)}  t=${t.toFixed(1)}`,
      16, 28
    );

    // Legend
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(W - legendW - 10, 10, legendW, 60);

    ctx.fillStyle = '#4cf';
    ctx.beginPath();
    ctx.arc(W - legendW + 5, 24, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(180, 200, 220, 0.6)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Constructive', W - legendW + 14, 28);

    ctx.fillStyle = '#f86';
    ctx.beginPath();
    ctx.arc(W - legendW + 5, 44, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(180, 200, 220, 0.6)';
    ctx.fillText('Destructive', W - legendW + 14, 48);

    ctx.fillStyle = 'rgba(136, 136, 170, 0.25)';
    ctx.fillText('cross-section', W - legendW + 5, 64);
  }

  // ── Loop ─────────────────────────────────────
  function loop(/*timestamp*/) {
    if (state.running) {
      state.animTime += 0.06;
    }

    render();

    // Send measurements ~6x/sec
    state.frameCount++;
    if (state.frameCount % 10 === 0) {
      const m = collectMeasurements();
      window.parent.postMessage({ type: 'experiment:measurement', payload: m }, '*');
    }

    requestAnimationFrame(loop);
  }

  // ── Start ────────────────────────────────────
  resize();
  computeLayout();
  loop();

})();
