import { useExtras } from '../hooks/useExtras'
import CustomLists from './CustomLists'

export default function MoreHub({ householdId }) {
  const extras = useExtras(householdId)

  return (
    <div>
      <div className="cat-header" style={{ marginTop: 0 }}>רשימות מיוחדות</div>
      <CustomLists extras={extras} />
    </div>
  )
}
