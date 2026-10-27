import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequestGate } from '../src/utils/requestGate.js';

test('concurrent triggers share one request and return the same result', async () => {
  let calls = 0, release;
  const gate = createRequestGate({ load: () => { calls++; return new Promise(resolve => { release = resolve; }); } });
  const first = gate.run(), second = gate.run();
  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(calls, 1);
  release({ events: [1] });
  assert.deepEqual(await second, { events: [1] });
});

test('failures back off, keep the error during retries, and clear it only after success', async () => {
  let clock = 0, calls = 0, fail = true, uiError = '', starts = 0;
  const gate = createRequestGate({ now: () => clock,
    load: async () => { calls++; if (fail) throw new Error('Failed to fetch'); return { events: [1] }; },
    onStart: () => { starts++; }, onError: e => { uiError = e.message; }, onSuccess: () => { uiError = ''; }
  });
  await assert.rejects(gate.run());
  for (let i = 0; i < 20; i++) await assert.rejects(gate.run());
  assert.equal(calls, 1);
  assert.equal(starts, 1);
  clock = 5000;
  const retry = gate.run();
  assert.equal(uiError, 'Failed to fetch');
  await assert.rejects(retry);
  clock = 10000;
  await assert.rejects(gate.run());
  assert.equal(calls, 2);
  clock = 15000;
  fail = false;
  await gate.run();
  assert.equal(uiError, '');
  assert.equal(calls, 3);
});

test('explicit manual retry can bypass backoff but cannot create overlapping requests', async () => {
  let calls = 0;
  const gate = createRequestGate({ load: async () => { calls++; throw new Error('offline'); } });
  await assert.rejects(gate.run());
  await assert.rejects(gate.run({}, { force: true }));
  assert.equal(calls, 2);
});
