// Use exact server identifiers; H-001 is a helmet number, not a device ID.
export function bindWorkerHelmet(worker, helmets = []) {
  const id = String(worker.id ?? worker.workerId ?? '');
  const helmet = helmets.find(item => id &&
    String(item.workerId ?? item.worker?.id ?? '') === id);
  return {
    ...worker,
    helmetId: helmet ? String(helmet.helmetNo ?? helmet.helmetNumber ?? '') : '',
    helmetNo: helmet ? String(helmet.helmetNo ?? helmet.helmetNumber ?? '') : '',
    helmetDbId: helmet?.id ?? helmet?.helmetId ?? null,
    deviceId: helmet ? String(helmet.deviceId ?? '') : '',
  };
}

// A registered helmet row can exist without any measurement.
export function measuredStatus(row) {
  return row?.recordedAt ? row : null;
}
