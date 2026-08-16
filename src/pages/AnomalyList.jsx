import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './AnomalyList.module.css'

export const ANOMALIES = [
  { id:1, category:'fall',     label:'추락 감지',     level:'danger', worker:'박민수', zone:'A구역 3층', time:'10:28', status:'처리중'  },
  { id:2, category:'external', label:'난간 없는 구간', level:'danger', worker:'박민수', zone:'A구역 3층', time:'10:26', status:'처리중'  },
  { id:3, category:'health',   label:'피로도 이상',   level:'warn',   worker:'김현석', zone:'B구역',    time:'10:27', status:'휴식권고' },
  { id:4, category:'external', label:'물웅덩이 감지', level:'warn',   worker:'이수진', zone:'C구역',    time:'10:24', status:'확인완료' },
  { id:5, category:'external', label:'장애물 감지',   level:'warn',   worker:'김현석', zone:'B구역',    time:'10:21', status:'확인완료' },
  { id:6, category:'health',   label:'열사병 위험',   level:'warn',   worker:'정유진', zone:'B구역 1층',time:'09:55', status:'미처리'  },
]

const TABS = [
  { key:'all',      label:'전체',    count:6 },
  { key:'external', label:'외부요인', count:3 },
  { key:'health',   label:'건강',    count:2 },
  { key:'fall',     label:'추락',    count:1 },
]

const TYPE_ICON = {
  fall:     { icon:'↘', color:'#ef4444' },
  external: { icon:'△', color:'#f97316' },
  health:   { icon:'↗', color:'#f97316' },
}

const STATUS_STYLE = {
  '처리중':  { bg:'#dbeafe', color:'#1d4ed8' },
  '확인완료': { bg:'#dcfce7', color:'#16a34a' },
  '휴식권고': { bg:'#ffedd5', color:'#ea580c' },
  '미처리':  { bg:'#f3f4f6', color:'#6b7280' },
}

export default function AnomalyList() {
  const [tab, setTab] = useState('all')
  const navigate = useNavigate()

  const filtered = tab === 'all' ? ANOMALIES : ANOMALIES.filter(a => a.category === tab)

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>이상 감지</h1>
        <p className={styles.subtitle}>외부요인 · 건강 · 추락</p>
      </div>

      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} <span className={styles.count}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>위험도</th>
              <th>감지 유형</th>
              <th>작업자</th>
              <th>위치</th>
              <th>발생 시간</th>
              <th>처리 상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => {
              const ti = TYPE_ICON[a.category]
              return (
                <tr key={a.id}>
                  <td>
                    <span className={`${styles.levelBadge} ${a.level === 'danger' ? styles.danger : styles.warn}`}>
                      ● {a.level === 'danger' ? '위험' : '주의'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: ti.color, fontWeight: 600 }}>
                      {ti.icon} {a.label}
                    </span>
                  </td>
                  <td className={styles.workerCell}>{a.worker}</td>
                  <td className={styles.zoneCell}>{a.zone}</td>
                  <td className={styles.timeCell}>{a.time}</td>
                  <td>
                    <span
                      className={styles.statusBadge}
                      style={{ background: STATUS_STYLE[a.status]?.bg, color: STATUS_STYLE[a.status]?.color }}
                    >{a.status}</span>
                  </td>
                  <td>
                    <button className={styles.detailBtn} onClick={() => navigate(`/anomaly/${a.id}`)}>
                      👁 상세
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
