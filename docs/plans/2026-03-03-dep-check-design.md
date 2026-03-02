# Dependency Hygiene CI — Design

**Date:** 2026-03-03
**Status:** Approved

## Goal

Surface dependency changes on every PR as an advisory-only bot comment. Never blocks merge. Covers: new/updated/removed packages, license flags, npm metadata, and CVE audit scoped to changed packages.

## Trigger

`.github/workflows/dep-check.yml` — runs only on `pull_request` events where `package.json` or `pnpm-lock.yaml` changed (`paths` filter). If nothing changed, the job skips entirely.

## Architecture

Single dedicated job. Posts its own bot comment (create or update, identified by a unique header string). Runs in parallel with the existing test jobs.

## What It Detects

### 1. Package diff
Compare `pnpm-lock.yaml` on the PR branch vs. base branch using `git diff`. Extract three lists:
- **Added** — new packages not present in base
- **Removed** — packages dropped from base
- **Updated** — packages present in both with version change (old→new)

Use [`@npmcli/arborist`](https://www.npmjs.com/package/@npmcli/arborist) or simple regex parsing of the lockfile diff to extract package names and versions.

### 2. npm registry metadata (added packages only)
Query `https://registry.npmjs.org/<pkg>/latest` — free, no auth required.
Extract: `license`, `deprecated` flag.

Query `https://api.npmjs.org/downloads/point/last-week/<pkg>` for weekly download count.

### 3. License flagging
Flag as ⚠️: `GPL-2.0`, `GPL-3.0`, `AGPL-3.0`, `LGPL-2.0`, `LGPL-2.1`, `LGPL-3.0`, `UNLICENSED`, missing license.
Mark as ✅: `MIT`, `ISC`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `0BSD`, `CC0-1.0`.

### 4. CVE audit
Run `pnpm audit --json`. Filter results to only show findings in packages that appear in the diff (added or updated). Suppress unrelated transitive noise.

## Bot Comment Shape

```
## 📦 Dependency Changes

### Added (2)
| Package | Version | License | Downloads/wk |
|---------|---------|---------|-------------|
| zod     | 3.22.0  | MIT ✅  | 12.4M       |
| some-lib| 1.0.0   | GPL ⚠️  | 340         |

### Updated (1)
| Package | From  | To    |
|---------|-------|-------|
| drizzle | 0.29  | 0.30  |

### Removed (1)
- `old-package`

### 🔐 Audit
No vulnerabilities found in changed packages.
```

If no lockfile changes: post a one-liner `> No dependency changes detected.`

Comment is created on first run, updated on subsequent pushes (matched by bot user + header string).

## Data Flow

```
PR opened/updated
  └─ paths filter: package.json or pnpm-lock.yaml changed?
       ├─ no  → job skips
       └─ yes
            ├─ checkout with full history (fetch-depth: 0)
            ├─ git diff origin/base...HEAD -- pnpm-lock.yaml
            ├─ parse diff → added / updated / removed
            ├─ npm registry API → metadata for added pkgs (parallel fetch)
            ├─ pnpm audit --json → filter to changed pkgs
            └─ github-script → post/update bot comment
```

## Error Handling

- npm registry lookups: best-effort; show `unknown` on failure, never fail the job
- `pnpm audit` non-zero exit: caught and treated as advisory output, not a job failure
- Lockfile parse errors: log warning, post comment noting parse failed

## Libraries

May use existing npm packages within the `github-script` step or a small inline Node script:
- `node-fetch` / native `fetch` (Node 20) for registry API calls
- Lockfile parsing: regex on the diff output is sufficient (no need for a full parser)
- No new runtime dependencies added to the project itself

## Out of Scope

- Blocking merge on any finding (all advisory)
- Bundle size analysis (separate concern, future item)
- Checking transitive dep licenses (only direct deps in diff)
