import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useShoppingData } from './hooks/useShoppingData'
import Auth from './components/Auth'
import Nav from './components/Nav'
import ShoppingList from './components/ShoppingList'
import ShoppingMode from './components/ShoppingMode'
import ProductManager from './components/ProductManager'
import History from './components/History'
import EmptyState from './components/EmptyState'
import SkeletonList from './components/SkeletonList'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [profile, setProfile] = useState(null)
  const [tab, setTab] = useState('list')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user) { setProfile(null); return }
      const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single()
      setProfile(data)
    }
    loadProfile()
  }, [session])

  const shoppingData = useShoppingData(profile?.household_id, profile?.id)

  const pendingCount = shoppingData.listItems.filter((li) => {
    const si = shoppingData.sessionItems.find((i) => i.product_id === li.product_id)
    return !si?.purchased
  }).length

  if (session === undefined) return null // loading
  if (!session) return <Auth />
  if (!profile) {
    return (
      <EmptyState
        icon="⚠️"
        title="אין שיוך למשק בית"
        subtitle="המשתמש שלך לא משויך עדיין למשק בית. פנה למי שהקים את המערכת."
      />
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>רשימת קניות</h1>
        <div className="header-row">
          <p className="subtitle">שלום {profile.name} 👋</p>
          <button className="signout-link" onClick={() => supabase.auth.signOut()}>התנתקות</button>
        </div>
      </header>

      <main className="app-content">
        {shoppingData.loading ? (
          <SkeletonList />
        ) : (
          <div key={tab} className="tab-panel">
            {tab === 'list' && <ShoppingList data={shoppingData} />}
            {tab === 'shopping' && <ShoppingMode data={shoppingData} />}
            {tab === 'products' && <ProductManager data={shoppingData} />}
            {tab === 'history' && <History householdId={profile.household_id} />}
          </div>
        )}
      </main>

      <Nav active={tab} onChange={setTab} badge={pendingCount} />
    </div>
  )
}
