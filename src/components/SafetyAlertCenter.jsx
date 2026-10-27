import { Component, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, Volume2, ShieldAlert, X } from 'lucide-react';
import { useDetections } from '../context/DetectionContext';
import { useNotifications } from '../context/NotificationContext';
import { useWorkers } from '../context/WorkerContext';
import { createSOS } from '../api/sos';
import { getWorkerProfile } from '../utils/workerProfile';
import { alertCopy, createAlertTracker, eventAlert, mergeAlertQueue, notificationAlert, sameWorker, sensorAlerts } from '../utils/safetyAlerts';
import '../styles/safetyAlertCenter.css';

function read(key, fallback) { try { return JSON.parse(sessionStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function save(key, value) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Alerts work without storage. */ } }

// An optional notification surface must never take the application down.
export default class SafetyAlertBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('안전 알림 화면 오류:', error); }
  render() { return this.state.failed ? null : <SafetyAlertCenter {...this.props} />; }
}
function SafetyAlertCenter({ role }) {
  const { detections } = useDetections();
  const { notifications } = useNotifications();
  const { workers } = useWorkers();
  const profile = getWorkerProfile();
  const identity = role === 'worker' ? profile.workerId || profile.employeeNo : 'admin';
  const storeKey = `safeon-alerts-${role}-${identity}`;
  const tracker = useMemo(() => createAlertTracker(Date.now(), read(storeKey, [])), [storeKey]);
  const episodes = useRef({});
  const [queue, setQueue] = useState([]);
  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState({ sound: true, voice: true, vibration: true });
  const [settings, setSettings] = useState(false);
  const [testKind, setTestKind] = useState('puddle');
  const [mediaError, setMediaError] = useState('');
  const [sos, setSos] = useState({ key: '', pending: false, done: false, message: '' });
  const sosBusy = useRef(false);
  const audio = useRef(null);
  const dialog = useRef(null);
  const [now, setNow] = useState(Date.now);
  const current = queue[0];
  const vibrating = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  const speaking = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    episodes.current = read(`${storeKey}-episodes`, {});
    setQueue([]);
    const timer = window.setInterval(() => setNow(Date.now()), 2000);
    return () => window.clearInterval(timer);
  }, [storeKey]);

  useEffect(() => {
    const allowed = workers.filter(worker => role !== 'worker' || sameWorker({ workerId: worker.workerId ?? worker.id, employeeNo: worker.employeeNumber || worker.employeeNo }, profile));
    const candidates = detections.filter(event => role !== 'worker' || sameWorker(event, profile)).map(eventAlert).filter(Boolean);
    const activeEpisodes = new Set();
    for (const worker of allowed) for (const signal of sensorAlerts(worker, now)) {
      activeEpisodes.add(signal.episode);
      if (!episodes.current[signal.episode]) episodes.current[signal.episode] = signal.occurredAt;
      candidates.push({ ...signal, key: `${signal.episode}:${episodes.current[signal.episode]}`, occurredAt: episodes.current[signal.episode] });
    }
    for (const key of Object.keys(episodes.current)) if (!activeEpisodes.has(key)) delete episodes.current[key];
    save(`${storeKey}-episodes`, episodes.current);
    for (const notification of notifications) {
      // Worker alerts must identify the signed-in recipient; never infer by name.
      if (role === 'worker' && (String(notification.recipientType || '').toUpperCase() !== 'WORKER' ||
        String(notification.recipientId || '') !== String(profile.workerId || ''))) continue;
      const item = notificationAlert(notification);
      if (item) candidates.push(item);
    }
    const fresh = tracker.take(candidates, now);
    if (fresh.length) { save(storeKey, tracker.saved()); setQueue(items => mergeAlertQueue(items, fresh)); }
  }, [detections, notifications, workers, now, role, profile.workerId, profile.employeeNo, tracker, storeKey]);

  // Discard queued notices if the authoritative event has already been resolved.
  useEffect(() => {
    const resolved = new Set(detections.filter(event => event.processClass === 'completed' || ['RESOLVED','COMPLETED','CLOSED','DONE'].includes(String(event.status).toUpperCase())).map(event => `event:${event.id}`));
    setQueue(items => items.some(item => resolved.has(item.key)) ? items.filter(item => !resolved.has(item.key)) : items);
  }, [detections]);

  function dismiss() { setQueue(items => items.slice(1)); }
  function beep(priority) {
    const context = audio.current;
    if (!context || context.state !== 'running' || !prefs.sound) return;
    const count = priority === 3 ? 3 : 1;
    for (let i=0; i<count; i++) {
      const oscillator = context.createOscillator(), gain = context.createGain();
      const at = context.currentTime + i * .28;
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.frequency.value = priority === 3 ? 880 : 660;
      gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(.12, at+.02);
      gain.gain.exponentialRampToValueAtTime(.001, at+.18);
      oscillator.start(at); oscillator.stop(at+.2);
    }
  }
  async function enable() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (Audio) { if (!audio.current) audio.current = new Audio(); await audio.current.resume(); }
      setReady(true); setMediaError('');
      if (vibrating && prefs.vibration) navigator.vibrate(100);
    } catch { setMediaError('소리를 켜지 못했습니다. 기기 설정을 확인하고 다시 시도해주세요.'); }
  }
  useEffect(() => {
    if (!current) return;
    const priority = current.priority;
    const notify = (voice = false) => {
      if (!ready) return;
      try {
        beep(priority);
        if (prefs.vibration && vibrating) navigator.vibrate(priority === 3 ? [250,100,250,100,400] : [180,100,180]);
        if (voice && prefs.voice && speaking && priority >= 2) {
          window.speechSynthesis.cancel();
          const speech = new SpeechSynthesisUtterance(`${role === 'admin' ? `${current.name || '작업자'}. ${current.zone || '위치 확인 필요'}. ` : ''}${alertCopy(current.kind, role)[1]}`);
          speech.lang = 'ko-KR'; speech.rate = 1.05;
          speech.onerror = event => { if (!['canceled', 'interrupted'].includes(event.error)) setMediaError('음성 재생을 확인해주세요. 화면 알림은 계속 표시됩니다.'); };
          window.speechSynthesis.speak(speech);
        }
      } catch { setMediaError('소리·음성 재생을 확인해주세요. 화면 알림은 계속 표시됩니다.'); }
    };
    notify(true);
    const timer = priority === 1 ? window.setTimeout(dismiss, 10000) : priority === 3 ? window.setInterval(() => notify(false), 8000) : null;
    return () => {
      if (timer) { window.clearTimeout(timer); window.clearInterval(timer); }
      if (ready && speaking) window.speechSynthesis.cancel();
      if (ready && vibrating) navigator.vibrate(0);
    };
  // A received alert is announced once; stable keys prevent replay on polling/navigation.
  }, [current?.key, ready, prefs.sound, prefs.voice, prefs.vibration]);

  useEffect(() => {
    if (current?.priority !== 3) return;
    const previous = document.activeElement;
    dialog.current?.querySelector('button, a')?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, [current?.key]);
  useEffect(() => () => { audio.current?.close().catch(() => {}); }, []);

  async function requestRescue() {
    if (!current || current.test || sosBusy.current || (sos.key === current.key && sos.done)) return;
    const worker = workers.find(row => sameWorker({ workerId: row.workerId ?? row.id, employeeNo: row.employeeNumber || row.employeeNo }, profile));
    const id = Number(worker?.workerId ?? worker?.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      setSos({ key: current.key, pending: false, done: false, message: '로그인 작업자 정보를 확인하지 못했습니다. SOS 화면에서 다시 요청하거나 119에 연락해주세요.' });
      return;
    }
    const key = current.key;
    sosBusy.current = true;
    setSos({ key, pending: true, done: false, message: '관리자에게 구조 요청을 보내는 중입니다.' });
    try {
      const result = await createSOS(id);
      setSos({ key, pending: false, done: true, message: `관리자 구조 요청이 접수되었습니다${result?.sosId != null ? ` · SOS #${result.sosId}` : ''}.` });
    } catch (error) {
      setSos({ key, pending: false, done: false, message: `구조 요청을 접수하지 못했습니다. 다시 시도하거나 119에 연락해주세요. ${error?.message || ''}` });
    } finally { sosBusy.current = false; }
  }
  function testAlert() {
    const kind = testKind;
    const item = { key: `test:${Date.now()}`, test: true, kind, priority: ['fall','sos'].includes(kind) ? 3 : ['health','posture'].includes(kind) ? 2 : 1,
      occurredAt: new Date().toISOString(), name: '테스트 작업자', zone: '테스트 구역', target: '/notifications' };
    setQueue(items => mergeAlertQueue(items, [item])); setSettings(false);
  }
  const workerTarget = current?.priority === 3 ? '/worker/sos' : current?.kind === 'posture' ? '/worker/fall-status' :
    current?.category === 'external' ? `/worker/hazards/${encodeURIComponent(current.id)}` : '/worker/health';
  const urgent = current?.priority === 3;
  const title = current ? alertCopy(current.kind, role)[0] : '';
  return <>
    <div className={`safety-alert-controls ${role}`}>
      <button type="button" onClick={() => ready ? setSettings(!settings) : enable()}><Volume2 size={15}/>{ready ? '안전 알림 설정' : '소리·음성 알림 켜기'}</button>
      {!ready && <button type="button" onClick={() => setSettings(!settings)} aria-label="안전 알림 설정">설정</button>}
      {settings && <section className="safety-settings" aria-label="안전 알림 설정">
        <strong>안전 알림</strong>
        {[['sound','알림음'],['voice','한국어 음성 안내'],['vibration','진동']].map(([key,label]) => <label key={key}><input type="checkbox" checked={prefs[key]} disabled={key === 'vibration' && !vibrating || key === 'voice' && !speaking} onChange={event => setPrefs(value => ({ ...value, [key]: event.target.checked }))}/>{label}{key === 'vibration' && !vibrating ? ' · 이 기기 미지원' : ''}</label>)}
        <small>화면 알림은 항상 표시됩니다. 소리·음성은 이 화면에서 켠 뒤 사용할 수 있습니다.</small>
        <label>알림 테스트<select aria-label="알림 테스트 유형" value={testKind} onChange={event => setTestKind(event.target.value)}><option value="puddle">물웅덩이 주의</option><option value="health">건강 이상</option><option value="posture">휘청거림</option><option value="fall">추락·쓰러짐</option><option value="sos">SOS 긴급 요청</option></select></label>
        <button type="button" onClick={testAlert}>화면 알림 테스트</button>
        {ready && <button type="button" onClick={() => { setReady(false); audio.current?.suspend().catch(() => {}); }}>소리·음성·진동 끄기</button>}
      </section>}
      {mediaError && <small role="status">{mediaError}</small>}
    </div>
    {current && <div className={urgent ? 'safety-alert-backdrop' : 'safety-alert-position'}>
      <section ref={dialog} className={`safety-alert-card priority-${current.priority} ${role}`} role={urgent ? 'alertdialog' : 'dialog'} aria-modal={urgent || undefined} aria-label={title}
        onKeyDown={event => {
          if (event.key === 'Escape' && !urgent) dismiss();
          if (event.key === 'Tab' && urgent) {
            const focusable = [...event.currentTarget.querySelectorAll('button, a[href]')];
            const first = focusable[0], last = focusable[focusable.length-1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }
        }}>
        <header><span><ShieldAlert size={22}/>{current.test ? '알림 테스트' : urgent ? (role === 'admin' ? '긴급 · 현장 대응 필요' : '긴급 · 도움 요청') : current.priority === 2 ? (role === 'admin' ? '작업자 상태 확인 · 조치 필요' : '작업 중단 · 상태 확인') : (role === 'admin' ? '현장 위험 · 확인 필요' : '주의 · 위험요인 감지')}</span><button type="button" onClick={dismiss} aria-label="알림 확인 후 닫기"><X size={19}/></button></header>
        <h2>{title}</h2>
        <p className="safety-alert-action">{alertCopy(current.kind, role)[1]}</p>
        <dl><div><dt>작업자</dt><dd>{current.name || profile.name || '확인 필요'}</dd></div><div><dt>구역</dt><dd>{current.zone || '위치 확인 필요'}</dd></div><div><dt>발생 시각</dt><dd>{new Date(current.occurredAt).toLocaleString('ko-KR')}</dd></div></dl>
        <div className="safety-alert-buttons">
          {role === 'worker' && urgent && !current.test ? <button type="button" className="safety-rescue-button" disabled={sosBusy.current || sos.key === current.key && sos.done} onClick={requestRescue}>{sos.key === current.key && sos.pending ? '요청 전송 중…' : sos.key === current.key && sos.done ? '구조 요청 접수됨' : '관리자 구조 요청'}</button> : !current.test && <Link to={role === 'worker' ? workerTarget : current.target || '/notifications'} onClick={dismiss}>상세 확인</Link>}
          {role === 'worker' && urgent && !current.test && <a href="tel:119">119 전화 연결</a>}
          <button type="button" onClick={dismiss}>알림 확인</button>
        </div>
        {sos.key === current.key && sos.message && <p className="safety-alert-message" role="status">{sos.message}</p>}
        <small>{current.test ? '테스트 알림입니다. 실제 신고·사고 기록은 생성되지 않습니다.' : '알림 확인은 사고 처리 완료나 위험 해제를 의미하지 않습니다.'}</small>
        {!ready && <button className="safety-alert-enable" type="button" onClick={enable}><BellRing size={15}/>소리·음성·진동 켜기</button>}
        {queue.length > 1 && <small>대기 알림 {queue.length - 1}건 · 긴급 순으로 표시합니다.</small>}
      </section>
    </div>}
  </>;
}
