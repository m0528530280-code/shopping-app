import { useMemo, useState } from 'react'
import CheckIcon from './CheckIcon'
import EmptyState from './EmptyState'
import QtyStepper from './QtyStepper'

export default function ShoppingMode({ data }) {
  const { products, listItems, sessionItems, togglePurchased, setPrice, setQty, completeSession, toggleNeeded } = data
  const [filter, setFilter] = useState('all') // all | pending | purchased
  const [confirming, setConfirming] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [manualTotal, setManualTotal] = useState('')

  async function handleComplete() {
    await completeSession(manualTotal !== '' ? Number(manualTotal) : undefined)
    setConfirming(false)
    setCelebrate(true)
    setTimeout(() => setCelebrate(false), 1700)
  }

  const items = useMemo(() => {
    const neededIds = new Set(listItems.map((i) => i.product_id))
    return products
      .filter((p) => neededIds.has(p.id))
      .map((p) => {
        const si = sessionItems.find((i) => i.product_id === p.id)
        const li = listItems.find((i) => i.product_id === p.id)
        return { ...p, purchased: si?.purchased || false, price: si?.price ?? '', qty: li?.qty || 1 }
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
  const pct = items.length ? (purchasedCount / items.length) * 100 : 0

  const celebrateOverlay = celebrate && (
    <div className="celebrate-overlay">
      <div className="celebrate-burst">
        <div className="confetti-wrap">
          {Array.from({ length: 8 }).map((_, i) => <span key={i} className="confetti-dot" />)}
        </div>
        <CheckIcon size={44} />
      </div>
      <div className="celebrate-text">🎉 הקנייה הושלמה!</div>
    </div>
  )

  if (items.length === 0) {
    return (
      <>
        <EmptyState
          icon="📭"
          title="אין מוצרים ברשימה הפעילה"
          subtitle="הוסיפו מוצרים במסך הרשימה"
        />
        {celebrateOverlay}
      </>
    )
  }

  return (
    <div>
      <div className="progress-header">
        <div className="progress-text">
          <span>{purchasedCount} מתוך {items.length} נקנו</span>
          <span className="progress-pct">{Math.round(pct)}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

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
              >{p.purchased && <CheckIcon />}</button>
              <div className="info">
                <div className="name">{p.name}</div>
              </div>
              {p.qty > 1 && <QtyStepper value={p.qty} onChange={(q) => setQty(p.id, q)} />}
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
        </div>
        <button
          className="btn btn-amber"
          onClick={() => { setManualTotal(total ? total.toFixed(2) : ''); setConfirming(true) }}
        >סיום קנייה</button>
      </div>

      {confirming && (
        <div className="modal-backdrop" onClick={() => setConfirming(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>לסיים את הקנייה?</h3>
            <p style={{ color: 'var(--ink-soft)' }}>
              מוצרים שלא סומנו כ"נקנה" יישארו ברשימה לקנייה הבאה.
            </p>
            <label style={{ fontSize: 13, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>
              סכום סופי ששולם
            </label>
            <input
              className="search-box"
              type="number"
              inputMode="decimal"
              placeholder="₪ הזן סכום"
              value={manualTotal}
              onChange={(e) => setManualTotal(e.target.value)}
            />
            <button
              className="btn btn-primary btn-full"
              style={{ marginBottom: 8 }}
              onClick={handleComplete}
            >
              אישור וסיום
            </button>
            <button className="btn btn-outline btn-full" onClick={() => setConfirming(false)}>ביטול</button>
          </div>
        </div>
      )}

      {celebrateOverlay}
    </div>
  )
}
