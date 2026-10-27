import test from 'node:test';
import assert from 'node:assert/strict';
import { createAlertTracker, mergeAlertQueue, eventAlert, notificationAlert, sensorAlerts, sameWorker } from '../src/utils/safetyAlerts.js';
const now = Date.now();
const stamp = new Date(now).toISOString();
const event = { id: 42, workerId:7, category:'external', kind:'puddle', name:'작업자', zone:'A구역', occurredAt:stamp, status:'UNHANDLED' };
test('historical, future, and invalid timestamps never become new live alerts', () => {
  const tracker=createAlertTracker(now);
  const items=[{...event,key:'old',occurredAt:new Date(now-10000).toISOString()}, {...event,key:'invalid',occurredAt:'bad'}, {...event,key:'future',occurredAt:new Date(now+60000).toISOString()}];
  assert.deepEqual(tracker.take(items,now),[]);
});
test('polling, navigation, and restoring saved seen IDs do not replay an event', () => {
  const tracker=createAlertTracker(now), item=eventAlert(event);
  assert.equal(tracker.take([item],now).length,1);
  assert.equal(tracker.take([item],now).length,0);
  assert.equal(createAlertTracker(now,tracker.saved()).take([item],now).length,0);
});
test('emergency preempts a caution notice, without dropping the caution notice', () => {
  const warning=eventAlert(event);
  const emergency=eventAlert({...event,id:43,category:'fall',kind:'fall',type:'추락'});
  const queue=mergeAlertQueue([warning],[emergency]);
  assert.deepEqual(queue.map(row=>row.priority),[3,1]);
});
test('health and stumble get emphasis, and do not become a fall emergency', () => {
  assert.equal(eventAlert({...event,category:'health',kind:'fatigue'}).priority,2);
  assert.equal(eventAlert({...event,category:'fall',type:'휘청거림',kind:'fall'}).kind,'posture');
  assert.equal(eventAlert({...event,status:'RESOLVED'}),null);
});
test('worker identity must use ID or employee number, never matching names or helmets', () => {
  assert.equal(sameWorker({...event,workerId:8},{workerId:7,name:'작업자'}),false);
  assert.equal(sameWorker({name:'작업자',helmetNo:'H-1'},{name:'작업자',helmetNo:'H-1'}),false);
  assert.equal(sameWorker(event,{workerId:7}),true);
});
test('missing, disconnected, normal, waiting, or stale sensor data never raises an alert', () => {
  const worker={id:7,serverDataConnected:true,recordedAt:stamp,fallState:'NORMAL',healthState:'NORMAL'};
  assert.deepEqual(sensorAlerts(worker,now),[]);
  assert.deepEqual(sensorAlerts({...worker,fallState:'WAITING',healthState:'UNKNOWN'},now),[]);
  assert.deepEqual(sensorAlerts({...worker,fatigueAbnormal:true,recordedAt:new Date(now-31000).toISOString()},now),[]);
  assert.deepEqual(sensorAlerts({...worker,fatigueAbnormal:true,serverDataConnected:false},now),[]);
  assert.equal(sensorAlerts({...worker,postureAbnormal:true,posture:'STUMBLE'},now)[0].priority,2);
  assert.equal(sensorAlerts({...worker,postureAbnormal:true,posture:'COLLAPSE'},now)[0].priority,3);
});
test('read or resolved notifications are silent, and SOS is urgent', () => {
  const sos={...event,source:'server',sosId:3,title:'SOS 긴급 요청',read:false};
  assert.equal(notificationAlert(sos).priority,3);
  assert.equal(notificationAlert({...sos,read:true}),null);
  assert.equal(notificationAlert({...sos,status:'RESOLVED'}),null);
});
test('sensor/event duplication for the same worker and time is combined', () => {
  const first={...eventAlert(event),kind:'health',priority:2};
  const second={...first,key:'sensor:7:health'};
  assert.equal(mergeAlertQueue([first],[second]).length,1);
  assert.equal(mergeAlertQueue([first],[{...second,workerId:8}]).length,2);
});

test('a fresh ongoing sensor risk is shown once on entry, even if it started before the page opened', () => {
  const tracker = createAlertTracker(now);
  const item = { ...event, key:'sensor:7:health:onset', episode:'sensor:7:health', occurredAt:new Date(now-10000).toISOString() };
  assert.equal(tracker.take([item],now).length,1);
  assert.equal(tracker.take([{...item,recordedAt:new Date(now+1000).toISOString()}],now+1000).length,0);
});
