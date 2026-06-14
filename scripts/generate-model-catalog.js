#!/usr/bin/env node
/**
 * scripts/generate-model-catalog.js
 *
 * Generates sources/pi-model-catalog.json from the pi SDK.
 * Run after pi SDK updates to refresh the model list.
 *
 * Usage:  node scripts/generate-model-catalog.js
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'sources', 'pi-model-catalog.json');

let AuthStorage, ModelRegistry;

try {
  const mod = await import('@earendil-works/pi-coding-agent');
  AuthStorage = mod.AuthStorage;
  ModelRegistry = mod.ModelRegistry;
} catch (_) {
  console.error('Error: @earendil-works/pi-coding-agent not installed.');
  console.error('Run:  npm install --include=dev');
  process.exit(1);
}

const auth = AuthStorage.inMemory();
const registry = ModelRegistry.inMemory(auth);
const groups = new Map();

for (const m of registry.getAll()) {
  const g = groups.get(m.provider);
  const entry = { id: m.id, name: m.name || m.id, reasoning: !!m.reasoning, input: m.input };
  if (g) {
    g.models.push(entry);
  } else {
    groups.set(m.provider, {
      id: m.provider,
      name: registry.getProviderDisplayName(m.provider),
      models: [entry],
    });
  }
}

const catalog = [...groups.values()]
  .map((provider) => ({
    ...provider,
    models: provider.models.sort((a, b) => a.id.localeCompare(b.id)),
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

fs.writeFileSync(OUT, JSON.stringify(catalog, null, 2) + '\n');
console.log(`Wrote ${catalog.length} providers (${catalog.reduce((s, p) => s + p.models.length, 0)} models) to ${OUT}`);
