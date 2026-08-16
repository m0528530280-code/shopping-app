export default function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="empty-state">
      <div className="empty-illustration"><span>{icon}</span></div>
      <div className="empty-title">{title}</div>
      {subtitle && <div className="empty-subtitle">{subtitle}</div>}
    </div>
  )
}
