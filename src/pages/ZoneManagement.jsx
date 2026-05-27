import { useState, useMemo } from 'react'
import { MOCK_ZONES, ZONE_STATS, ZONE_TYPES, ZONE_STATUSES, ZONE_COLORS, ZONE_POLYGONS } from '../data/mockZones'
import Pagination from '../components/Pagination'
import styles from './ZoneManagement.module.css'

function StatCard({ icon, iconBg, label, value }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: iconBg }}>{icon}</div>
      <div>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statNum}>{value}</div>
      </div>
    </div>
  )
}

export default function ZoneManagement() {
  const [query, setQuery]     = useState('')
  const [zoneType, setZoneType] = useState('전체 구역')
  const [status, setStatus]   = useState('전체 상태')
  const [page, setPage]       = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [openMenu, setOpenMenu] = useState(null)
  const [hoverZone, setHoverZone] = useState(null)

  const filtered = useMemo(() =>
    MOCK_ZONES.filter((z) => {
      const matchQuery  = !query || z.name.includes(query) || z.memo.includes(query)
      const matchType   = zoneType === '전체 구역' || z.type === zoneType
      const matchStatus = status === '전체 상태' || z.status === status
      return matchQuery && matchType && matchStatus
    }),
    [query, zoneType, status]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  function handleSearch() { setPage(1) }

  return (
    <div className={styles.page}>
      {/* 상단 */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>안전 구역 관리</h1>
          <p className={styles.subtitle}>현장의 안전 구역을 설정하고 관리할 수 있습니다.</p>
        </div>
        <button className={styles.addBtn}>+ 안전구역 추가</button>
      </div>

      {/* 통계 카드 */}
      <div className={styles.statRow}>
        <StatCard icon="🧍" iconBg="#ddeeff" label="전체 구역" value={`${ZONE_STATS.total}개`} />
        <StatCard icon="📍" iconBg="#d4f5e2" label="활성 구역" value={`${ZONE_STATS.active}개`} />
        <StatCard icon="📍" iconBg="#ffe0e8" label="비활성 구역" value={`${ZONE_STATS.inactive}개`} />
        <StatCard icon="🗺️" iconBg="#fff0d0" label="총 면적" value={`${ZONE_STATS.totalArea.toLocaleString()}km`} />
      </div>

      {/* 메인 레이아웃: 테이블 + 지도 */}
      <div className={styles.mainLayout}>
        {/* 왼쪽: 필터 + 테이블 */}
        <div className={styles.left}>
          {/* 필터 */}
          <div className={styles.filterBar}>
            <div className={styles.searchWrap}>
              <input
                className={styles.searchInput}
                placeholder="구역별 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className={styles.searchIcon}>🔍</span>
            </div>
            <button className={styles.searchBtn} onClick={handleSearch}>조회</button>

            <select className={styles.select} value={zoneType} onChange={(e) => setZoneType(e.target.value)}>
              {ZONE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
              {ZONE_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* 테이블 */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {['구역 유형','구역명','메모','면적(m²)','등록일','상태',''].map((h, i) => <th key={i}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={7} className={styles.empty}>검색 결과가 없습니다.</td></tr>
                ) : paged.map((z) => {
                  const c = ZONE_COLORS[z.type] || { bg: '#eee', text: '#555' }
                  return (
                    <tr
                      key={z.id}
                      className={styles.row}
                      onMouseEnter={() => setHoverZone(z.type)}
                      onMouseLeave={() => setHoverZone(null)}
                    >
                      <td>
                        <span className={styles.typeBadge} style={{ background: c.bg, color: c.text }}>
                          {z.type}
                        </span>
                      </td>
                      <td className={styles.bold}>{z.name}</td>
                      <td>{z.memo}</td>
                      <td>{z.area.toLocaleString()}</td>
                      <td className={styles.muted}>{z.registeredAt}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${z.status === '활성' ? styles.statusActive : styles.statusInactive}`}>
                          {z.status}
                        </span>
                      </td>
                      <td className={styles.menuCell}>
                        <button className={styles.menuBtn} onClick={() => setOpenMenu(openMenu === z.id ? null : z.id)}>⋮</button>
                        {openMenu === z.id && (
                          <div className={styles.dropdown}>
                            <button onClick={() => setOpenMenu(null)}>수정</button>
                            <button onClick={() => setOpenMenu(null)}>삭제</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <Pagination
              page={page} totalPages={totalPages} pageSize={pageSize}
              onPage={setPage} onPageSize={(s) => { setPageSize(s); setPage(1) }}
            />
          </div>
        </div>

        {/* 오른쪽: 지도 */}
        <div className={styles.mapCard}>
          <div className={styles.mapTitle}>📍 안전 구역 지도</div>
          <svg
            className={styles.mapSvg}
            viewBox="0 0 360 280"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* 배경 */}
            <rect width="360" height="280" fill="#2a3a5c" />
            {/* 격자 */}
            {Array.from({ length: 9 }, (_, i) => (
              <line key={`v${i}`} x1={(i + 1) * 36} y1="0" x2={(i + 1) * 36} y2="280"
                stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={(i + 1) * 35} x2="360" y2={(i + 1) * 35}
                stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}
            {/* 구역 폴리곤 */}
            {ZONE_POLYGONS.map((z) => {
              const isHover = hoverZone === z.type
              return (
                <g key={z.type}>
                  <polygon
                    points={z.points}
                    fill={isHover ? z.fill.replace('0.25', '0.45') : z.fill}
                    stroke={z.stroke}
                    strokeWidth={isHover ? 2.5 : 1.5}
                  />
                  <text
                    x={z.labelX} y={z.labelY}
                    textAnchor="middle"
                    fill={z.stroke}
                    fontSize="11"
                    fontWeight="700"
                    style={{ pointerEvents: 'none' }}
                  >
                    {z.type}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* 범례 */}
          <div className={styles.mapLegend}>
            {ZONE_POLYGONS.map((z) => (
              <span key={z.type} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: z.stroke }} />
                {z.type}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
