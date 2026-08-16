import { useMemo, useState } from 'react'

export default function ShoppingMode({ data }) {
  const { products, listItems, sessionItems, togglePurchased, setPrice, completeSession, toggleNeeded } = data
  const [filter, setFilter] = useState('all') // all | pending | purchased
  const [confirming, setConfirming] = useState(false)

  const items = useMemo(() => {
    const neededIds = new Set(listItems.map((i) => i.product_id))
    return products
      .filter((p) => neededIds.has(p.id))
      .map((p) => {
        const si = sessionItems.find((i) => i.product_id === p.id)
        return { ...p, purchased: si?.purchased || false, price: si?.price ?? '' }
      })
  }, [products, listItems, sessionItems])

  const visible = items.filter((i) => {
    if (filter === 'pending') return !i.purchased
    if (filter === 'purchased') return i.purchased
    return true
  })

  const grouped = visible.reduce((acc, item) => {
    const cat = item.category || 'אחר'
    acc[cat] = acc[cat] || []
    acc[cat].push(item)
    return acc
  }, {})

  const total = items.reduce((sum, i) => sum + (i.purchased ? Number(i.price || 0) : 0), 0)
  const purchasedCount = items.filter((i) => i.purchased).length

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="big">📭</div>
        <div>אין מוצרים ברשימה הפעילה. הוסיפו מוצרים במסך הרשימה.</div>
      </div>
    )
  }

  return (
    <div>
      <div className="filter-pills">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>הכל</button>
        <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>עדיין לא נקנה</button>
        <button className={filter === 'purchased' ? 'active' : ''} onClick={() => setFilter('purchased')}>נקנה</button>
      </div>

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat}>
          <div className="cat-header">{cat}</div>
          {catItems.map((p) => (
            <div key={p.id} className={`item-row ${p.purchased ? 'purchased' : ''}`}>
              <button
                className={`circle-btn ${p.purchased ? 'purchased-on' : ''}`}
                onClick={() => togglePurchased(p.id)}
              >{p.purchased ? '✓' : ''}</button>
              <div className="info">
                <div className="name">{p.name}</div>
              </div>
              <input
                className="price-input"
                type="number"
                inputMode="decimal"
                placeholder="₪"
                value={p.price}
                onChange={(e) => setPrice(p.id, e.target.value ? Number(e.target.value) : null)}
              />
              <button
                className="circle-btn danger"
                title="הסר מהקנייה"
                onClick={() => toggleNeeded(p.id)}
              >✕</button>
            </div>
          ))}
        </div>
      ))}

      <div style={{ height: 90 }} />

      <div className="receipt-total">
        <div>
          <div className="label">{purchasedCount} מתוך {items.length} נקנו</div>
          <div className="amount">₪{total.toFixed(2)}</div>
        </div>
        <button className="btn btn-amber" onClick={() => setConfirming(true)}>סיום קנייה</button>
      </div>

      {confirming && (
        <div className="modal-backdrop" onClick={() => setConfirming(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>לסיים את הקנייה?</h3>
            <p style={{ color: 'var(--ink-soft)' }}>
              הקנייה תישמר בהיסטוריה עם סה"כ ₪{total.toFixed(2)}.
              מוצרים שלא סומנו כ"נקנה" יישארו ברשימה לקנייה הבאה.
            </p>
            <button
              className="btn btn-primary btn-full"
              style={{ marginBottom: 8 }}
              onClick={async () => { await completeSession(); setConfirming(false) }}
            >
              אישור וסיום
            </button>
            <button className="btn btn-outline btn-full" onClick={() => setConfirming(false)}>ביטול</button>
          </div>
        </div>
      )}
    </div>
  )
}
