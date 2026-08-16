import { useState } from 'react'
import styles from './AccidentLog.module.css'

const ALL_LOGS = [
  { time:'08.09 10:28', worker:'박민수', type:'추락 감지',    typeIcon:'📉', typeColor:'#ef4444', category:'추락', zone:'A구역 3층', risk:'danger', status:'처리중' },
  { time:'08.09 10:26', worker:'박민수', type:'난간 없는 구간', typeIcon:'⚠',  typeColor:'#ef4444', category:'외부요인', zone:'A구역 3층', risk:'danger', status:'처리중' },
  { time:'08.09 10:27', worker:'김현석', type:'피로도 이상',   typeIcon:'💓', typeColor:'#f97316', category:'건강', zone:'B구역',     risk:'warn', status:'휴식권고' },
  { time:'08.09 10:24', worker:'이수진', type:'물웅덩이 감지', typeIcon:'💧', typeColor:'#f97316', category:'외부요인', zone:'C구역',  risk:'warn', status:'확인완료' },
  { time:'08.09 10:21', worker:'김현석', type:'장애물 감지',   typeIcon:'📦', typeColor:'#f97316', category:'외부요인', zone:'B구역',  risk:'warn', status:'확인완료' },
  { time:'08.09 09:55', worker:'정유진', type:'열사병 위험',   typeIcon:'🌡', typeColor:'#f97316', category:'건강', zone:'B구역 1층', risk:'warn', status:'미처리' },
]

const TABS = ['전체','외부요인','건강','추락']
const RISK_COLOR = { danger: '#ef4444', warn: '#f97316' }
const RISK_BG    = { danger: '#fee2e2', warn: '#fff7ed' }
const RISK_LABEL = { danger: '위험', warn: '주의' }

const STATUS_STYLE = {
  '처리중':  { bg: '#dbeafe', color: '#1d4ed8' },
  '휴식권고': { bg: '#fff7ed', color: '#c2410c' },
  '확인완료': { bg: '#dcfce7', color: '#15803d' },
  '미처리':  { bg: '#f3f4f6', color: '#6b7280' },
}

export default function AccidentLog() {
  const [tab, setTab]       = useState('전체')
  const [search, setSearch] = useState('')

  const filtered = ALL_LOGS.filter(l =>
    (tab === '전체' || l.category === tab) &&
    (!search || l.worker.includes(search) || l.type.includes(search))
  )

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>사고·알림 기록</h1>
          <p className={styles.subtitle}>이벤트 처리 이력</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >{t}</button>
          ))}
        </div>
        <input
          className={styles.search}
          placeholder="검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>발생 시간</th>
              <th>작업자</th>
              <th>감지 유형</th>
              <th>위치</th>
              <th>위험도</th>
              <th>처리 상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className={styles.empty}>해당 기록이 없습니다.</td></tr>
            ) : filtered.map((l, i) => (
              <tr key={i}>
                <td className={styles.timeCell}>{l.time}</td>
                <td className={styles.workerCell}>{l.worker}</td>
                <td>
                  <span className={styles.typeCell} style={{ color: l.typeColor }}>
                    {l.typeIcon} {l.type}
                  </span>
                </td>
                <td className={styles.zoneCell}>{l.zone}</td>
                <td>
                  <span className={styles.riskBadge} style={{ background: RISK_BG[l.risk], color: RISK_COLOR[l.risk] }}>
                    ● {RISK_LABEL[l.risk]}
                  </span>
                </td>
                <td>
                  <span className={styles.statusBadge} style={{ background: STATUS_STYLE[l.status]?.bg, color: STATUS_STYLE[l.status]?.color }}>
                    {l.status}
                  </span>
                </td>
                <td>
                  <button className={styles.detailBtn}>👁 상세</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
