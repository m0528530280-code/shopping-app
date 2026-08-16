import { useState } from 'react'

const CATEGORIES = [
  'מוצרי חלב', 'לחמים ומאפים', 'בשר', 'שימורים', 'ירקות', 'פירות',
  'קפואים', 'ניקיון', 'נייר וחד פעמי', 'טואלטיקה', 'שתייה', 'חטיפים וממתקים', 'אחר',
]

export default function ProductManager({ data }) {
  const { products, addProduct, updateProduct } = data
  const [name, setName] = useState('')
  const [category, setCategory] = useState('אחר')
  const [price, setPrice] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)

  const filtered = products.filter((p) => p.name.includes(search.trim()))

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    await addProduct(name.trim(), category, price ? Number(price) : null)
    setName(''); setPrice('')
  }

  return (
    <div>
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
