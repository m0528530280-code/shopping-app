import { useState } from 'react'
import EmptyState from './EmptyState'

export default function MealIdeas({ extras, shoppingData }) {
  const { mealIdeas, customLists, createIdea, deleteIdea, addListItems } = extras
  const { addIngredientsToList } = shoppingData

  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [ingredientsText, setIngredientsText] = useState('')

  const [openIdea, setOpenIdea] = useState(null)
  const [deletingIdea, setDeletingIdea] = useState(null)
  const [pushing, setPushing] = useState(false)
  const [pushMsg, setPushMsg] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    if (!title.trim()) return
    await createIdea({ title, notes, ingredientsText })
    setTitle(''); setNotes(''); setIngredientsText('')
    setCreating(false)
  }

  async function confirmDeleteIdea() {
    await deleteIdea(deletingIdea.id)
    setDeletingIdea(null)
    if (openIdea?.id === deletingIdea.id) setOpenIdea(null)
  }

  async function pushToMainList() {
    const lines = (openIdea.ingredients_text || '').split('\n')
    await addIngredientsToList(lines)
    setPushMsg('נוסף לרשימה הרגילה')
    setPushing(false)
  }

  async function pushToCustomList(listId) {
    const lines = (openIdea.ingredients_text || '').split('\n')
    await addListItems(listId, lines)
    setPushMsg('נוסף לרשימה')
    setPushing(false)
  }

  if (openIdea) {
    const ingredients = (openIdea.ingredients_text || '').split('\n').map((l) => l.trim()).filter(Boolean)
    return (
      <div>
        <button className="auth-link" style={{ marginTop: 0, marginBottom: 10 }} onClick={() => { setOpenIdea(null); setPushMsg('') }}>
          → חזרה לרעיונות
        </button>
        <div className="cat-header" style={{ fontSize: 16, textTransform: 'none', color: 'var(--ink)' }}>{openIdea.title}</div>

        {openIdea.notes && (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, margin: '8px 0 16px' }}>{openIdea.notes}</p>
        )}

        {ingredients.length > 0 && (
          <>
            <div className="cat-header">מרכיבים</div>
            {ingredients.map((ing, i) => (
              <div key={i} className="item-row">
                <div className="info"><div className="name">{ing}</div></div>
              </div>
            ))}

            <button
              className="btn btn-primary btn-full"
              style={{ marginTop: 14 }}
              onClick={() => setPushing(true)}
            >
              הוסף מרכיבים לרשימה
            </button>
          </>
        )}

        {pushMsg && <div className="auth-message" style={{ marginTop: 10 }}>{pushMsg}</div>}

        <button
          className="circle-btn danger"
          title="מחיקת רעיון"
          style={{ marginTop: 14 }}
          onClick={() => setDeletingIdea(openIdea)}
        >🗑</button>

        {pushing && (
          <div className="modal-backdrop" onClick={() => setPushing(false)}>
            <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontFamily: 'var(--font-display)' }}>לאיזו רשימה להוסיף?</h3>
              <button className="btn btn-primary btn-full" style={{ marginBottom: 8 }} onClick={pushToMainList}>
                הרשימה הרגילה
              </button>
              {customLists.map((list) => (
                <button
                  key={list.id}
                  className="btn btn-outline btn-full"
                  style={{ marginBottom: 8 }}
                  onClick={() => pushToCustomList(list.id)}
                >
                  {list.name}
                </button>
              ))}
              <button className="btn btn-outline btn-full" onClick={() => setPushing(false)}>ביטול</button>
            </div>
          </div>
        )}

        {deletingIdea && (
          <div className="modal-backdrop" onClick={() => setDeletingIdea(null)}>
            <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontFamily: 'var(--font-display)' }}>למחוק את "{deletingIdea.title}"?</h3>
              <button
                className="btn btn-full"
                style={{ background: 'var(--brick)', color: 'white', marginBottom: 8 }}
                onClick={confirmDeleteIdea}
              >
                מחיקה
              </button>
              <button className="btn btn-outline btn-full" onClick={() => setDeletingIdea(null)}>ביטול</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (creating) {
    return (
      <div>
        <button className="auth-link" style={{ marginTop: 0, marginBottom: 10 }} onClick={() => setCreating(false)}>
          → ביטול
        </button>
        <form onSubmit={handleCreate}>
          <input
            className="search-box"
            placeholder="כותרת (למשל: עוגת שוקולד)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className="search-box"
            placeholder="הערות (אופציונלי)"
            rows={2}
            style={{ resize: 'vertical' }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <textarea
            className="search-box"
            placeholder={'מרכיבים - שורה לכל מרכיב\nלמשל:\nקמח\nביצים\nסוכר'}
            rows={6}
            style={{ resize: 'vertical' }}
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
          />
          <button className="btn btn-primary btn-full">שמירה</button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <button className="btn btn-primary btn-full" style={{ marginBottom: 14 }} onClick={() => setCreating(true)}>
        רעיון חדש
      </button>

      {mealIdeas.length === 0 ? (
        <EmptyState icon="🍽️" title="אין עדיין רעיונות לארוחה" subtitle="הוסיפו רעיון למעלה" />
      ) : (
        mealIdeas.map((idea) => (
          <div key={idea.id} className="history-card" onClick={() => setOpenIdea(idea)}>
            <div>
              <div className="date">{idea.title}</div>
              <div className="meta">{new Date(idea.created_at).toLocaleDateString('he-IL')}</div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
