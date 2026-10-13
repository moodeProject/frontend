import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import '../styles/yoloDetectionVideo.css';

const LABELS = {
  person: '작업자',
  worker: '작업자',
  forklift: '지게차',
  truck: '트럭',
  car: '차량',
  vehicle: '차량',
  obstacle: '장애물',
  helmet: '안전모',
  hardhat: '안전모',
  no_helmet: '안전모 미착용',
  no_hardhat: '안전모 미착용',
  fire: '화재',
  smoke: '연기',
  puddle: '물웅덩이',
  wet_floor: '젖은 바닥',
  unguarded_edge: '난간 없는 구간',
};

function labelOf(box) {
  const raw =
    box?.label ??
    box?.className ??
    box?.class ??
    box?.name ??
    box?.type ??
    '객체';

  const key = String(raw)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  return LABELS[key] || raw;
}

function confidenceOf(box) {
  const value = Number(
    box?.confidence ??
    box?.score ??
    box?.probability
  );

  if (!Number.isFinite(value)) {
    return '';
  }

  return `${Math.round(
    value <= 1
      ? value * 100
      : value
  )}%`;
}

function bboxOf(box) {
  const raw =
    box?.bbox ??
    box?.box ??
    box?.xyxy;

  if (
    !Array.isArray(raw) ||
    raw.length < 4
  ) {
    return null;
  }

  const [
    x1,
    y1,
    x2,
    y2,
  ] = raw
    .slice(0, 4)
    .map(Number);

  if (
    ![
      x1,
      y1,
      x2,
      y2,
    ].every(Number.isFinite)
  ) {
    return null;
  }

  if (
    x2 <= x1 ||
    y2 <= y1
  ) {
    return null;
  }

  return {
    x1,
    y1,
    x2,
    y2,
  };
}

function clamp(
  value,
  min,
  max
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}

function pct(
  value,
  total
) {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return 0;
  }

  return clamp(
    (value / total) * 100,
    0,
    100
  );
}

