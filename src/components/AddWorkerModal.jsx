import { Camera, ImagePlus, X } from 'lucide-react';
import { useMemo, useState } from 'react';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const emptyForm = {
  name: '',
  employeeNumber: '',
  phone: '',
  zone: 'A구역',
  detailLocation: '',
  helmetId: '',
  profileImage: '',
};

function FieldLabel({ children, optional, helper }) {
  return (
    <span className="form-label-line">
      <span>{children}</span>
      {optional && <small>(선택)</small>}
      {helper && <small>{helper}</small>}
    </span>
  );
}

export default function AddWorkerModal({ open, onClose, onAdd, workers }) {
  const nextNumber = useMemo(() => {
    const used = workers
      .map((worker) => Number(String(worker.workerCode || worker.employeeNumber || '').replace(/\D/g, '')))
      .filter(Number.isFinite);
    return String(Math.max(0, ...used) + 1).padStart(3, '0');
  }, [workers]);

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  if (!open) return null;

  const close = () => {
    setForm(emptyForm);
    setError('');
    onClose();
  };

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('이미지 파일만 등록할 수 있습니다.');
    if (file.size > 3 * 1024 * 1024) return setError('프로필 이미지는 3MB 이하로 등록해 주세요.');
    const dataUrl = await fileToDataUrl(file);
    setForm((prev) => ({ ...prev, profileImage: dataUrl }));
    setError('');
  };

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return setError('작업자 이름을 입력해 주세요.');

    const employeeNumber = form.employeeNumber.trim() || `W${nextNumber}`;
    const helmetId = form.helmetId.trim() || `H-${nextNumber}`;

    if (workers.some((worker) => (worker.employeeNumber || worker.workerCode) === employeeNumber)) {
      return setError('이미 등록된 사번입니다.');
    }
    if (workers.some((worker) => worker.id === helmetId || worker.helmetId === helmetId)) {
      return setError('이미 등록된 헬멧 번호입니다.');
    }

    onAdd({
      id: helmetId,
      workerCode: employeeNumber,
      employeeNumber,
      phone: form.phone.trim(),
      name: form.name.trim(),
      zone: form.detailLocation.trim() || form.zone,
      detailLocation: form.detailLocation.trim() || form.zone,
      status: 'normal',
      heartRate: 72,
      fatigue: 1,
      issue: '정상 작업 중',
      helmetId,
      sensorConnected: true,
      profileImage: form.profileImage,
    });
    close();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <form className="worker-modal add-worker-modal" onSubmit={submit}>
        <button className="modal-close" type="button" onClick={close} aria-label="닫기"><X size={17}/></button>
        <div className="modal-heading">
          <h2>작업자 추가</h2>
          <p>새 작업자를 등록합니다.</p>
        </div>

        <div className="profile-upload-row">
          <label className="profile-upload-circle">
            {form.profileImage ? <img src={form.profileImage} alt="미리보기"/> : <><ImagePlus size={22}/><span>사진</span></>}
            <input type="file" accept="image/*" onChange={handleImage}/>
          </label>
          <div>
            <strong>프로필 이미지</strong>
            <p>JPG, PNG · 최대 3MB</p>
            <label className="small-upload-btn"><Camera size={13}/> 이미지 선택<input type="file" accept="image/*" onChange={handleImage}/></label>
          </div>
        </div>

        <label className="form-field form-field-full">
          <FieldLabel>이름 <b>*</b></FieldLabel>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: 홍길동"/>
        </label>

        <div className="form-grid-2 aligned-form-grid">
          <label className="form-field">
            <FieldLabel helper="(미입력 시 자동 생성)">사번</FieldLabel>
            <input value={form.employeeNumber} onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })} placeholder={`예: W${nextNumber}`}/>
          </label>
          <label className="form-field">
            <FieldLabel optional>연락처</FieldLabel>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="예: 010-1234-5678"/>
          </label>
        </div>

        <div className="form-grid-2 aligned-form-grid">
          <label className="form-field">
            <FieldLabel>소속 구역</FieldLabel>
            <select value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })}>
              <option>A구역</option><option>B구역</option><option>C구역</option>
            </select>
          </label>
          <label className="form-field">
            <FieldLabel optional>세부 위치</FieldLabel>
            <input value={form.detailLocation} onChange={(e) => setForm({ ...form, detailLocation: e.target.value })} placeholder="예: A구역 2층"/>
          </label>
        </div>

        <label className="form-field form-field-full">
          <FieldLabel optional>헬멧 번호</FieldLabel>
          <input value={form.helmetId} onChange={(e) => setForm({ ...form, helmetId: e.target.value })} placeholder={`예: H-${nextNumber}`}/>
        </label>

        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions"><button type="button" className="secondary-modal-btn" onClick={close}>취소</button><button type="submit" className="primary-modal-btn">등록</button></div>
      </form>
    </div>
  );
}
