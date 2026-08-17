import { useState } from 'react'
import { useExtras } from '../hooks/useExtras'
import CustomLists from './CustomLists'
import MealIdeas from './MealIdeas'
import ProductManager from './ProductManager'
import History from './History'

const SECTIONS = [
  { id: 'products', label: 'מוצרים' },
  { id: 'history', label: 'היסטוריה' },
  { id: 'lists', label: 'רשימות מיוחדות' },
  { id: 'ideas', label: 'רעיונות לארוחה' },
]

export default function MoreHub({ householdId, shoppingData }) {
  const extras = useExtras(householdId)
  const [section, setSection] = useState('products')

  return (
    <div>
      <div className="filter-pills" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={section === s.id ? 'active' : ''}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setSection(s.id)}
          >
            {s.label}
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
