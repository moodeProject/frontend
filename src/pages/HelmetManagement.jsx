import { useState } from 'react'
import styles from './HelmetManagement.module.css'

const HELMETS = [
  { id:'H-001', worker:'박민수', deviceId:'DEV-001', connected:true,  lastSeen:'8초 전',  status:'사용중' },
  { id:'H-002', worker:'김현석', deviceId:'DEV-002', connected:true,  lastSeen:'12초 전', status:'사용중' },
  { id:'H-003', worker:'이수진', deviceId:'DEV-003', connected:true,  lastSeen:'6초 전',  status:'사용중' },
  { id:'H-004', worker:'최동훈', deviceId:'DEV-004', connected:true,  lastSeen:'9초 전',  status:'사용중' },
  { id:'H-005', worker:'정유진', deviceId:'DEV-005', connected:true,  lastSeen:'5초 전',  status:'사용중' },
  { id:'H-006', worker:null,     deviceId:'DEV-006', connected:false, lastSeen:'–',       status:'대기' },
  { id:'H-007', worker:null,     deviceId:'DEV-007', connected:false, lastSeen:'3분 전',  status:'연결끊김' },
]

const STATUS_STYLE = {
  '사용중':  { bg: '#dbeafe', color: '#1d4ed8' },
  '대기':    { bg: '#f3f4f6', color: '#6b7280' },
  '연결끊김': { bg: '#fee2e2', color: '#ef4444' },
}

export default function HelmetManagement() {
  const [search, setSearch] = useState('')

  const filtered = HELMETS.filter(h =>
    !search || h.id.includes(search) || (h.worker && h.worker.includes(search))
  )

  const total      = HELMETS.length
  const inUse      = HELMETS.filter(h => h.status === '사용중').length
  const disconnected = HELMETS.filter(h => h.status === '연결끊김').length

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>헬멧 관리</h1>
          <p className={styles.subtitle}>스마트 안전모 등록 및 연결</p>
        </div>
        <button className={styles.addBtn}>+ 헬멧 등록</button>
      </div>

      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>전체</div>
          <div className={styles.statNum}>{total}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>사용 중</div>
          <div className={styles.statNum} style={{ color: '#3b82f6' }}>{inUse}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>연결 끊김</div>
          <div className={styles.statNum} style={{ color: '#ef4444' }}>{disconnected}</div>
        </div>
      </div>

      <input
        className={styles.search}
        placeholder="헬멧 번호 또는 작업자 검색"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>헬멧 번호</th>
              <th>연결 작업자</th>
              <th>기기 ID</th>
              <th>센서 상태</th>
              <th>마지막 통신</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => (
              <tr key={h.id}>
                <td className={styles.helmetId}>{h.id}</td>
                <td className={styles.workerCell}>{h.worker ?? <span className={styles.unconnected}>미연결</span>}</td>
                <td className={styles.deviceId}>{h.deviceId}</td>
                <td>
                  <span className={h.connected ? styles.connectedBadge : styles.disconnectedBadge}>
                    {h.connected ? '🛜 연결' : '🛜 미연결'}
                  </span>
                </td>
                <td className={styles.lastSeen}>{h.lastSeen}</td>
                <td>
                  <span
                    className={styles.statusBadge}
                    style={{ background: STATUS_STYLE[h.status]?.bg, color: STATUS_STYLE[h.status]?.color }}
                  >{h.status}</span>
                </td>
                <td className={styles.menuCell}>···</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
