export function getWorkerDeviceId(profile) {
  if (profile?.deviceId) return String(profile.deviceId);

  const helmetNo = String(
    profile?.helmetNo || profile?.helmetId || ''
  ).trim();

  if (/^H-\d+$/i.test(helmetNo)) {
    return helmetNo.replace(/^H-/i, 'DEV-');
  }

  return '';
}

export function detectionBelongsToWorker(item, profile) {
  if (!item || !profile) return false;

  const raw = item.rawEvent || {};

  const eventWorkerName =
    item.name ||
    raw?.worker?.name ||
    raw?.workerName;

  const eventEmployeeNo =
    item.employeeNo ||
    raw?.worker?.employeeNo;

  const eventHelmetNo =
    item.helmetNo ||
    raw?.helmetNo;

  const profileName = profile.name;
  const profileEmployeeNo = profile.employeeNo;
  const profileHelmetNo =
    profile.helmetNo || profile.helmetId;

  return Boolean(
    (profileEmployeeNo &&
      eventEmployeeNo &&
      String(profileEmployeeNo) === String(eventEmployeeNo)) ||
      (profileHelmetNo &&
        eventHelmetNo &&
        String(profileHelmetNo) === String(eventHelmetNo)) ||
      (profileName &&
        eventWorkerName &&
        String(profileName) === String(eventWorkerName))
  );
}

export function isNormalState(value) {
  return String(value || '').toUpperCase() === 'NORMAL';
}

export function sensorUiStatus(sensor) {
  if (!sensor) {
    return {
      key: 'unknown',
      label: '데이터 없음',
      description: '최신 센서 데이터가 아직 없습니다.',
    };
  }

  const fallNormal = isNormalState(sensor.fallState);
  const healthNormal = isNormalState(sensor.healthState);
  const posture = String(sensor.posture || '').toUpperCase();
  const postureAbnormal =
    sensor.postureAbnormal === true ||
    String(sensor.postureAbnormal).toLowerCase() === 'true';

  if (!fallNormal) {
    return {
      key: 'danger',
      label: '위험',
      description: '추락 이상 상태가 감지되었습니다.',
    };
  }

  if (postureAbnormal && posture === 'COLLAPSE') {
    return {
      key: 'danger',
      label: '위험',
      description: '쓰러짐 자세가 감지되었습니다.',
    };
  }

  if (!healthNormal) {
    return {
      key: 'warning',
      label: '주의',
      description: '건강 이상 상태가 감지되었습니다.',
    };
  }

  if (postureAbnormal) {
    return {
      key: 'warning',
      label: '주의',
      description:
        posture === 'STUMBLE'
          ? '휘청거림이 감지되었습니다.'
          : '자세 이상이 감지되었습니다.',
    };
  }

  return {
    key: 'normal',
    label: '정상',
    description: '현재 센서 상태가 정상입니다.',
  };
}

export function formatSensorTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}


export function postureLabel(value) {
  const posture = String(value || '').toUpperCase();

  return {
    STABLE: '정상 자세',
    STUMBLE: '휘청거림',
    COLLAPSE: '쓰러짐',
  }[posture] || '확인 필요';
}

export function postureTone(sensor) {
  if (!sensor) return 'unknown';

  const posture = String(sensor.posture || '').toUpperCase();
  const abnormal =
    sensor.postureAbnormal === true ||
    String(sensor.postureAbnormal).toLowerCase() === 'true';

  if (!abnormal) return 'normal';
  if (posture === 'COLLAPSE') return 'danger';
  return 'warning';
}

export function isPostureAbnormal(sensor) {
  return Boolean(
    sensor &&
      (
        sensor.postureAbnormal === true ||
        String(sensor.postureAbnormal).toLowerCase() === 'true'
      )
  );
}
