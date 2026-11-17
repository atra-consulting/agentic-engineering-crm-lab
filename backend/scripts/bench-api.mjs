#!/usr/bin/env node
// Baseline API benchmark. Spawns the backend on port 7071 against the
// isolated crmdb.test.sqlite, measures startup and per-scenario latency,
// prints one JSON object to stdout.
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 7071;
const BASE = `http://localhost:${PORT}`;
const WARMUP = 50;
const RUNS = 300;
const responseCheckOff = process.argv.includes('--response-check=off');

let child = null;
let stderrBuf = '';

function killChild() {
  // tsx runs the server in a grandchild; kill the whole process group.
  if (!child || child.pid === undefined) return;
  try {
    process.kill(-child.pid, 'SIGKILL');
  } catch {
    // already gone
  }
}
process.on('exit', killChild);
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    killChild();
    process.exit(130);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cleanTestDb() {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    rmSync(join(backendDir, 'data', `crmdb.test.sqlite${suffix}`), { force: true });
  }
}

async function waitForHealth(t0) {
  while (performance.now() - t0 < 30000) {
    if (child.exitCode !== null) throw new Error(`Backend exited early (code ${child.exitCode})`);
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.status === 200) return performance.now() - t0;
    } catch {
      // not up yet
    }
    await sleep(50);
  }
  throw new Error('Backend health timeout (30s)');
}

let cookie = '';
async function call(method, path, body) {
  const headers = {};
  if (cookie) headers['Cookie'] = cookie;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, text, res };
}

async function login() {
  const { status, res } = await call('POST', '/api/auth/login', {
    benutzername: 'admin',
    passwort: 'admin123',
  });
  if (status !== 200) throw new Error(`Login failed: ${status}`);
  const cookies = res.headers.getSetCookie();
  const sess = cookies.find((c) => c.startsWith('JSESSIONID='));
  if (!sess) throw new Error('No JSESSIONID cookie');
  cookie = sess.split(';')[0];
}

function stats(samples) {
  const s = [...samples].sort((a, b) => a - b);
  const median = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  const p95 = s[Math.min(s.length - 1, Math.ceil(s.length * 0.95) - 1)];
  const r = (n) => Math.round(n * 1000) / 1000;
  return { medianMs: r(median), p95Ms: r(p95) };
}

async function main() {
  cleanTestDb();
  const env = { ...process.env, NODE_ENV: 'test', PORT: String(PORT), AGENT_API_TOKEN: 'bench-token' };
  delete env.CONTRACT_COVERAGE_FILE;
  delete env.CONTRACT_RESPONSE_CHECK;
  if (responseCheckOff) env.CONTRACT_RESPONSE_CHECK = 'off';

  const t0 = performance.now();
  child = spawn(join(backendDir, 'node_modules', '.bin', 'tsx'), ['src/index.ts'], {
    cwd: backendDir,
    env,
    stdio: ['ignore', 'ignore', 'pipe'],
    detached: true,
  });
  child.stderr.on('data', (d) => {
    stderrBuf += d.toString();
  });

  const startupMs = await waitForHealth(t0);
  await login();

  // Szenario fixture
  let szId = 1;
  let sz = await call('GET', '/api/szenarien/1');
  if (sz.status !== 200) {
    const list = await call('GET', '/api/szenarien');
    if (list.status !== 200) throw new Error(`GET /api/szenarien: ${list.status}`);
    const arr = JSON.parse(list.text);
    if (!arr.length) throw new Error('No szenario available');
    szId = arr[0].id;
    sz = await call('GET', `/api/szenarien/${szId}`);
    if (sz.status !== 200) throw new Error(`GET szenario ${szId}: ${sz.status}`);
  }
  const s = JSON.parse(sz.text);
  const szBody = {
    name: s.name,
    humanSteps: s.humanSteps,
    agileKiSteps: s.agileKiSteps,
    semiAutomatedSteps: s.semiAutomatedSteps,
    automatedSteps: s.automatedSteps,
  };

  let counter = 0;
  const runId = Date.now();
  const scenarios = {
    'GET /api/firmen/1': { run: () => call('GET', '/api/firmen/1'), expect: 200 },
    'GET /api/firmen?page=0&size=20': {
      run: () => call('GET', '/api/firmen?page=0&size=20'),
      expect: 200,
    },
    'POST /api/firmen (valid)': {
      run: () =>
        call('POST', '/api/firmen', {
          name: `Bench Firma ${runId}-${counter++}`,
          industry: 'Benchmark',
          email: 'bench@example.com',
        }),
      expect: 201,
    },
    'POST /api/firmen (invalid {})': { run: () => call('POST', '/api/firmen', {}), expect: 400 },
    [`PUT /api/szenarien/${szId}`]: {
      run: () => call('PUT', `/api/szenarien/${szId}`, szBody),
      expect: 200,
    },
  };

  const check = (name, r, expect) => {
    if (r.status !== expect) {
      throw new Error(`${name}: expected ${expect}, got ${r.status}: ${r.text.slice(0, 200)}`);
    }
  };

  const entries = Object.entries(scenarios);
  for (let i = 0; i < WARMUP; i++) {
    const [name, sc] = entries[i % entries.length];
    check(name, await sc.run(), sc.expect);
  }

  const out = {};
  for (const [name, sc] of entries) {
    const samples = [];
    for (let i = 0; i < RUNS; i++) {
      const a = process.hrtime.bigint();
      const r = await sc.run();
      const b = process.hrtime.bigint();
      check(name, r, sc.expect);
      samples.push(Number(b - a) / 1e6);
    }
    out[name] = stats(samples);
  }

  process.stdout.write(
    JSON.stringify({ startupMs: Math.round(startupMs * 10) / 10, scenarios: out }, null, 2) + '\n',
  );
}

try {
  await main();
} catch (err) {
  console.error(String(err instanceof Error ? err.stack : err));
  if (stderrBuf) console.error(`--- backend stderr ---\n${stderrBuf}`);
  process.exitCode = 1;
} finally {
  killChild();
}
