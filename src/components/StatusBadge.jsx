export default function StatusBadge({ level = 'normal', children }) {
  return <span className={`status-badge ${level}`}>● {children}</span>;
}
