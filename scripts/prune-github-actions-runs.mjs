#!/usr/bin/env node
/**
 * GitHub Actions 실행 기록 정리 — 워크플로별(또는 전체) 최신 N개만 남기고 삭제.
 *
 * 로컬: gh 로그인 필요 (repo, workflow 스코프)
 *   node scripts/prune-github-actions-runs.mjs --dry-run
 *   node scripts/prune-github-actions-runs.mjs --keep=2
 *
 * 환경변수: KEEP, PRUNE_MODE=workflow|global, GITHUB_REPOSITORY, GH_TOKEN|GITHUB_TOKEN
 */
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const keepArg = args.find((a) => a.startsWith('--keep='));
const modeArg = args.find((a) => a.startsWith('--mode='));
const delayArg = args.find((a) => a.startsWith('--delay-ms='));

const KEEP = Math.max(
  1,
  parseInt(keepArg?.split('=')[1] ?? process.env.KEEP ?? '2', 10),
);
const MODE = (modeArg?.split('=')[1] ?? process.env.PRUNE_MODE ?? 'workflow').toLowerCase();
const DELAY_MS = parseInt(delayArg?.split('=')[1] ?? process.env.PRUNE_DELAY_MS ?? '300', 10);

const repoFull = process.env.GITHUB_REPOSITORY ?? 'jomigata/wiz-coco';
const [owner, repo] = repoFull.split('/');
if (!owner || !repo) {
  console.error('Invalid repo:', repoFull);
  process.exit(1);
}

function resolveToken() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execSync('gh auth token', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch {
    console.error('No GH token. Set GH_TOKEN or run: gh auth login');
    process.exit(1);
  }
}

const token = resolveToken();

async function gh(path, { method = 'GET' } = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (method === 'DELETE') {
    if (res.status === 204) return true;
    const text = await res.text();
    console.error(`DELETE ${path} -> ${res.status} ${text}`);
    return false;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} ${res.status}: ${text}`);
  }
  return res.json();
}

async function listAllRuns() {
  const all = [];
  let page = 1;
  for (;;) {
    const data = await gh(
      `/repos/${owner}/${repo}/actions/runs?per_page=100&page=${page}`,
    );
    const batch = data.workflow_runs ?? [];
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < 100) break;
    page += 1;
    if (page > 500) {
      console.warn('Stopped at page 500 (50k runs cap).');
      break;
    }
  }
  return all;
}

function idsToDelete(runs) {
  if (MODE === 'global') {
    const sorted = [...runs].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
    return sorted.slice(KEEP).map((r) => r.id);
  }

  const byWorkflow = new Map();
  for (const r of runs) {
    const key = r.name ?? String(r.workflow_id);
    if (!byWorkflow.has(key)) byWorkflow.set(key, []);
    byWorkflow.get(key).push(r);
  }

  const toDelete = [];
  for (const [name, list] of byWorkflow) {
    const sorted = [...list].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
    const drop = sorted.slice(KEEP).map((r) => r.id);
    if (drop.length) {
      console.log(`  ${name}: keep ${Math.min(KEEP, sorted.length)}, delete ${drop.length}`);
    }
    toDelete.push(...drop);
  }
  return toDelete;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`Repo: ${owner}/${repo} | keep=${KEEP} | mode=${MODE} | dry-run=${dryRun}`);

  const runs = await listAllRuns();
  console.log(`Listed workflow runs: ${runs.length}`);

  const deleteIds = idsToDelete(runs);
  const unique = [...new Set(deleteIds)];

  console.log(`Runs to delete: ${unique.length}`);

  if (!unique.length) {
    console.log('Nothing to delete.');
    return;
  }

  if (dryRun) {
    console.log('Dry run — no deletions. Remove --dry-run to execute.');
    return;
  }

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < unique.length; i += 1) {
    const id = unique[i];
    const success = await gh(`/repos/${owner}/${repo}/actions/runs/${id}`, {
      method: 'DELETE',
    });
    if (success) ok += 1;
    else fail += 1;
    if ((i + 1) % 50 === 0) {
      console.log(`Progress: ${i + 1}/${unique.length} (ok=${ok}, fail=${fail})`);
    }
    if (DELAY_MS > 0) await sleep(DELAY_MS);
  }

  console.log(`Done. Deleted: ${ok}, failed: ${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
