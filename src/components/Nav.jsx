const TABS = [
  { id: 'list', label: 'רשימה', icon: '📝' },
  { id: 'shopping', label: 'מצב קנייה', icon: '🛒' },
  { id: 'products', label: 'מוצרים', icon: '📦' },
  { id: 'history', label: 'היסטוריה', icon: '🧾' },
  { id: 'more', label: 'עוד', icon: '✨' },
]

export default function Nav({ active, onChange, badge = 0 }) {
  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={active === tab.id ? 'active' : ''}
          onClick={() => onChange(tab.id)}
        >
          <span className="tab-icon-wrap">
            <span className="tab-icon">{tab.icon}</span>
            {tab.id === 'shopping' && badge > 0 && <span className="nav-badge">{badge}</span>}
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
