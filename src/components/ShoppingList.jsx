import { useMemo, useState } from 'react'

export default function ShoppingList({ data }) {
  const { products, listItems, sessionItems, toggleNeeded, togglePurchased, setPrice } = data
  const [search, setSearch] = useState('')

  const neededIds = new Set(listItems.map((i) => i.product_id))

  const filtered = useMemo(() => {
    const activeOnly = products.filter((p) => p.active)
    if (!search.trim()) return activeOnly
    return activeOnly.filter((p) => p.name.includes(search.trim()))
  }, [products, search])

  const activeList = filtered.filter((p) => neededIds.has(p.id))
  const catalog = filtered.filter((p) => !neededIds.has(p.id))

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

      {activeList.length === 0 ? (
        <div className="empty-state">
          <div className="big">🛒</div>
          <div>הרשימה ריקה. חפשו מוצר למטה והוסיפו אותו.</div>
        </div>
      ) : (
        <>
          <div className="cat-header">ברשימה ({activeList.length})</div>
          {activeList.map((p) => (
            <div key={p.id} className={`item-row ${purchasedFor(p.id) ? 'purchased' : ''}`}>
              <button
                className={`circle-btn needed-on`}
                title="צריך לקנות"
                onClick={() => toggleNeeded(p.id)}
              >✓</button>
              <button
                className={`circle-btn ${purchasedFor(p.id) ? 'purchased-on' : ''}`}
                title="נקנה"
                onClick={() => togglePurchased(p.id)}
              >{purchasedFor(p.id) ? '✓' : ''}</button>
              <div className="info">
                <div className="name">{p.name}</div>
                <div className="cat">{p.category}</div>
              </div>
              <input
                className="price-input"
                type="number"
                inputMode="decimal"
                placeholder="₪"
                value={priceFor(p.id)}
                onChange={(e) => setPrice(p.id, e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          ))}
        </>
      )}

      {search.trim() && catalog.length > 0 && (
        <>
          <div className="cat-header">הוספה מהמאגר</div>
          {catalog.map((p) => (
            <div key={p.id} className="item-row">
              <button className="circle-btn" title="הוסף לרשימה" onClick={() => toggleNeeded(p.id)}>+</button>
              <div className="info">
                <div className="name">{p.name}</div>
                <div className="cat">{p.category}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
