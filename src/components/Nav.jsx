const TABS = [
  { id: 'list', label: 'רשימה', icon: '📝' },
  { id: 'shopping', label: 'מצב קנייה', icon: '🛒' },
  { id: 'products', label: 'מוצרים', icon: '📦' },
  { id: 'history', label: 'היסטוריה', icon: '🧾' },
]

export default function Nav({ active, onChange }) {
  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={active === tab.id ? 'active' : ''}
          onClick={() => onChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
