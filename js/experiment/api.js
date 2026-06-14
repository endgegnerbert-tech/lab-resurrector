/**
 * experiment/api.js — Measurement API
 *
 * Stellt window.ExperimentAPI für Spaces und Console bereit.
 * Ermöglicht emitMeasurement(data) → aktualisiert Datenpanel.
 *
 * Usage:
 *   window.ExperimentAPI.emitMeasurement({ t: 4.2, velocity: 3.1, energy: 4.8 });
 *
 * Events:
 *   'experiment:measurement' — wird auf document gefeuert mit detail.data
 */

(function () {
  'use strict';

  // ── Bekannte Labels & Einheiten ──────────────
  const KNOWN = {
    t:              { label: 'Zeit',              unit: 's' },
    period:         { label: 'Periodendauer',      unit: 's' },
    velocity:       { label: 'Geschwindigkeit',    unit: 'm/s' },
    speed:          { label: 'Geschwindigkeit',    unit: 'm/s' },
    v:              { label: 'Geschwindigkeit',    unit: 'm/s' },
    energy:         { label: 'Energie',            unit: 'J' },
    x:              { label: 'Position x',         unit: 'm' },
    y:              { label: 'Position y',         unit: 'm' },
    position:       { label: 'Position',           unit: 'm' },
    angle:          { label: 'Winkel',             unit: '°' },
    acceleration:   { label: 'Beschleunigung',     unit: 'm/s²' },
    a:              { label: 'Beschleunigung',     unit: 'm/s²' },
    frequency:      { label: 'Frequenz',           unit: 'Hz' },
    f:              { label: 'Frequenz',           unit: 'Hz' },
    wavelength:     { label: 'Wellenlänge',        unit: 'm' },
    lambda:         { label: 'Wellenlänge',        unit: 'm' },
    amplitude:      { label: 'Amplitude',          unit: 'm' },
    momentum:       { label: 'Impuls',             unit: 'kg·m/s' },
    p:              { label: 'Impuls',             unit: 'kg·m/s' },
    range:          { label: 'Reichweite',         unit: 'm' },
    mass:           { label: 'Masse',              unit: 'kg' },
    length:         { label: 'Länge',              unit: 'm' },
    L:              { label: 'Länge',              unit: 'm' },
    gravity:        { label: 'Gravitation',        unit: 'm/s²' },
    g:              { label: 'Gravitation',        unit: 'm/s²' },
    voltage:        { label: 'Spannung',           unit: 'V' },
    U:              { label: 'Spannung',           unit: 'V' },
    current:        { label: 'Stromstärke',        unit: 'A' },
    I:              { label: 'Stromstärke',        unit: 'A' },
    resistance:     { label: 'Widerstand',         unit: 'Ω' },
    R:              { label: 'Widerstand',         unit: 'Ω' },
    charge:         { label: 'Ladung',             unit: 'C' },
    Q:              { label: 'Ladung',             unit: 'C' },
    power:          { label: 'Leistung',           unit: 'W' },
    P:              { label: 'Leistung',           unit: 'W' },
    angle_in:       { label: 'Einfallswinkel',     unit: '°' },
    angle_out:      { label: 'Ausfallswinkel',     unit: '°' },
    focal_length:   { label: 'Brennweite',         unit: 'm' },
    intensity:      { label: 'Intensität',         unit: 'W/m²' },
  };

  const HISTORY_MAX = 200;

  // ── Privater Zustand ─────────────────────────
  let history = [];
  let latest = {};
  let liveValuesEl = null;
  let initialized = false;

  // ── Formatierung ─────────────────────────────
  function formatValue(val) {
    if (typeof val === 'number') {
      if (Math.abs(val) < 0.01) return val.toExponential(3);
      if (Math.abs(val) < 1) return val.toFixed(4);
      if (Number.isInteger(val)) return val.toString();
      return val.toFixed(2);
    }
    return String(val);
  }

  // ── Data-Panel aktualisieren ────────────────
  function updatePanel() {
    if (!liveValuesEl) return;

    const keys = Object.keys(latest);
    if (keys.length === 0) return;

    // Placeholder ausblenden
    const placeholder = liveValuesEl.closest('.panel-body')
      ?.querySelector('.panel-placeholder');
    if (placeholder) placeholder.style.display = 'none';

    // Bestehende Zeilen einsammeln
    const existing = new Map();
    liveValuesEl.querySelectorAll('.value-row').forEach(row => {
      const label = row.querySelector('.value-label')?.textContent?.replace(':', '')?.trim();
      if (label) existing.set(label, row);
    });

    // Zeilen für aktuelle Keys aktualisieren/erzeugen
    const usedKeys = new Set();

    keys.forEach(key => {
      const meta = KNOWN[key];
      const label = meta ? meta.label : key;
      const unit = meta ? meta.unit : '';
      usedKeys.add(label);

      const val = latest[key];
      const formatted = formatValue(val);
      const displayText = unit ? `${formatted} ${unit}` : formatted;

      if (existing.has(label)) {
        // Update bestehende Zeile
        const row = existing.get(label);
        row.querySelector('.value-number').textContent = displayText;
      } else {
        // Neue Zeile einfügen
        const row = document.createElement('div');
        row.className = 'value-row';
        row.innerHTML = `<span class="value-label">${label}:</span><span class="value-number">${displayText}</span>`;
        liveValuesEl.appendChild(row);
      }
    });

    // Entfernte Keys ausblenden (optional: wir lassen sie stehen)
    // nicht entfernen — Benutzer sehen alte Werte weiter
  }

  // ── Öffentliche API ──────────────────────────
  const ExperimentAPI = {

    /**
     * Ein Measurement auslösen.
     * @param {Object} data  Key-Value-Paare, z.B. { t: 1.25, velocity: 3.1 }
     */
    emitMeasurement(data) {
      if (!data || typeof data !== 'object') {
        console.warn('[ExperimentAPI] emitMeasurement: data must be an object');
        return;
      }

      // Latest aktualisieren
      Object.assign(latest, data);
      history.push({ ...data, _ts: Date.now() });
      if (history.length > HISTORY_MAX) history.shift();

      // Panel aktualisieren
      updatePanel();

      // DOM-Event
      document.dispatchEvent(new CustomEvent('experiment:measurement', {
        detail: { data: { ...data }, latest: { ...latest } }
      }));

      console.log('[ExperimentAPI] Measurement:', data);
    },

    /**
     * Alle gespeicherten Messungen abrufen.
     */
    getHistory() {
      return [...history];
    },

    /**
     * Aktuelle Werte abrufen.
     */
    getLatest() {
      return { ...latest };
    },

    /**
     * History und Panel zurücksetzen.
     */
    clear() {
      history = [];
      latest = {};
      if (liveValuesEl) {
        liveValuesEl.innerHTML = '';
      }
      const placeholder = liveValuesEl?.closest('.panel-body')
        ?.querySelector('.panel-placeholder');
      if (placeholder) placeholder.style.display = '';
    },

    /**
     * Bekannte Metadaten für einen Key abrufen.
     */
    getMeta(key) {
      return KNOWN[key] || null;
    },
  };

  // ── Init bei DOMContentLoaded ────────────────
  function init() {
    if (initialized) return;
    initialized = true;

    liveValuesEl = document.getElementById('live-values');

    if (!liveValuesEl) {
      console.warn('[ExperimentAPI] #live-values not found — deferred init möglich');
      // Retry kurz später
      setTimeout(() => {
        liveValuesEl = document.getElementById('live-values');
        if (!liveValuesEl) {
          console.warn('[ExperimentAPI] #live-values nicht gefunden, Panel offline');
        }
      }, 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Global registrieren ──────────────────────
  window.ExperimentAPI = ExperimentAPI;

  console.log('[ExperimentAPI] ✅ Measurement API bereit');
})();
