import { useState } from 'react'
import { useExtras } from '../hooks/useExtras'
import CustomLists from './CustomLists'
import MealIdeas from './MealIdeas'

export default function MoreHub({ householdId, shoppingData }) {
  const extras = useExtras(householdId)
  const [section, setSection] = useState('lists') // lists | ideas

  return (
    <div>
      <div className="filter-pills">
        <button className={section === 'lists' ? 'active' : ''} onClick={() => setSection('lists')}>רשימות מיוחדות</button>
        <button className={section === 'ideas' ? 'active' : ''} onClick={() => setSection('ideas')}>רעיונות לארוחה</button>
      </div>

      {section === 'lists' && <CustomLists extras={extras} />}
      {section === 'ideas' && <MealIdeas extras={extras} shoppingData={shoppingData} />}
    </div>
  )
}
