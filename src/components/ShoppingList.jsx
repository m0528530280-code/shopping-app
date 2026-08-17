import { useMemo, useState } from 'react'
import CheckIcon from './CheckIcon'
import EmptyState from './EmptyState'
import QtyStepper from './QtyStepper'

export default function ShoppingList({ data }) {
  const { products, listItems, sessionItems, toggleNeeded, togglePurchased, setPrice, setQty } = data
  const [search, setSearch] = useState('')

  const neededIds = new Set(listItems.map((i) => i.product_id))

  function qtyFor(productId) {
    return listItems.find((i) => i.product_id === productId)?.qty || 1
  }

  const filtered = useMemo(() => {
    const activeOnly = products.filter((p) => p.active)
    if (!search.trim()) return activeOnly
    return activeOnly.filter((p) => p.name.includes(search.trim()))
  }, [products, search])

  const grouped = useMemo(() => {
    const acc = {}
    for (const p of filtered) {
      const cat = p.category || 'אחר'
      acc[cat] = acc[cat] || []
      acc[cat].push(p)
    }
    return Object.entries(acc).sort(([a], [b]) => a.localeCompare(b, 'he'))
  }, [filtered])

  function purchasedFor(productId) {
    return sessionItems.find((i) => i.product_id === productId)?.purchased || false
  }
  function priceFor(productId) {
    const item = sessionItems.find((i) => i.product_id === productId)
    return item?.price ?? ''
  }

  return (
    <div>
      <input
        className="search-box"
        placeholder="חיפוש מוצר..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {grouped.length === 0 ? (
        <EmptyState icon="🛒" title="לא נמצאו מוצרים" subtitle="נסו חיפוש אחר" />
      ) : (
        grouped.map(([cat, catItems]) => (
          <div key={cat}>
            <div className="cat-header">{cat}</div>
            {catItems.map((p) => {
              const needed = neededIds.has(p.id)
              return (
                <div key={p.id} className={`item-row ${needed && purchasedFor(p.id) ? 'purchased' : ''}`}>
                  <button
                    className={`circle-btn ${needed ? 'needed-on' : ''}`}
                    title={needed ? 'הסר מהרשימה' : 'הוסף לרשימה'}
                    onClick={() => toggleNeeded(p.id)}
                  >{needed && <CheckIcon />}</button>
                  <div className="info">
                    <div className="name">{p.name}</div>
                  </div>
                  {needed && (
                    <>
                      <QtyStepper value={qtyFor(p.id)} onChange={(q) => setQty(p.id, q)} />
                      <button
                        className={`circle-btn ${purchasedFor(p.id) ? 'purchased-on' : ''}`}
                        title="נקנה"
                        onClick={() => togglePurchased(p.id)}
                      >{purchasedFor(p.id) && <CheckIcon />}</button>
                      <input
                        className="price-input"
                        type="number"
                        inputMode="decimal"
                        placeholder="₪"
                        value={priceFor(p.id)}
                        onChange={(e) => setPrice(p.id, e.target.value ? Number(e.target.value) : null)}
                      />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
