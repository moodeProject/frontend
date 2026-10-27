import test from 'node:test';
import assert from 'node:assert/strict';
import { activeEvents, belongsTo, buildPreventionItems, sensorSignals } from '../src/utils/prevention.js';
const now = Date.now();
const worker = { id: 7, name: '동명이인', employeeNumber: 'WK-7', serverDataConnected: true,
  recordedAt: new Date(now).toISOString(), fallState: 'NORMAL', healthState: 'NORMAL' };
const event = { id: 1, workerId: 7, category: 'external', kind: 'puddle', level: 'warning',
  status: 'UNHANDLED', occurredAt: new Date(now).toISOString() };
test('missing, stale, normal and disconnected measurements do not raise warnings', () => {
  assert.deepEqual(sensorSignals(worker, now), []);
  assert.deepEqual(sensorSignals({ ...worker, fallState: 'WAITING', healthState: 'UNKNOWN', heatRiskLevel: 'NO_DATA' }, now), []);
  assert.deepEqual(sensorSignals({ ...worker, recordedAt: null, fatigueAbnormal: true }, now), []);
  assert.deepEqual(sensorSignals({ ...worker, recordedAt: new Date(now-31000).toISOString(), fatigueAbnormal: true }, now), []);
  assert.deepEqual(sensorSignals({ ...worker, serverDataConnected: false, fatigueAbnormal: true }, now), []);
});
test('health, posture and emergency signals remain distinct', () => {
  assert.deepEqual(sensorSignals({ ...worker, fatigueAbnormal: true }, now), ['fatigue']);
  assert.deepEqual(sensorSignals({ ...worker, postureAbnormal: true, posture: 'STUMBLE' }, now), ['posture']);
  assert.deepEqual(sensorSignals({ ...worker, postureAbnormal: true, posture: 'COLLAPSE' }, now), ['fall']);
});
test('identity uses exact IDs and does not fall back to a matching name or old helmet', () => {
  assert.equal(belongsTo({ workerId: 8, name: worker.name, helmetNo: 'H-1' }, { ...worker, helmetNo:'H-1' }), false);
  assert.equal(belongsTo({ name: worker.name }, worker), false);
  assert.equal(belongsTo({ employeeNo: 'WK-7' }, worker), true);
});
test('resolved and old events are excluded; duplicate records do not count as repetition', () => {
  assert.equal(activeEvents([event, { ...event, id: 2, status: 'RESOLVED' },
    { ...event, id: 3, occurredAt: new Date(now-600001).toISOString() }], now).length, 1);
  assert.equal(buildPreventionItems([worker], [event, event], new Map(), now)[0].priority, false);
  const rows = buildPreventionItems([worker], [event, { ...event, id: 2 }], new Map(), now);
  assert.equal(rows[0].repeatCount, 2);
  assert.equal(rows[0].priority, true);
});
test('continuous observation raises priority only after 30 seconds; live sensor is not cleared by resolved history', () => {
  const abnormal = { ...worker, healthState:'ACTION_REQUIRED' };
  const map = new Map([['7:health', { firstAt: now - 30000 }]]);
  assert.equal(buildPreventionItems([abnormal], [{ ...event, category:'health', status:'RESOLVED' }], map, now)[0].sustained, true);
  assert.equal(buildPreventionItems([abnormal], [], new Map(), now)[0].priority, false);
});
