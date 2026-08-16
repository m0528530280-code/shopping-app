import { useState } from 'react'
import { SEED_PRODUCTS } from '../data/seedProducts'

const CATEGORIES = [
  'מוצרי חלב', 'לחמים ומאפים', 'בשר', 'שימורים', 'ירקות', 'פירות',
  'קפואים', 'ניקיון', 'נייר וחד פעמי', 'טואלטיקה', 'שתייה', 'חטיפים וממתקים', 'אחר',
]

export default function ProductManager({ data }) {
  const { products, addProduct, updateProduct, addProducts } = data
  const [name, setName] = useState('')
  const [category, setCategory] = useState('אחר')
  const [price, setPrice] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')

  const filtered = products.filter((p) => p.name.includes(search.trim()))

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    await addProduct(name.trim(), category, price ? Number(price) : null)
    setName(''); setPrice('')
  }

  async function handleImportSeed() {
    setImporting(true)
    setImportMsg('')
    try {
      const added = await addProducts(SEED_PRODUCTS)
      setImportMsg(added > 0 ? `נוספו ${added} מוצרים חדשים למאגר` : 'כל המוצרים כבר קיימים במאגר')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <button
        className="btn btn-outline btn-full"
        style={{ marginBottom: 10 }}
        onClick={handleImportSeed}
        disabled={importing}
      >{importing ? 'מייבא...' : 'ייבוא מאגר מוצרים בסיסי (מעל 100 מוצרים)'}</button>
      {importMsg && <div className="empty-state" style={{ padding: '4px 0' }}>{importMsg}</div>}

      <form onSubmit={handleAdd} className="item-row" style={{ flexWrap: 'wrap' }}>
        <input
          className="search-box"
          style={{ marginBottom: 8 }}
          placeholder="שם מוצר חדש"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select className="price-input" style={{ width: '48%' }} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          className="price-input"
          style={{ width: '48%' }}
          type="number"
          placeholder="מחיר ברירת מחדל"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button className="btn btn-primary btn-full" style={{ marginTop: 8 }}>הוספת מוצר</button>
      </form>

      <input
        className="search-box"
        placeholder="חיפוש במאגר..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.map((p) => (
        <div key={p.id} className="item-row">
          {editing === p.id ? (
            <input
              className="search-box"
              style={{ margin: 0, flex: 1 }}
              defaultValue={p.name}
              autoFocus
              onBlur={async (e) => { await updateProduct(p.id, { name: e.target.value }); setEditing(null) }}
              onKeyDown={async (e) => { if (e.key === 'Enter') { await updateProduct(p.id, { name: e.target.value }); setEditing(null) } }}
            />
          ) : (
            <div className="info" onClick={() => setEditing(p.id)}>
              <div className="name">{p.name}</div>
              <div className="cat">{p.category} {p.default_price ? `· ₪${p.default_price}` : ''}</div>
            </div>
          )}
          <button
            className="circle-btn"
            title={p.active ? 'השבתה' : 'הפעלה'}
            onClick={() => updateProduct(p.id, { active: !p.active })}
          >{p.active ? '🗑' : '↺'}</button>
        </div>
      ))}
    </div>
  )
}
