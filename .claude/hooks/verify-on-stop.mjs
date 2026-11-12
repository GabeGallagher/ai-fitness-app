// Claude Code Stop hook: runs `npm run verify` (lint, typecheck, and every automated
// test) before Claude reports a task finished. Decided in docs/decisions/005-testing.md.
//
// - Skips when no code has changed: a clean working tree, or only docs/ and *.md changed.
// - Skips when the same changes already passed (so answering a question after a
//   verified change doesn't re-run everything).
// - On failure, blocks the stop and hands the failing output back to Claude to fix.
// - After MAX_BLOCKS failed attempts in a row it lets Claude stop, with a warning
//   shown to the user, so a failure Claude can't fix doesn't loop forever.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BLOCKS = 3;
const MAX_REASON_CHARS = 6000;

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const stateDir = join(projectDir, 'node_modules', '.cache');
const stateFile = join(stateDir, 'claude-verify-state.json');

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

function readState() {
  try {
    return JSON.parse(readFileSync(stateFile, 'utf8'));
  } catch {
    return {};
  }
}

function writeState(state) {
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function output(json) {
  process.stdout.write(JSON.stringify(json));
  process.exit(0);
}

/** Changed paths (staged, unstaged, untracked) that can affect lint, types, or tests. */
function changedCodePaths() {
  const res = spawnSync('git', ['status', '--porcelain=v1', '-z', '-uall'], { cwd: projectDir, encoding: 'utf8' });
  if (res.status !== 0) return null; // not a git repo or git missing: always verify
  const entries = res.stdout.split('\0').filter(Boolean);
  const paths = [];
  for (let i = 0; i < entries.length; i++) {
    const status = entries[i].slice(0, 2);
    paths.push(entries[i].slice(3));
    if (status.includes('R') || status.includes('C')) i++; // skip the rename's original path
  }
  return paths.filter((p) => !p.startsWith('docs/') && !p.toLowerCase().endsWith('.md'));
}

/** A fingerprint of the current content of the changed files. */
function fingerprint(paths) {
  const hash = createHash('sha256');
  for (const p of [...paths].sort()) {
    hash.update(p + '\0');
    const full = join(projectDir, p);
    hash.update(existsSync(full) ? readFileSync(full) : '<deleted>');
    hash.update('\0');
  }
  return hash.digest('hex');
}

const input = readStdin();
const sessionId = input.session_id ?? 'unknown';
const state = readState();

const paths = changedCodePaths();
if (paths && paths.length === 0) process.exit(0); // nothing that tests could catch has changed

const print = paths ? fingerprint(paths) : null;
if (print && state.lastPassed === print) process.exit(0); // these exact changes already passed

const run = spawnSync('npm run verify', { cwd: projectDir, encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 });
const log = `${run.stdout ?? ''}\n${run.stderr ?? ''}`.replace(/\x1b\[[0-9;]*m/g, '').trim();

if (run.status === 0) {
  writeState({ ...state, lastPassed: print, blocks: {} });
  output({ systemMessage: 'Verified: lint, typecheck, and all automated tests pass.' });
}

const blocks = { ...(state.blocks ?? {}) };
blocks[sessionId] = (blocks[sessionId] ?? 0) + 1;
writeState({ ...state, blocks });

if (blocks[sessionId] > MAX_BLOCKS) {
  writeState({ ...state, blocks: { ...blocks, [sessionId]: 0 } }); // the next task starts fresh
  output({
    systemMessage: `Verification is still failing after ${MAX_BLOCKS} attempts. Claude was allowed to stop; run \`npm run verify\` to see the failures.`,
  });
}

const tail = log.length > MAX_REASON_CHARS ? '…\n' + log.slice(-MAX_REASON_CHARS) : log;
output({
  decision: 'block',
  reason:
    `\`npm run verify\` failed (attempt ${blocks[sessionId]} of ${MAX_BLOCKS}). ` +
    `Fix the failures below and keep working; don't report the task as finished until verification passes. ` +
    `If a failure can't be fixed without the owner, say so plainly.\n\n${tail}`,
});
