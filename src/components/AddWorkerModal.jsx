import {
  X,
} from 'lucide-react';
import {
  useState,
} from 'react';

const emptyForm = {
  name: '',
  zone: 'A구역',
  floor: '',
  helmetNo: '',
};

function FieldLabel({
  children,
  optional,
  helper,
}) {
  return (
    <span className="form-label-line">
      <span>{children}</span>

      {optional && (
        <small>(선택)</small>
      )}

      {helper && (
        <small>{helper}</small>
      )}
    </span>
  );
}

function buildZoneName(
  zone,
  floor
) {
  const base = zone.trim();
  const detail = floor.trim();

  if (!detail) return base;

  if (
    detail.includes('구역')
  ) {
    return detail;
  }

  return `${base} ${detail}`.trim();
}

export default function AddWorkerModal({
  open,
  onClose,
  onAdd,
}) {
  const [form, setForm] =
    useState(emptyForm);

  const [error, setError] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  if (!open) return null;

  const close = () => {
    if (submitting) return;

    setForm(emptyForm);
    setError('');
    onClose();
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError(
        '작업자 이름을 입력해 주세요.'
      );
      return;
    }

    const zoneName =
      buildZoneName(
        form.zone,
        form.floor
      );

    setSubmitting(true);
    setError('');

    try {
      await onAdd({
        name:
          form.name.trim(),
        zoneName,
        helmetNo:
          form.helmetNo.trim() ||
          undefined,
      });

      close();
    } catch (err) {
      setError(
        err?.message ||
          '작업자 등록에 실패했습니다.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) =>
        e.target ===
          e.currentTarget &&
        close()
      }
    >
      <form
        className="worker-modal add-worker-modal"
        onSubmit={submit}
      >
        <button
          className="modal-close"
          type="button"
          onClick={close}
          aria-label="닫기"
        >
          <X size={17} />
        </button>

        <div className="modal-heading">
          <h2>작업자 추가</h2>
          <p>
            새 작업자를 서버에
            등록합니다.
          </p>
        </div>

        <label className="form-field form-field-full">
          <FieldLabel>
            이름 <b>*</b>
          </FieldLabel>

          <input
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name:
                  e.target.value,
              })
            }
            placeholder="예: 홍길동"
          />
        </label>

        <div className="form-grid-2 aligned-form-grid">
          <label className="form-field">
            <FieldLabel>
              소속 구역
            </FieldLabel>

            <select
              value={form.zone}
              onChange={(e) =>
                setForm({
                  ...form,
                  zone:
                    e.target.value,
                })
              }
            >
              <option>A구역</option>
              <option>B구역</option>
              <option>C구역</option>
            </select>
          </label>

          <label className="form-field">
            <FieldLabel
              optional
              helper="예: 3층"
            >
              층
            </FieldLabel>

            <input
              value={form.floor}
              onChange={(e) =>
                setForm({
                  ...form,
                  floor:
                    e.target.value,
                })
              }
              placeholder="예: 3층"
            />
          </label>
        </div>

        <label className="form-field form-field-full">
          <FieldLabel optional>
            헬멧 번호
          </FieldLabel>

          <input
            value={form.helmetNo}
            onChange={(e) =>
              setForm({
                ...form,
                helmetNo:
                  e.target.value,
              })
            }
            placeholder="예: H-002"
          />
        </label>

        <div
          className="worker-filter-banner normal"
          style={{
            marginTop: 10,
          }}
        >
          사번은 서버에서
          WK-00001 형식으로
          자동 생성됩니다.
        </div>

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-modal-btn"
            onClick={close}
            disabled={submitting}
          >
            취소
          </button>

          <button
            type="submit"
            className="primary-modal-btn"
            disabled={submitting}
          >
            {submitting
              ? '등록 중...'
              : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
