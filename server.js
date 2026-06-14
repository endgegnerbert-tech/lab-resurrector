/**
 * server.js — flabs server
 *
 * Static files + REST API. No pi SDK, no AI, no WebSocket.
 * API keys stay in the browser. The server never sees them.
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3210;

const EXPERIMENTS_DIR = join(__dirname, 'experiments');
const SPACES_DIR = join(EXPERIMENTS_DIR, 'spaces');
const PROVIDER_CATALOG = readJsonFile(join(__dirname, 'sources', 'pi-model-catalog.json'), []);

function readJsonFile(path, fallback) {
  try { return JSON.parse(fs.readFileSync(path, 'utf-8')); }
  catch (_) { return fallback; }
}

function writeJsonFile(path, data) {
  fs.mkdirSync(dirname(path), { recursive: true });
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

function sanitizeSpaceId(value) {
  return String(value || '').toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'new-space';
}

function ensureUniqueSpaceId(baseId) {
  let id = sanitizeSpaceId(baseId);
  let c = 2;
  while (fs.existsSync(join(SPACES_DIR, id))) id = sanitizeSpaceId(baseId) + '-' + (c++);
  return id;
}

function resolveSpacePath(spaceId) {
  if (!/^[a-z][a-z0-9-]*$/.test(spaceId)) throw new Error('Invalid space ID');
  const resolved = join(SPACES_DIR, spaceId);
  if (!resolved.startsWith(SPACES_DIR + '/')) throw new Error('Forbidden');
  return resolved;
}

function readSpacesManifest() {
  return readJsonFile(join(EXPERIMENTS_DIR, 'manifest.json'), { spaces: [] }) || { spaces: [] };
}

function writeSpacesManifest(m) {
  writeJsonFile(join(EXPERIMENTS_DIR, 'manifest.json'), m);
}

async function main() {
  console.log('flabs — physics playground');
  console.log('Server: static files + REST API. No pi SDK runtime.');
  console.log('AI: browser-native. Keys never reach server.');

  const app = express();

  app.use(express.json({ limit: '64kb' }));
  app.use(express.static(__dirname));
  app.use('/experiments', express.static(join(__dirname, 'experiments')));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), providers: PROVIDER_CATALOG.length });
  });

  app.get('/api/providers', (_req, res) => {
    res.json({ providers: PROVIDER_CATALOG });
  });

  app.get('/api/spaces', (_req, res) => res.json(readSpacesManifest()));

  app.post('/api/spaces', (req, res) => {
    const title = String(req.body?.title || '').trim().slice(0, 80);
    if (!title) return res.status(400).json({ error: 'Title required' });
    const id = ensureUniqueSpaceId(title);
    const dir = resolveSpacePath(id);

    try {
      fs.mkdirSync(dir, { recursive: true });
      writeJsonFile(join(dir, 'experiment.json'), {
        schemaVersion: 1,
        id,
        title,
        domain: 'physics',
        engine: 'canvas-2d',
        level: 'school',
        concepts: ['free lab'],
        parameters: {},
        measurements: [{ id: 't', label: 'Time', unit: 's' }],
        formulas: [{
          id: 'free-space-model',
          name: 'Free lab model',
          formula: 'Model is set via chat',
          variables: { t: 'Time (s)' },
          validWhen: 'No physics model selected yet.',
        }],
      });
      writeJsonFile(join(dir, 'sources.json'), {
        schemaVersion: 1,
        spaceId: id,
        sources: [],
        notes: 'Created via UI.',
      });

      const manifest = readSpacesManifest();
      const space = {
        id,
        title,
        path: '/experiments/spaces/' + id + '/',
        domain: 'physics',
        concepts: ['free lab'],
        createdAt: new Date().toISOString(),
      };
      manifest.spaces = [...(manifest.spaces || []).filter((s) => s.id !== id), space];
      writeSpacesManifest(manifest);
      res.status(201).json({ space });
    } catch (_) {
      res.status(500).json({ error: 'Could not create space' });
    }
  });

  app.get('/api/spaces/:id/manifest', (req, res) => {
    const id = req.params.id;
    if (!/^[a-z][a-z0-9-]*$/.test(id)) return res.status(400).json({ error: 'Invalid space ID' });
    try {
      res.json(readJsonFile(join(resolveSpacePath(id), 'experiment.json')));
    } catch (err) {
      res.status(err.code === 'ENOENT' ? 404 : 500).json({ error: 'Not found' });
    }
  });

  app.delete('/api/spaces/:id', (req, res) => {
    const id = req.params.id;
    if (!/^[a-z][a-z0-9-]*$/.test(id)) return res.status(400).json({ error: 'Invalid space ID' });
    try {
      const manifest = readSpacesManifest();
      const idx = (manifest.spaces || []).findIndex((s) => s.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Space not found' });
      manifest.spaces.splice(idx, 1);
      writeSpacesManifest(manifest);
      const dir = resolveSpacePath(id);
      fs.rmSync(dir, { recursive: true, force: true });
      res.json({ ok: true });
    } catch (_) {
      res.status(500).json({ error: 'Could not delete space' });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log('http://localhost:' + PORT);
  });
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
