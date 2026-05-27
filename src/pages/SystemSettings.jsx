import { useState, useRef } from 'react'
import { MOCK_ADMINS, MOCK_HELMETS, MOCK_TEAMS, ADMIN_ROLES } from '../data/mockSettings'
import Pagination from '../components/Pagination'
import styles from './SystemSettings.module.css'

const PAGE_SIZES = [6, 10, 20]

// ── 관리자 계정 탭 ─────────────────────────────────────────
function AdminTab() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const [openMenu, setOpenMenu] = useState(null)

  const totalPages = Math.max(1, Math.ceil(MOCK_ADMINS.length / pageSize))
  const paged = MOCK_ADMINS.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className={styles.tabContent}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {['프로필','이름','아이디','이메일','직책','권한','최근 로그인',''].map((h, i) => <th key={i}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {paged.map((a) => (
              <tr key={a.id} className={styles.row}>
                <td><div className={styles.avatar}>{a.name[0]}</div></td>
                <td className={styles.bold}>{a.name}</td>
                <td>{a.userId}</td>
                <td>{a.email}</td>
                <td>{a.position}</td>
                <td>{a.role}</td>
                <td className={styles.muted}>{a.lastLogin}</td>
                <td className={styles.menuCell}>
                  <button className={styles.menuBtn} onClick={() => setOpenMenu(openMenu === a.id ? null : a.id)}>⋮</button>
                  {openMenu === a.id && (
                    <div className={styles.dropdown}>
                      <button onClick={() => setOpenMenu(null)}>수정</button>
                      <button onClick={() => setOpenMenu(null)}>삭제</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} pageSize={pageSize} onPage={setPage} onPageSize={(s) => { setPageSize(s); setPage(1) }} pageSizes={PAGE_SIZES} />
      </div>

      {/* 권한 정보 패널 */}
      <aside className={styles.sidePanel}>
        <div className={styles.sidePanelTitle}>권한 정보</div>
        <div className={styles.roleList}>
          {ADMIN_ROLES.map((r) => (
            <div key={r.role} className={styles.roleItem}>
              <div className={styles.roleLabel}>{r.label}</div>
              <div className={styles.roleDesc}>{r.desc}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}

// ── 헬멧 설정 탭 ───────────────────────────────────────────
function HelmetTab() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const [openMenu, setOpenMenu] = useState(null)
  const [form, setForm] = useState({ workerName: '', employeeId: '', helmetId: '' })

  const totalPages = Math.max(1, Math.ceil(MOCK_HELMETS.length / pageSize))
  const paged = MOCK_HELMETS.slice((page - 1) * pageSize, page * pageSize)

  function handleSubmit() {
    // TODO: 실제 API 호출로 교체
    alert(`헬멧 등록: ${form.workerName} / ${form.employeeId} / ${form.helmetId}`)
    setForm({ workerName: '', employeeId: '', helmetId: '' })
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {['프로필','이름','헬멧ID','모델명','배터리','신호 세기','상태','연결',''].map((h, i) => <th key={i}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {paged.map((h) => (
              <tr key={h.id} className={styles.row}>
                <td><div className={styles.avatar}>{h.name[0]}</div></td>
                <td className={styles.bold}>{h.name}</td>
                <td>{h.helmetId}</td>
                <td>{h.model}</td>
                <td className={Number(h.battery) <= 20 ? styles.batteryLow : ''}>{h.battery}</td>
                <td>
                  <span className={`${styles.signalBadge} ${styles['signal_' + h.signal]}`}>{h.signal}</span>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${h.status === '활성' ? styles.statusActive : styles.statusInactive}`}>
                    {h.status}
                  </span>
                </td>
                <td className={styles.muted}>{h.connected}</td>
                <td className={styles.menuCell}>
                  <button className={styles.menuBtn} onClick={() => setOpenMenu(openMenu === h.id ? null : h.id)}>⋮</button>
                  {openMenu === h.id && (
                    <div className={styles.dropdown}>
                      <button onClick={() => setOpenMenu(null)}>수정</button>
                      <button onClick={() => setOpenMenu(null)}>삭제</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} pageSize={pageSize} onPage={setPage} onPageSize={(s) => { setPageSize(s); setPage(1) }} pageSizes={PAGE_SIZES} />
      </div>

      {/* 헬멧 등록 패널 */}
      <aside className={styles.sidePanel}>
        <div className={styles.sidePanelTitle}>헬멧 등록</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>작업지명</label>
          <input className={styles.formInput} placeholder="이름을 입력하세요." value={form.workerName} onChange={(e) => setForm((p) => ({ ...p, workerName: e.target.value }))} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>작업자 사번</label>
          <input className={styles.formInput} placeholder="사번을 입력하세요." value={form.employeeId} onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>안전모 ID</label>
          <input className={styles.formInput} placeholder="등록할 안전모 ID를 입력하세요." value={form.helmetId} onChange={(e) => setForm((p) => ({ ...p, helmetId: e.target.value }))} />
        </div>
        <div className={styles.formActions}>
          <button className={styles.cancelBtn} onClick={() => setForm({ workerName: '', employeeId: '', helmetId: '' })}>취소</button>
          <button className={styles.submitBtn} onClick={handleSubmit}>등록하기</button>
        </div>
      </aside>
    </div>
  )
}

// ── 팀 관리 탭 ─────────────────────────────────────────────
function TeamTab() {
  return (
    <div className={styles.tabContent}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {['팀명','팀장','팀원 수','생성일',''].map((h, i) => <th key={i}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {MOCK_TEAMS.map((t) => (
              <tr key={t.id} className={styles.row}>
                <td className={styles.bold}>{t.name}</td>
                <td>{t.leader}</td>
                <td>{t.memberCount}명</td>
                <td className={styles.muted}>{t.createdAt}</td>
                <td className={styles.menuCell}>
                  <button className={styles.menuBtn}>⋮</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── 메인 ───────────────────────────────────────────────────
const TABS = ['관리자 계정', '헬멧 설정', '팀 관리']

export default function SystemSettings() {
  const [tab, setTab] = useState(0)

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>시스템 설정</h1>
        <p className={styles.subtitle}>시스템의 기본 설정과 알림, 권한, 데이터 연동을 관리합니다.</p>
      </div>

      {/* 탭 바 */}
      <div className={styles.tabBar}>
        {TABS.map((t, i) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === i ? styles.tabActive : ''}`}
            onClick={() => setTab(i)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {tab === 0 && <AdminTab />}
      {tab === 1 && <HelmetTab />}
      {tab === 2 && <TeamTab />}

      {/* + 관리자 추가 (관리자 계정 탭에서만) */}
      {tab === 0 && (
        <div className={styles.addAdminRow}>
          <button className={styles.addAdminBtn}>+ 관리자 추가</button>
        </div>
      )}
    </div>
  )
}
