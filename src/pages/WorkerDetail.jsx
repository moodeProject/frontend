import { statusWithOpenIncidents } from '../utils/workerIncidentStatus';
import {
  Activity,
  ArrowDownRight,
  Camera,
  ChevronLeft,
  Cpu,
  HardHat,
  Heart,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Save,
  Trash2,
  Wifi,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';
import ActionToast from '../components/ActionToast';
import DeleteWorkerModal from '../components/DeleteWorkerModal';
import StatusBadge from '../components/StatusBadge';
import TopHeader from '../components/TopHeader';
import { useWorkers } from '../context/WorkerContext';
import { useDetections } from '../context/DetectionContext';
import {
  deleteWorkerApi,
  getWorker,
  updateWorkerApi,
} from '../api/workers';
import {
  getWorkerStatus,
} from '../api/workerStatus';
import {
  postureLabel,
  postureTone,
} from '../utils/workerRealtime';
import {
  getSavedWorkerProfileImage,
  optimizeProfileImageFile,
  saveWorkerProfileImage,
} from '../utils/workerProfileImageStorage';
import '../styles/workerProfileImageSave.css';
import '../styles/workerPersonalHeatRisk.css';

const labels = {
  normal: '정상',
  warning: '주의',
  danger: '위험',
};

function isAbnormal(value) {
  return (
    Boolean(value) &&
    String(value).toUpperCase() !==
      'NORMAL'
  );
}

function statusPatchFromSensor(
  worker,
  sensor
) {
  if (!sensor) return {};

  const fallAbnormal =
    isAbnormal(
      sensor?.fallState
    );

  const healthAbnormal =
    isAbnormal(
      sensor?.healthState
    );

  const posture =
    String(
      sensor?.posture || ''
    ).toUpperCase();

  const postureAbnormal =
    sensor?.postureAbnormal ===
      true ||
    String(
      sensor?.postureAbnormal
    ).toLowerCase() ===
      'true';

  let status = 'normal';
  let issue =
    '정상 작업 중';

  if (fallAbnormal) {
    status = 'danger';
    issue = '추락 감지됨';
  } else if (
    postureAbnormal &&
    posture === 'COLLAPSE'
  ) {
    status = 'danger';
    issue = '쓰러짐 감지';
  } else if (
    healthAbnormal
  ) {
    status = 'warning';
    issue = `건강 이상 · ${
      sensor.healthState
    }`;
  } else if (
    postureAbnormal
  ) {
    status = 'warning';
    issue =
      posture === 'STUMBLE'
        ? '휘청거림 감지'
        : '자세 이상 감지';
  }

  const heartRate =
    sensor?.heartRate ===
      null
      ? null
      : Number(
          sensor?.heartRate
        );

  return {
    deviceId:
      sensor?.deviceId ||
      worker.deviceId,
    status,
    issue,
    heartRate: Number.isFinite(heartRate) && heartRate > 0 ? heartRate : null,
    spo2:
      sensor?.spo2 === null
        ? null
        : sensor?.spo2 ??
          null,
    fallState:
      sensor?.fallState ??
      worker.fallState,
    healthState:
      sensor?.healthState ??
      worker.healthState,
    fallConfidence:
      sensor?.fallConfidence ??
      worker.fallConfidence,
    posture:
      sensor?.posture ??
      worker.posture,
    postureAbnormal:
      sensor?.postureAbnormal ??
      worker.postureAbnormal ??
      false,
    recordedAt:
      sensor?.recordedAt ??
      worker.recordedAt,
    ax:
      sensor?.ax ??
      worker.ax,
    ay:
      sensor?.ay ??
      worker.ay,
    az:
      sensor?.az ??
      worker.az,
    gx:
      sensor?.gx ??
      worker.gx,
    gy:
      sensor?.gy ??
      worker.gy,
    gz:
      sensor?.gz ??
      worker.gz,
    sensorConnected: true,
    serverDataConnected: true,
  };
}

function readBlock(
  worker,
  names
) {
  for (const name of names) {
    if (
      worker?.[name] !==
        undefined &&
      worker?.[name] !== null
    ) {
      return worker[name];
    }
  }

  return null;
}

function blockText(
  block,
  fallback
) {
  if (
    typeof block === 'string'
  ) {
    return block;
  }

  return (
    block?.message ??
    block?.summary ??
    block?.description ??
    block?.label ??
    block?.state ??
    fallback
  );
}

function blockLevel(
  block,
  fallback = 'normal'
) {
  const value =
    String(
      block?.severity ??
        block?.status ??
        block?.level ??
        ''
    ).toUpperCase();

  if (
    value.includes('DANGER') ||
    value.includes('CRITICAL') ||
    value.includes('HIGH')
  ) {
    return 'danger';
  }

  if (
    value.includes('CAUTION') ||
    value.includes('WARNING') ||
    value.includes('MEDIUM')
  ) {
    return 'warning';
  }

  return fallback;
}

function personalHeatRiskLabel(worker) {
  const level = String(
    worker?.heatRiskLevel || ''
  ).toUpperCase();

  if (level === 'DANGER') return '위험';
  if (level === 'CAUTION') return '주의';
  if (level === 'NORMAL') return '정상';

  if (worker?.heatRiskAbnormal) return '주의';

  return '데이터 대기';
}

function StatusCard({
  type,
  level,
  title,
  value,
  worker,
}) {
  const icons = {
    external: Package,
    health: Heart,
    fall: ArrowDownRight,
  };

  const Icon =
    icons[type];

  const movementTone =
    postureTone(worker);
  const receivedAt = worker?.recordedAt ? new Date(worker.recordedAt).getTime() : NaN;
  const recentSensor = worker?.sensorConnected === true && Number.isFinite(receivedAt) && Date.now() - receivedAt >= -30000 && Date.now() - receivedAt < 30000;

  return (
    <section
      className={`worker-status-card ${level}`}
    >
      <div className="worker-status-title">
        <span
          className={`status-card-icon ${level}`}
        >
          <Icon size={18} />
        </span>

        <strong>
          {title}
        </strong>
      </div>

      <StatusBadge
        level={level}
      >
        {labels[level]}
      </StatusBadge>

      {type ===
      'health' ? (
        <>
          <strong
            className={`status-card-value ${level}`}
          >
            {Number(worker.heartRate) > 0 && worker.serverDataConnected ? worker.heartRate : '-'}{' '}
            bpm
          </strong>

          <div className="detail-fatigue">
            <div
              className={`fatigue-bar level-${
                worker.fatigue ||
                0
              }`}
            >
              <i />
              <i />
              <i />
            </div>

            <b>
              {worker.sensorConnected && worker.fatigue ? worker.fatigue : '측정 대기'}
              {worker.fatigue ? '단계' : ''}
            </b>
          </div>

          <div className="detail-personal-heat-risk">
            <span>개인 온열질환 위험도</span>
            <b>
              {worker.heatRiskDataConnected ? personalHeatRiskLabel(worker) : '측정 대기'}
            </b>
          </div>

          {worker.serverDataConnected && Number(worker.hrv) > 0 && (
            <div className="detail-personal-heat-risk">
              <span>HRV</span>
              <b>
                {Number(worker.hrv).toFixed(1)}
              </b>
            </div>
          )}
        </>
      ) : type ===
        'fall' ? (
        <>
          <strong
            className={`status-card-value ${level}`}
          >
            {value}
          </strong>

          <div
            className={`detail-posture-state ${movementTone}`}
          >
            <Activity
              size={14}
            />
            <span>
              움직임
            </span>
            <b>
              {recentSensor
                ? postureLabel(
                    worker.posture
                  )
                : '데이터 대기'}
            </b>
          </div>
        </>
      ) : (
        <strong
          className={`status-card-value ${level}`}
        >
          {value}
        </strong>
      )}
    </section>
  );
}

export default function WorkerDetail() {
  const { detections } = useDetections();
  const { workerId } =
    useParams();

  const navigate =
    useNavigate();

  const {
    workers: liveWorkers,
    updateWorker:
      updateLocalWorker,
    deleteWorker:
      deleteLocalWorker,
  } = useWorkers();

  const decodedId =
    decodeURIComponent(
      workerId
    );

  const liveWorker =
    liveWorkers.find(
      (item) =>
        String(item.id) ===
          String(
            decodedId
          ) ||
        String(
          item.workerId ||
            ''
        ) ===
          String(
            decodedId
          )
    );

  const [
    serverWorker,
    setServerWorker,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);
  const [nowMs, setNowMs] = useState(Date.now());

  const [error, setError] =
    useState('');

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);

  const [
    imageError,
    setImageError,
  ] = useState('');

  const [
    pendingProfileImage,
    setPendingProfileImage,
  ] = useState('');

  const [
    imageDirty,
    setImageDirty,
  ] = useState(false);

  const [toast, setToast] =
    useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  const imageInput =
    useRef(null);

  const savedProfileImage =
    useMemo(
      () =>
        getSavedWorkerProfileImage({
          ...(liveWorker || {}),
          ...(serverWorker || {}),
          id:
            serverWorker?.id ||
            liveWorker?.id ||
            decodedId,
        }),
      [
        decodedId,
        liveWorker,
        serverWorker,
      ]
    );

  const worker =
    useMemo(
      () => statusWithOpenIncidents({
        ...(serverWorker || {}),
        ...(liveWorker || {}),
        profileImage:
          pendingProfileImage ||
          savedProfileImage ||
          liveWorker?.profileImage ||
          serverWorker?.profileImage ||
          '',
      }, detections),
      [
        liveWorker,
        serverWorker,
        pendingProfileImage,
        savedProfileImage,
        detections,
      ]
    );

  const loadDetail =
    useCallback(async () => {
      setLoading(true);
      setError('');

      try {
        const detail =
          await getWorker(
            decodedId
          );

        let merged =
          detail;

        if (
          detail?.deviceId
        ) {
          try {
            const sensor =
              await getWorkerStatus(
                detail.deviceId
              );

            merged = {
              ...detail,
              ...statusPatchFromSensor(
                detail,
                sensor
              ),
            };
          } catch (
            sensorError
          ) {
            console.warn(
              '작업자 센서 상세 조회 실패:',
              sensorError
            );
          }
        }

        setServerWorker(
          merged
        );

        return merged;
      } catch (err) {
        console.error(
          '작업자 상세 API 조회 실패:',
          err
        );

        setError(
          err?.message ||
            '작업자 상세 정보를 불러오지 못했습니다.'
        );

        throw err;
      } finally {
        setLoading(false);
      }
    }, [decodedId]);

  useEffect(() => {
    loadDetail().catch(() => {});
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [loadDetail]);

  if (
    loading &&
    !serverWorker &&
    !liveWorker
  ) {
    return (
      <>
        <TopHeader
          title="작업자 상태"
          subtitle="전체 작업자 현황"
        />

        <div className="page-body">
          <div className="panel worker-not-found">
            작업자 상세 정보를
            불러오는 중입니다.
          </div>
        </div>
      </>
    );
  }

  if (
    !worker?.id &&
    error
  ) {
    return (
      <>
        <TopHeader
          title="작업자 상태"
          subtitle="전체 작업자 현황"
        />

        <div className="page-body">
          <div className="panel worker-not-found">
            {error}

            <Link to="/workers">
              작업자 목록으로
            </Link>
          </div>
        </div>
      </>
    );
  }

  const externalBlock =
    readBlock(worker, [
      'external',
      'externalFactor',
      'externalStatus',
      'externalBlock',
    ]);

  const healthBlock =
    readBlock(worker, [
      'health',
      'healthStatus',
      'healthBlock',
    ]);

  const fallBlock =
    readBlock(worker, [
      'fall',
      'fallStatus',
      'fallBlock',
    ]);

  const movementTone =
    postureTone(worker);

  const fallDetected =
    worker.status ===
      'danger' &&
    String(
      worker.issue || ''
    ).includes('추락');

  const externalLevel =
    blockLevel(
      externalBlock,
      'normal'
    );

  const healthLevel = blockLevel(healthBlock, worker.sensorConnected ? (worker.status === 'warning' ? 'warning' : 'normal') : 'normal');
  const receivedMs = worker.recordedAt ? new Date(worker.recordedAt).getTime() : NaN;
  const ageSeconds = Number.isFinite(receivedMs) ? Math.max(0, Math.floor((nowMs - receivedMs) / 1000)) : null;
  const recentSensor = worker.sensorConnected === true && ageSeconds !== null && ageSeconds <= 30;
  const validHeartRate = recentSensor && Number(worker.heartRate) > 0;
  const validSpo2 = recentSensor && Number(worker.spo2) > 0;
  const validHrv = recentSensor && Number(worker.hrv) > 0;

  const fallLevel =
    blockLevel(
      fallBlock,
      fallDetected
        ? 'danger'
        : movementTone ===
            'danger'
          ? 'danger'
          : movementTone ===
              'warning'
            ? 'warning'
            : 'normal'
    );

  const changeImage =
    async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) return;

      if (
        !file.type.startsWith(
          'image/'
        )
      ) {
        setImageError(
          '이미지 파일만 선택해 주세요.'
        );
        return;
      }

      if (
        file.size >
        8 * 1024 * 1024
      ) {
        setImageError(
          '8MB 이하 이미지를 선택해 주세요.'
        );
        return;
      }

      try {
        const profileImage =
          await optimizeProfileImageFile(
            file
          );

        setPendingProfileImage(
          profileImage
        );
        setImageDirty(true);
        setImageError('');
      } catch (err) {
        console.error(
          '프로필 이미지 처리 실패:',
          err
        );
        setImageError(
          '이미지를 처리하지 못했습니다. 다른 이미지를 선택해 주세요.'
        );
      } finally {
        event.target.value = '';
      }
    };

  const saveProfileImage =
    () => {
      if (
        !imageDirty ||
        !pendingProfileImage
      ) {
        return;
      }

      try {
        saveWorkerProfileImage(
          worker,
          pendingProfileImage
        );

        if (liveWorker?.id) {
          updateLocalWorker(
            liveWorker.id,
            {
              profileImage:
                pendingProfileImage,
            }
          );
        }

        setServerWorker(
          (prev) => ({
            ...(prev || {}),
            profileImage:
              pendingProfileImage,
          })
        );

        setImageDirty(false);
        setImageError('');
        setToast(
          '프로필 사진이 저장되었습니다.'
        );
      } catch (err) {
        console.error(
          '프로필 이미지 저장 실패:',
          err
        );

        setImageError(
          err?.message ||
            '프로필 사진 저장에 실패했습니다.'
        );
      }
    };

  const saveWorkerName = async () => {
    const name = nameDraft.trim();
    if (!name) { setToast('이름을 입력해주세요.'); return; }
    if (savingName) return;
    setSavingName(true);
    try {
      const updated = await updateWorkerApi(decodedId, {
        name,
        zoneName: worker.zoneName || worker.zone || '',
        detailLocation: worker.detailLocation || '',
      });
      updateLocalWorker(decodedId, { name: updated?.name || name });
      setServerWorker(previous => ({ ...(previous || {}), name: updated?.name || name }));
      setEditingName(false);
      setToast('서버 작업자 이름이 변경되었습니다.');
    } catch (error) {
      setToast(`이름 변경 실패: ${error?.message || '서버 요청을 확인해주세요.'}`);
    } finally {
      setSavingName(false);
    }
  };

  const handleDelete =
    async () => {
      try {
        await deleteWorkerApi(
          decodedId
        );

        if (
          liveWorker?.id
        ) {
          deleteLocalWorker(
            liveWorker.id
          );
        }

        setDeleteOpen(false);

        navigate(
          '/workers'
        );
      } catch (err) {
        setDeleteOpen(false);

        setToast(
          err?.message ||
            '작업자 삭제에 실패했습니다.'
        );
      }
    };

  return (
    <>
      <TopHeader
        title="작업자 상태"
        subtitle="전체 작업자 현황"
        onRefresh={
          loadDetail
        }
      />

      <div className="page-body worker-detail-page">
        <div className="worker-detail-actions">
          <Link
            className="detail-back"
            to="/workers"
          >
            <ChevronLeft
              size={16}
            />
            작업자 목록
          </Link>

          <div className="worker-detail-action-buttons">
            <button
              className="reconnect-worker-helmet-btn"
              onClick={
                loadDetail
              }
            >
              <RefreshCw
                size={14}
              />
              최신 상태
            </button>

            <button
              className="delete-worker-btn"
              onClick={() =>
                setDeleteOpen(
                  true
                )
              }
            >
              <Trash2
                size={14}
              />
              작업자 삭제
            </button>
          </div>
        </div>

        <div className="worker-filter-banner" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <strong style={{ color: recentSensor ? '#13865a' : '#c26c14' }}>{recentSensor ? '● 실시간 수신 중' : ageSeconds == null ? '● 센서 데이터 없음' : '● 수신 지연'}</strong>
          <span>자동 조회 5초 간격 · 상태 시계 1초 간격</span>
          <span>마지막 수신 {worker.recordedAt ? new Date(worker.recordedAt).toLocaleString('ko-KR') : '기록 없음'}{ageSeconds != null ? ` (${ageSeconds}초 전)` : ''}</span>
        </div>
        {error && (
          <div className="worker-filter-banner danger">
            {error}
          </div>
        )}

        <section className="panel worker-profile-panel">
          <div
            className={`detail-profile-avatar ${
              worker.status ||
              'normal'
            }`}
            onClick={() =>
              imageInput.current?.click()
            }
            title="프로필 사진 변경"
          >
            {worker.profileImage ? (
              <img
                src={
                  worker.profileImage
                }
                alt={`${worker.name} 프로필`}
              />
            ) : (
              <span>
                {String(
                  worker.name ||
                    '작'
                ).slice(
                  0,
                  1
                )}
              </span>
            )}

            <span className="detail-avatar-dot" />
            <span className="photo-edit-badge">
              <Camera
                size={12}
              />
            </span>
          </div>

          <input
            ref={imageInput}
            className="hidden-file-input"
            type="file"
            accept="image/*"
            onChange={
              changeImage
            }
          />

          <div className="worker-profile-copy">
            <div className="profile-name-row">
              {editingName ? (
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                  <input value={nameDraft} onChange={e => setNameDraft(e.target.value)} maxLength={50} aria-label="작업자 이름" style={{minWidth:140,maxWidth:220,minHeight:34,border:'1px solid #b6c5df',borderRadius:8,padding:'6px 10px'}} />
                  <button type="button" disabled={savingName || !nameDraft.trim()} onClick={saveWorkerName} style={{padding:'7px 11px',borderRadius:8,border:'1px solid #1767ff',background:'#1767ff',color:'#fff',cursor:'pointer'}}>{savingName ? '저장 중' : '저장'}</button>
                  <button type="button" disabled={savingName} onClick={() => setEditingName(false)} style={{padding:'7px 10px',borderRadius:8,border:'1px solid #dce3ee',background:'#fff',cursor:'pointer'}}>취소</button>
                </div>
              ) : (
                <>
                  <h2>{worker.name}</h2>
                  <button type="button" onClick={() => {setNameDraft(worker.name || '');setEditingName(true);}} style={{border:'1px solid #dce3ee',background:'#fff',borderRadius:8,padding:'6px 10px',fontSize:12,color:'#1767ff',cursor:'pointer'}}>이름 변경</button>
                </>
              )}

              <StatusBadge
                level={
                  worker.status ||
                  'normal'
                }
              >
                {
                  labels[
                    worker.status
                  ] || '정상'
                }
              </StatusBadge>
            </div>

            <div className="worker-meta-row">
              <span>
                <Cpu
                  size={13}
                />
                사번{' '}
                {worker.employeeNumber ||
                  worker.workerCode ||
                  '-'}
              </span>

              <span>
                <MapPin
                  size={13}
                />
                {worker.zone ||
                  worker.zoneName ||
                  '위치 미확인'}
              </span>

              <span>
                <HardHat
                  size={13}
                />
                {worker.helmetId ||
                  '-'}
              </span>

              <span>
                <Phone
                  size={13}
                />
                {worker.phone ||
                  '연락처 미등록'}
              </span>

              <span
                className={
                  recentSensor
                    ? 'sensor-ok'
                    : 'sensor-waiting'
                }
              >
                <Wifi
                  size={13}
                />
                {recentSensor
                  ? '최근 자세·동작 데이터 수신됨'
                  : '서버 센서 데이터 대기'}
              </span>

              {worker.deviceId && (
                <span>
                  <Cpu
                    size={13}
                  />
                  {
                    worker.deviceId
                  }
                </span>
              )}

              {validSpo2 && (
                  <span>
                    SpO₂{' '}
                    {worker.spo2}
                  </span>
                )}
            </div>

            <div className="profile-photo-action-row">
              <button
                className="change-photo-text"
                type="button"
                onClick={() =>
                  imageInput.current?.click()
                }
              >
                <Camera
                  size={12}
                />
                프로필 사진 변경
              </button>

              <button
                className="save-profile-photo-btn"
                type="button"
                onClick={
                  saveProfileImage
                }
                disabled={
                  !imageDirty
                }
              >
                <Save
                  size={13}
                />
                저장
              </button>

              {imageDirty && (
                <small className="profile-image-unsaved">
                  저장 전
                </small>
              )}
            </div>

            {imageError && (
              <small className="profile-image-error">
                {imageError}
              </small>
            )}
          </div>
        </section>

        <div className="worker-status-grid">
          <StatusCard
            type="external"
            title="외부요인"
            level={
              externalLevel
            }
            value={blockText(
              externalBlock,
              externalLevel ===
                'normal'
                ? '위험 요소 없음'
                : worker.issue
            )}
            worker={worker}
          />

          <StatusCard
            type="health"
            title="건강"
            level={
              healthLevel
            }
            value={blockText(
              healthBlock,
              ''
            )}
            worker={worker}
          />

          <StatusCard
            type="fall"
            title="추락"
            level={
              fallLevel
            }
            value={blockText(
              fallBlock,
              fallDetected
                ? '추락 감지됨'
                : worker.postureAbnormal
                  ? '자세 이상 감지'
                  : recentSensor && worker.fallState === 'NORMAL'
                  ? '감지 없음'
                  : '데이터 대기'
            )}
            worker={worker}
          />
        </div>

        <section className="panel" style={{ marginTop: 20, padding: 24 }} aria-label="최근 실측 센서 데이터">
          <h3 style={{ margin: '0 0 12px' }}>최근 실측 센서 데이터</h3>
          <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 13 }}>
            마지막 수신: {worker.recordedAt ? new Date(worker.recordedAt).toLocaleString('ko-KR') : '기록 없음'}{ageSeconds != null ? ` · ${ageSeconds}초 전` : ''} · {recentSensor ? '최근 30초 이내' : '수신 지연 또는 데이터 없음'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12 }}>
            {[
              ['심박수', validHeartRate ? `${worker.heartRate} bpm` : '측정 대기'],
              ['산소포화도', validSpo2 ? `${worker.spo2}%` : '측정 대기'],
              ['HRV', validHrv ? Number(worker.hrv).toFixed(1) : '측정 대기'],
              ['가속도 X / Y / Z', recentSensor && [worker.ax, worker.ay, worker.az].every(v => v != null) ? [worker.ax, worker.ay, worker.az].join(' / ') : '데이터 대기'],
              ['자이로 X / Y / Z', recentSensor && [worker.gx, worker.gy, worker.gz].every(v => v != null) ? [worker.gx, worker.gy, worker.gz].join(' / ') : '데이터 대기'],
              ['자세', recentSensor && worker.posture ? postureLabel(worker.posture) : '데이터 대기'],
              ['추락 판정', recentSensor && worker.fallState ? worker.fallState : '데이터 대기'],
              ['추락 신뢰도', recentSensor && worker.fallConfidence != null ? String(worker.fallConfidence) : '데이터 대기'],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#f7f9fc', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
                <strong style={{ display: 'block', marginTop: 6, fontSize: 14 }}>{value}</strong>
              </div>
            ))}
          </div>
          <p style={{ margin: '12px 0 0', color: '#64748b', fontSize: 12 }}>0으로 전송된 생체신호는 유효한 측정값으로 간주하지 않습니다.</p>
        </section>
      </div>

      <DeleteWorkerModal
        worker={worker}
        open={deleteOpen}
        onClose={() =>
          setDeleteOpen(false)
        }
        onDelete={
          handleDelete
        }
      />

      <ActionToast
        message={toast}
        onClose={() =>
          setToast('')
        }
      />
    </>
  );
}
