import profile01 from '../assets/worker-profiles/worker-profile-01.jpg';
import profile02 from '../assets/worker-profiles/worker-profile-02.jpg';
import profile03 from '../assets/worker-profiles/worker-profile-03.jpg';
import profile04 from '../assets/worker-profiles/worker-profile-04.jpg';
import profile05 from '../assets/worker-profiles/worker-profile-05.jpg';
import profile06 from '../assets/worker-profiles/worker-profile-06.jpg';

const DEFAULT_WORKER_PROFILES = {
  'H-001': profile01,
  'H-002': profile02,
  'H-003': profile03,
  'H-004': profile04,
  'H-005': profile05,
  'H-006': profile06,
};

export function getDefaultWorkerProfile(workerOrHelmetId) {
  const key =
    typeof workerOrHelmetId === 'string'
      ? workerOrHelmetId
      : workerOrHelmetId?.helmetId ||
        workerOrHelmetId?.helmetNo ||
        workerOrHelmetId?.id ||
        '';

  return DEFAULT_WORKER_PROFILES[String(key)] || '';
}

export { DEFAULT_WORKER_PROFILES };
