import test from 'node:test';
import assert from 'node:assert/strict';
import { vitalDisplay, measurementAge } from '../src/utils/vitalDisplay.js';
const now=Date.now(), old=new Date(now-180000).toISOString(), fresh=new Date(now).toISOString();
const worker={deviceId:'H-1',heartRate:0,recordedAt:fresh,lastValidVitals:{deviceId:'H-1',heartRate:86,heartRateRecordedAt:old,spo2:98,spo2RecordedAt:fresh}};
test('zero uses last valid value and its own measurement time, without changing the raw reading',()=>{
 const view=vitalDisplay(worker,'heartRate',now);
 assert.deepEqual(view,{value:86,recordedAt:old,lastValid:true});
 assert.equal(worker.heartRate,0);
 assert.equal(measurementAge(view.recordedAt,now),'3분 전 측정');
});
test('positive live reading wins over a saved value',()=>{
 assert.deepEqual(vitalDisplay({...worker,heartRate:91},'heartRate',now),{value:91,recordedAt:fresh,lastValid:false});
});
test('zero, null, invalid or negative fallback stays unmeasured',()=>{
 for(const value of [0,null,-1,'bad']) assert.equal(vitalDisplay({...worker,lastValidVitals:{deviceId:'H-1',heartRate:value}},'heartRate',now).value,null);
});
test('a fallback from a previous helmet is never shown',()=>{
 assert.equal(vitalDisplay({...worker,deviceId:'H-2'},'heartRate',now).value,null);
});
test('each metric keeps its own timestamp, and an unknown time is not presented as live',()=>{
 assert.equal(vitalDisplay(worker,'spo2',now).recordedAt,fresh);
 assert.equal(vitalDisplay({...worker,lastValidVitals:{deviceId:'H-1',heartRate:86}},'heartRate',now).recordedAt,null);
 assert.equal(measurementAge(null,now),'측정 시각 미확인');
});
