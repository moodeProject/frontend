export const WORKER_PROFILE_KEY = 'safehelmet_worker_profile';
export const WORKER_SESSION_KEY = 'safehelmet_worker_session';

export const defaultWorkerProfile = {
  employeeNo: 'WK-20241103',
  name: '김현석',
  email: 'kimhs@safehelmet.kr',
  phone: '010-2486-1103',
  department: '현장 안전팀',
  emergencyContact: '010-0000-1190',
  location: 'B구역 3층',
  helmetNo: 'H-002',
  helmetConnected: true,
  sensorConnected: true,
  password: '1234',
  photo: '',
};

export function getWorkerProfile() {
  let saved = {};
  let session = {};
  try { saved = JSON.parse(localStorage.getItem(WORKER_PROFILE_KEY) || '{}'); } catch { saved = {}; }
  try { session = JSON.parse(localStorage.getItem(WORKER_SESSION_KEY) || '{}'); } catch { session = {}; }
  const profile = {
    ...defaultWorkerProfile,
    ...saved,
    employeeNo: saved.employeeNo || session.employeeNo || defaultWorkerProfile.employeeNo,
    name: saved.name || session.name || defaultWorkerProfile.name,
  };
  return profile;
}

export function saveWorkerProfile(profile) {
  localStorage.setItem(WORKER_PROFILE_KEY, JSON.stringify(profile));
  const session = { employeeNo: profile.employeeNo, name: profile.name };
  localStorage.setItem(WORKER_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent('safehelmet-worker-profile-updated', { detail: profile }));
}

export function ensureWorkerProfile() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(WORKER_PROFILE_KEY) || '{}'); } catch { saved = {}; }
  const profile = Object.keys(saved).length ? { ...defaultWorkerProfile, ...saved } : { ...defaultWorkerProfile };
  localStorage.setItem(WORKER_PROFILE_KEY, JSON.stringify(profile));
  return profile;
}
