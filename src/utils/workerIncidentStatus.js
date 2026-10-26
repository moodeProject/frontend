// Open incidents affect the management attention badge, not live sensor readings.
// Match only server-owned worker identifiers to avoid assigning a coworker's alert.
const priority = { normal: 0, warning: 1, danger: 2 };
export function statusWithOpenIncidents(worker, detections = []) {
  if (!worker) return worker;
  const employeeNo = String(worker.employeeNumber || worker.employeeNo || worker.workerCode || '').trim();
  const workerId = String(worker.id || worker.workerId || '').trim();
  const open = detections.filter((event) => {
    const raw = event.rawEvent || {};
    const state = String(event.status || raw.status || '').toUpperCase();
    if (state === 'RESOLVED' || state === 'COMPLETED' || state === 'CLOSED' ||
        event.processClass === 'completed') return false;
    const eventNo = String(event.employeeNo || raw.worker?.employeeNo || '').trim();
    const eventId = String(event.workerId || raw.worker?.id || '').trim();
    return Boolean((employeeNo && eventNo && employeeNo === eventNo) ||
      (workerId && eventId && workerId === eventId));
  });
  const highest = open.reduce((max, event) => {
    const level = String(event.level || event.severity || event.rawEvent?.severity || '').toLowerCase();
    const severity = level === 'danger' ? 'danger' : 'warning';
    return priority[severity] > priority[max] ? severity : max;
  }, 'normal');
  if (priority[highest] <= priority[worker.status] || !open.length) return worker;
  return {
    ...worker,
    status: highest,
    issue: highest === 'danger' ? '미처리 위험 이벤트 확인 필요' : '미처리 주의 이벤트 확인 필요',
    unresolvedIncidentCount: open.length,
  };
}
