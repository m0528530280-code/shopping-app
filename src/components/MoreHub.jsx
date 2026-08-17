import { useState } from 'react'
import { useExtras } from '../hooks/useExtras'
import CustomLists from './CustomLists'
import MealIdeas from './MealIdeas'
import ProductManager from './ProductManager'
import History from './History'

const SECTIONS = [
  { id: 'products', label: 'מוצרים', icon: '📦' },
  { id: 'history', label: 'היסטוריה', icon: '🧾' },
  { id: 'lists', label: 'רשימות מיוחדות', icon: '🗂️' },
  { id: 'ideas', label: 'רעיונות לארוחה', icon: '🍽️' },
]

export default function MoreHub({ householdId, shoppingData }) {
  const extras = useExtras(householdId)
  const [section, setSection] = useState('products')

  return (
    <div>
      <div className="more-grid">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={`more-tile ${section === s.id ? 'active' : ''}`}
            onClick={() => setSection(s.id)}
          >
            <span className="icon">{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {section === 'products' && <ProductManager data={shoppingData} />}
      {section === 'history' && <History householdId={householdId} />}
      {section === 'lists' && <CustomLists extras={extras} />}
      {section === 'ideas' && <MealIdeas extras={extras} shoppingData={shoppingData} />}
    </div>
  )
}
