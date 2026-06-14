/**
 * experiment/api.js — Measurement API (flabs)
 */

(function () {
  'use strict';

  const KNOWN = {
    t:              { label: 'Time',              unit: 's' },
    period:         { label: 'Period',            unit: 's' },
    T:              { label: 'Period',            unit: 's' },
    velocity:       { label: 'Velocity',          unit: 'm/s' },
    speed:          { label: 'Speed',             unit: 'm/s' },
    v:              { label: 'Velocity',          unit: 'm/s' },
    energy:         { label: 'Energy',            unit: 'J' },
    E:              { label: 'Energy',            unit: 'J' },
    x:              { label: 'Position x',        unit: 'm' },
    y:              { label: 'Position y',        unit: 'm' },
    position:       { label: 'Position',          unit: 'm' },
    angle:          { label: 'Angle',             unit: '°' },
    acceleration:   { label: 'Acceleration',      unit: 'm/s²' },
    a:              { label: 'Acceleration',      unit: 'm/s²' },
    frequency:      { label: 'Frequency',         unit: 'Hz' },
    f:              { label: 'Frequency',         unit: 'Hz' },
    wavelength:     { label: 'Wavelength',        unit: 'm' },
    lambda:         { label: 'Wavelength',        unit: 'm' },
    amplitude:      { label: 'Amplitude',         unit: 'm' },
    momentum:       { label: 'Momentum',          unit: 'kg·m/s' },
    p:              { label: 'Momentum',          unit: 'kg·m/s' },
    range:          { label: 'Range',             unit: 'm' },
    mass:           { label: 'Mass',              unit: 'kg' },
    m:              { label: 'Mass',              unit: 'kg' },
    length:         { label: 'Length',            unit: 'm' },
    L:              { label: 'Length',            unit: 'm' },
    gravity:        { label: 'Gravity',           unit: 'm/s²' },
    g:              { label: 'Gravity',           unit: 'm/s²' },
    voltage:        { label: 'Voltage',           unit: 'V' },
    U:              { label: 'Voltage',           unit: 'V' },
    current:        { label: 'Current',           unit: 'A' },
    I:              { label: 'Current',           unit: 'A' },
    resistance:     { label: 'Resistance',        unit: 'Ω' },
    R:              { label: 'Resistance',        unit: 'Ω' },
    charge:         { label: 'Charge',            unit: 'C' },
    Q:              { label: 'Charge',            unit: 'C' },
    power:          { label: 'Power',             unit: 'W' },
    P:              { label: 'Power',             unit: 'W' },
    angle_in:       { label: 'Incidence angle',   unit: '°' },
    angle_out:      { label: 'Refraction angle',  unit: '°' },
    focal_length:   { label: 'Focal length',      unit: 'm' },
    intensity:      { label: 'Intensity',         unit: 'W/m²' },
    height:         { label: 'Height',            unit: 'm' },
    maxHeight:      { label: 'Max height',        unit: 'm' },
    time:           { label: 'Time',              unit: 's' },
    pressure:       { label: 'Pressure',          unit: 'bar' },
    thrust:         { label: 'Thrust',            unit: 'N' },
    drag:           { label: 'Drag',              unit: 'N' },
  };

  const HISTORY_MAX = 200;

  let history = [];
  let latest = {};
  let liveValuesEl = null;
  let initialized = false;
  let configuredMeasurements = [];
  let rowMap = new Map();

  function formatValue(val) {
    if (val === undefined || val === null || val === '') return '—';
    if (typeof val === 'number') {
      if (Math.abs(val) < 0.01 && val !== 0) return val.toExponential(3);
      if (Math.abs(val) < 1) return val.toFixed(4);
      if (Number.isInteger(val)) return val.toString();
      return val.toFixed(2);
    }
    return String(val);
  }

  function getMeta(key) {
    const configured = configuredMeasurements.find(m => m.id === key);
    if (configured) return { label: configured.label || key, unit: configured.unit || '' };
    return KNOWN[key] || null;
  }

  function renderConfiguredRows() {
    if (!liveValuesEl) return;
    liveValuesEl.innerHTML = '';
    rowMap = new Map();

    configuredMeasurements.forEach(meta => {
      const row = document.createElement('div');
      row.className = 'value-row';
      row.dataset.key = meta.id;
      row.innerHTML = '<span class="value-label"></span><span class="value-number">—</span>';
      row.querySelector('.value-label').textContent = (meta.label || meta.id) + ':';
      liveValuesEl.appendChild(row);
      rowMap.set(meta.id, row);
    });
  }

  function updateConfiguredPanel() {
    if (!liveValuesEl) return;
    configuredMeasurements.forEach(meta => {
      const row = rowMap.get(meta.id);
      if (!row) return;
      const numberEl = row.querySelector('.value-number');
      const val = latest[meta.id];
      const formatted = formatValue(val);
      numberEl.textContent = meta.unit && formatted !== '—' ? formatted + ' ' + meta.unit : formatted;
    });
  }

  function updateFallbackPanel() {
    if (!liveValuesEl) return;
    const keys = Object.keys(latest);
    if (keys.length === 0) return;

    const existing = new Map();
    liveValuesEl.querySelectorAll('.value-row').forEach(row => {
      const key = row.dataset.key;
      if (key) existing.set(key, row);
    });

    keys.forEach(key => {
      const meta = getMeta(key);
      const label = meta ? meta.label : key;
      const unit = meta ? meta.unit : '';
      const formatted = formatValue(latest[key]);
      const display = unit && formatted !== '—' ? formatted + ' ' + unit : formatted;

      if (existing.has(key)) {
        existing.get(key).querySelector('.value-number').textContent = display;
      } else {
        const row = document.createElement('div');
        row.className = 'value-row';
        row.dataset.key = key;

        const labelEl = document.createElement('span');
        labelEl.className = 'value-label';
        labelEl.textContent = label + ':';

        const numberEl = document.createElement('span');
        numberEl.className = 'value-number';
        numberEl.textContent = display;

        row.appendChild(labelEl);
        row.appendChild(numberEl);
        liveValuesEl.appendChild(row);
      }
    });
  }

  function updatePanel() {
    if (!liveValuesEl) return;
    if (configuredMeasurements.length > 0) updateConfiguredPanel();
    else updateFallbackPanel();
  }

  const ExperimentAPI = {
    configure(manifest) {
      configuredMeasurements = Array.isArray(manifest && manifest.measurements)
        ? manifest.measurements.map(m => ({ id: m.id, label: m.label, unit: m.unit || '' }))
        : [];
      renderConfiguredRows();
      updatePanel();
    },

    emitMeasurement(data) {
      if (!data || typeof data !== 'object') return;
      Object.assign(latest, data);
      history.push({ ...data, _ts: Date.now() });
      if (history.length > HISTORY_MAX) history.shift();
      updatePanel();
      document.dispatchEvent(new CustomEvent('experiment:measurement', {
        detail: { data: { ...data }, latest: { ...latest } },
      }));
    },

    getHistory() { return [...history]; },
    getLatest() { return { ...latest }; },

    clear() {
      history = [];
      latest = {};
      if (configuredMeasurements.length > 0) renderConfiguredRows();
      else if (liveValuesEl) liveValuesEl.innerHTML = '';
    },

    getMeta(key) { return getMeta(key); },

    exportCSV(filename) {
      if (history.length === 0) return;
      const keys = configuredMeasurements.length > 0
        ? configuredMeasurements.map(m => m.id)
        : Array.from(history.reduce((set, row) => {
            Object.keys(row).forEach(k => { if (k !== '_ts') set.add(k); });
            return set;
          }, new Set()));

      const header = ['_ts', ...keys].join(',');
      const rows = history.map(row => {
        const vals = [row._ts || ''];
        keys.forEach(k => vals.push(row[k] !== undefined ? row[k] : ''));
        return vals.join(',');
      });
      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'flabs-data-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    exportJSON(filename) {
      if (history.length === 0) return;
      const json = JSON.stringify(history, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'flabs-data-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  };

  function init() {
    if (initialized) return;
    initialized = true;
    liveValuesEl = document.getElementById('live-values');
    if (!liveValuesEl) {
      setTimeout(() => {
        liveValuesEl = document.getElementById('live-values');
        if (configuredMeasurements.length > 0) renderConfiguredRows();
      }, 500);
      return;
    }
    if (configuredMeasurements.length > 0) renderConfiguredRows();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ExperimentAPI = ExperimentAPI;
  console.log('[ExperimentAPI] ready');
})();