export default function YoloDetectionVideo({
  src,
  boxes = [],
  frameWidth,
  frameHeight,
  markedOffsetSeconds,
  autoPlay = true,
}) {
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const markerHandledRef =
    useRef(false);

  const [
    intrinsicSize,
    setIntrinsicSize,
  ] = useState({
    width: 0,
    height: 0,
  });

  const [
    overlayRect,
    setOverlayRect,
  ] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const [
    currentTime,
    setCurrentTime,
  ] = useState(0);

  const [
    pausedAtDetection,
    setPausedAtDetection,
  ] = useState(false);

  const sourceWidth =
    Number(frameWidth) ||
    intrinsicSize.width;

  const sourceHeight =
    Number(frameHeight) ||
    intrinsicSize.height;

  const detectionOffset =
    Number(
      markedOffsetSeconds
    );

  const hasDetectionOffset =
    Number.isFinite(
      detectionOffset
    );

  const normalizedBoxes =
    useMemo(
      () =>
        boxes
          .map(
            (
              box,
              index
            ) => ({
              raw: box,
              bbox:
                bboxOf(box),
              index,
            })
          )
          .filter(
            (item) =>
              item.bbox
          ),
      [boxes]
    );

  const measureVideo =
    useCallback(() => {
      const stage =
        stageRef.current;

      const video =
        videoRef.current;

      if (
        !stage ||
        !video
      ) {
        return;
      }

      const stageRect =
        stage.getBoundingClientRect();

      const videoRect =
        video.getBoundingClientRect();

      setOverlayRect({
        left:
          videoRect.left -
          stageRect.left,
        top:
          videoRect.top -
          stageRect.top,
        width:
          videoRect.width,
        height:
          videoRect.height,
      });
    }, []);

  useEffect(() => {
    const video =
      videoRef.current;

    const stage =
      stageRef.current;

    if (
      !video ||
      !stage
    ) {
      return undefined;
    }

    measureVideo();

    const observer =
      new ResizeObserver(
        measureVideo
      );

    observer.observe(
      video
    );

    observer.observe(
      stage
    );

    window.addEventListener(
      'resize',
      measureVideo
    );

    return () => {
      observer.disconnect();

      window.removeEventListener(
        'resize',
        measureVideo
      );
    };
  }, [
    src,
    measureVideo,
  ]);

  useEffect(() => {
    const tick = () => {
      const video =
        videoRef.current;

      if (video) {
        const time =
          video.currentTime ||
          0;

        setCurrentTime(
          time
        );

        if (
          hasDetectionOffset &&
          !markerHandledRef.current &&
          !video.paused &&
          time >=
            detectionOffset -
              0.035
        ) {
          markerHandledRef.current =
            true;

          setPausedAtDetection(
            true
          );

          video.pause();

          try {
            video.currentTime =
              detectionOffset;
          } catch {
            // seek가 불가능한 브라우저에서는
            // 현재 프레임에서 일시정지 상태를 유지합니다.
          }
        }
      }

      rafRef.current =
        requestAnimationFrame(
          tick
        );
    };

    rafRef.current =
      requestAnimationFrame(
        tick
      );

    return () => {
      if (
        rafRef.current
      ) {
        cancelAnimationFrame(
          rafRef.current
        );
      }
    };
  }, [
    src,
    hasDetectionOffset,
    detectionOffset,
  ]);

  const showBoxes =
    normalizedBoxes.length >
      0 &&
    sourceWidth > 0 &&
    sourceHeight > 0 &&
    (
      !hasDetectionOffset ||
      pausedAtDetection ||
      Math.abs(
        currentTime -
          detectionOffset
      ) <= 0.16
    );

  const continuePlayback =
    async () => {
      const video =
        videoRef.current;

      if (!video) {
        return;
      }

      setPausedAtDetection(
        false
      );

      markerHandledRef.current =
        true;

      try {
        await video.play();
      } catch {
        // 브라우저 자동재생 제한 시
        // 사용자가 기본 video controls에서 재생할 수 있습니다.
      }
    };

  const replayDetection =
    async () => {
      const video =
        videoRef.current;

      if (
        !video ||
        !hasDetectionOffset
      ) {
        return;
      }

      markerHandledRef.current =
        false;

      setPausedAtDetection(
        false
      );

      try {
        video.currentTime =
          clamp(
            detectionOffset -
              0.8,
            0,
            Number.isFinite(
              video.duration
            )
              ? Math.max(
                  0,
                  video.duration -
                    0.05
                )
              : detectionOffset
          );

        await video.play();
      } catch {
        // 기본 controls로 재생 가능
      }
    };

  return (
    <div className="yolo-video-block">
      <div className="yolo-video-status">
        <span className="yolo-status-dot" />

        AI 서버 YOLO 감지 결과

        <b>
          {normalizedBoxes.length}
          건
        </b>
      </div>

      <div
        className="yolo-video-stage"
        ref={stageRef}
      >
        <video
          key={src}
          ref={videoRef}
          src={src}
          controls
          autoPlay={autoPlay}
          muted={autoPlay}
          playsInline
          onLoadedMetadata={(
            event
          ) => {
            const video =
              event.currentTarget;

            setIntrinsicSize({
              width:
                video.videoWidth ||
                0,
              height:
                video.videoHeight ||
                0,
            });

            markerHandledRef.current =
              false;

            setPausedAtDetection(
              false
            );

            if (
              hasDetectionOffset
            ) {
              const startTime =
                clamp(
                  detectionOffset -
                    0.8,
                  0,
                  Number.isFinite(
                    video.duration
                  )
                    ? Math.max(
                        0,
                        video.duration -
                          0.05
                      )
                    : detectionOffset
                );

              try {
                video.currentTime =
                  startTime;
              } catch {
                // metadata 직후 seek 불가 시 기본 시작 위치 사용
              }
            }

            requestAnimationFrame(
              measureVideo
            );
          }}
          onLoadedData={() => {
            requestAnimationFrame(
              measureVideo
            );
          }}
          onSeeked={(
            event
          ) => {
            const video =
              event.currentTarget;

            setCurrentTime(
              video.currentTime ||
                0
            );

            requestAnimationFrame(
              measureVideo
            );
          }}
          onSeeking={(
            event
          ) => {
            const time =
              event.currentTarget
                .currentTime ||
              0;

            if (
              hasDetectionOffset &&
              time <
                detectionOffset -
                  0.25
            ) {
              markerHandledRef.current =
                false;

              setPausedAtDetection(
                false
              );
            }
          }}
          onPlay={() => {
            setPausedAtDetection(
              false
            );
          }}
        />

        <div
          className="yolo-overlay"
          style={{
            left:
              overlayRect.left,
            top:
              overlayRect.top,
            width:
              overlayRect.width,
            height:
              overlayRect.height,
          }}
        >
          {showBoxes &&
            normalizedBoxes.map(
              (
                item
              ) => {
                const {
                  x1,
                  y1,
                  x2,
                  y2,
                } =
                  item.bbox;

                const label =
                  labelOf(
                    item.raw
                  );

                const confidence =
                  confidenceOf(
                    item.raw
                  );

                return (
                  <div
                    className="yolo-detection-box"
                    key={`${label}-${item.index}-${x1}-${y1}`}
                    style={{
                      left: `${pct(
                        x1,
                        sourceWidth
                      )}%`,
                      top: `${pct(
                        y1,
                        sourceHeight
                      )}%`,
                      width: `${pct(
                        x2 - x1,
                        sourceWidth
                      )}%`,
                      height: `${pct(
                        y2 - y1,
                        sourceHeight
                      )}%`,
                    }}
                  >
                    <span>
                      {label}

                      {confidence
                        ? ` ${confidence}`
                        : ''}
                    </span>
                  </div>
                );
              }
            )}

          {hasDetectionOffset &&
            pausedAtDetection && (
              <div className="yolo-freeze-badge">
                AI 감지 프레임 ·{' '}
                {detectionOffset.toFixed(
                  2
                )}
                초
              </div>
            )}
        </div>
      </div>

      <div className="yolo-video-meta">
        <div>
          <span>
            기준 프레임{' '}
            {sourceWidth >
              0 &&
            sourceHeight >
              0
              ? `${sourceWidth} × ${sourceHeight}`
              : '확인 중'}
          </span>

          <span>
            bbox [x1, y1, x2,
            y2] 비율 환산
          </span>
        </div>

        {hasDetectionOffset && (
          <div className="yolo-video-actions">
            <button
              type="button"
              onClick={
                replayDetection
              }
            >
              감지 구간 다시 보기
            </button>

            {pausedAtDetection && (
              <button
                type="button"
                className="primary"
                onClick={
                  continuePlayback
                }
              >
                계속 재생
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
