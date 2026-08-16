export default function SkeletonList({ rows = 5 }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="item-row skeleton-row" key={i}>
          <div className="skeleton skeleton-circle" />
          <div className="info">
            <div className="skeleton skeleton-line" style={{ width: `${58 + (i % 3) * 12}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
