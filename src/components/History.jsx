import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import EmptyState from './EmptyState'

export default function History({ householdId }) {
  const [sessions, setSessions] = useState([])
  const [open, setOpen] = useState(null)
  const [openItems, setOpenItems] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('shopping_sessions')
        .select('*')
        .eq('household_id', householdId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
      setSessions(data || [])
    }
    if (householdId) load()
  }, [householdId])

  async function openSession(session) {
    setOpen(session)
    const { data } = await supabase
      .from('shopping_session_items')
      .select('*, products(name, category)')
      .eq('shopping_session_id', session.id)
      .eq('purchased', true)
    setOpenItems(data || [])
  }

  if (sessions.length === 0) {
    return <EmptyState icon="🧾" title="עדיין אין קניות בהיסטוריה" />
  }

  return (
    <div>
      {sessions.map((s) => (
        <div key={s.id} className="history-card" onClick={() => openSession(s)}>
          <div>
            <div className="date">{new Date(s.completed_at).toLocaleDateString('he-IL')}</div>
            <div className="meta">{new Date(s.completed_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div className="total">₪{Number(s.total_amount).toFixed(2)}</div>
        </div>
      ))}

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>
              קנייה מ-{new Date(open.completed_at).toLocaleDateString('he-IL')}
            </h3>
            {openItems.map((i) => (
              <div key={i.id} className="item-row">
                <div className="info">
                  <div className="name">{i.products?.name}</div>
                  <div className="cat">{i.products?.category}</div>
                </div>
                <div style={{ fontWeight: 600 }}>₪{Number(i.price || 0).toFixed(2)}</div>
              </div>
            ))}
            <div className="receipt-total" style={{ margin: '12px 0 0', borderRadius: 'var(--radius)' }}>
              <div className="label">סה"כ</div>
              <div className="amount">₪{Number(open.total_amount).toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
