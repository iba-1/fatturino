#!/usr/bin/env node
// Dep-check analysis script — outputs JSON to stdout.
// Environment variables consumed:
//   BASE_REF  — base branch name (e.g. "main")
//
// Exit 0 always (advisory only).

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { load } from 'js-yaml'

function spawn(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', ...opts })
  if (result.error) throw result.error
  return result.stdout ?? ''
}

// --- 1. Parse both versions of the lockfile ---
const baseRef = process.env.BASE_REF ?? 'main'

let baseLock, headLock
try {
  const baseYaml = spawn('git', ['show', `origin/${baseRef}:pnpm-lock.yaml`])
  baseLock = load(baseYaml) ?? {}
  headLock = load(readFileSync('pnpm-lock.yaml', 'utf8')) ?? {}
} catch {
  console.log(JSON.stringify({ added: [], updated: [], removed: [], audit: [] }))
  process.exit(0)
}

// pnpm-lock.yaml v9: packages section keyed as "name@version"
const basePkgs = baseLock.packages ?? {}
const headPkgs = headLock.packages ?? {}

const added = []
const updated = []
const removed = []

// Find added and updated
for (const key of Object.keys(headPkgs)) {
  const atIdx = key.lastIndexOf('@')
  if (atIdx <= 0) continue
  const name = key.slice(0, atIdx)
  const version = key.slice(atIdx + 1)

  const baseKey = Object.keys(basePkgs).find(k => k.slice(0, k.lastIndexOf('@')) === name)
  if (!baseKey) {
    added.push({ name, version })
  } else if (baseKey !== key) {
    const fromVersion = baseKey.slice(baseKey.lastIndexOf('@') + 1)
    updated.push({ name, from: fromVersion, to: version })
  }
}

// Find removed
for (const key of Object.keys(basePkgs)) {
  const atIdx = key.lastIndexOf('@')
  if (atIdx <= 0) continue
  const name = key.slice(0, atIdx)
  const version = key.slice(atIdx + 1)
  const stillPresent = Object.keys(headPkgs).some(k => k.slice(0, k.lastIndexOf('@')) === name)
  if (!stillPresent) removed.push({ name, version })
}

// --- 2. License info via pnpm licenses list ---
const RISKY_LICENSES = new Set([
  'GPL-2.0', 'GPL-3.0', 'AGPL-3.0',
  'LGPL-2.0', 'LGPL-2.1', 'LGPL-3.0',
  'UNLICENSED',
])

// Build name→license map from pnpm licenses list --json output
// Output shape: { "MIT": [{ name, version, ... }], "Apache-2.0": [...] }
const licenseMap = new Map() // name → license string
try {
  const raw = spawn('pnpm', ['licenses', 'list', '--json', '--prod'])
  const byLicense = JSON.parse(raw)
  for (const [license, pkgs] of Object.entries(byLicense)) {
    for (const pkg of pkgs) {
      licenseMap.set(pkg.name, license)
    }
  }
} catch {
  // pnpm licenses list unavailable — leave licenseMap empty
}

// --- 3. Download counts from npm registry (added packages only) ---
async function fetchDownloads(name) {
  try {
    const encoded = encodeURIComponent(name)
    const dl = await fetch(`https://api.npmjs.org/downloads/point/last-week/${encoded}`).then(r => r.json())
    return dl.downloads ?? null
  } catch {
    return null
  }
}

const downloadResults = await Promise.all(added.map(p => fetchDownloads(p.name)))

const addedWithMeta = added.map((p, i) => {
  const license = licenseMap.get(p.name) ?? 'unknown'
  return {
    ...p,
    license,
    licenseOk: !RISKY_LICENSES.has(license) && license !== 'unknown',
    downloads: downloadResults[i],
  }
})

// --- 4. pnpm audit (scoped to changed packages) ---
const changedNames = new Set([
  ...added.map(p => p.name),
  ...updated.map(p => p.name),
])

let audit = []
try {
  const raw = spawnSync('pnpm', ['audit', '--json'], { encoding: 'utf8' }).stdout ?? ''
  const parsed = JSON.parse(raw)
  // pnpm audit JSON: { advisories: { [id]: { module_name, severity, title, url } } }
  const advisories = parsed.advisories ?? {}
  audit = Object.values(advisories)
    .filter(a => changedNames.has(a.module_name))
    .map(a => ({ name: a.module_name, severity: a.severity, title: a.title, url: a.url }))
} catch {
  // audit failed — leave audit as []
}

console.log(JSON.stringify({ added: addedWithMeta, updated, removed, audit }))
