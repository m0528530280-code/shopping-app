import { useState } from 'react'
import CheckIcon from './CheckIcon'
import EmptyState from './EmptyState'

function parseIngredients(text) {
  const names = []
  const seen = new Set()
  for (const raw of (text || '').split('\n')) {
    const name = raw.trim()
    const key = name.toLowerCase()
    if (!name || seen.has(key)) continue
    seen.add(key)
    names.push(name)
  }
  return names
}

export default function MealIdeas({ extras, shoppingData }) {
  const { mealIdeas, customLists, createIdea, deleteIdea, addListItems, getListItems } = extras
  const { addIngredientsToList, products, listItems } = shoppingData

  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [ingredientsText, setIngredientsText] = useState('')

  const [openIdea, setOpenIdea] = useState(null)
  const [deletingIdea, setDeletingIdea] = useState(null)
  const [pushMsg, setPushMsg] = useState('')

  const [pickingTarget, setPickingTarget] = useState(false)
  const [reviewTarget, setReviewTarget] = useState(null) // 'main' | custom list object
  const [reviewItems, setReviewItems] = useState([]) // [{ name, alreadyExists, include }]

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

  async function openReview(target) {
    const names = parseIngredients(openIdea.ingredients_text)
    let existingNames
    if (target === 'main') {
      const productByName = new Map(products.map((p) => [p.name.trim().toLowerCase(), p.id]))
      const neededProductIds = new Set(listItems.map((li) => li.product_id))
      existingNames = new Set(
        names.filter((n) => {
          const pid = productByName.get(n.toLowerCase())
          return pid && neededProductIds.has(pid)
        }).map((n) => n.toLowerCase())
      )
    } else {
      const items = await getListItems(target.id)
      const itemTexts = new Set(items.map((i) => i.text.trim().toLowerCase()))
      existingNames = new Set(names.filter((n) => itemTexts.has(n.toLowerCase())).map((n) => n.toLowerCase()))
    }
    setReviewItems(names.map((name) => ({
      name,
      alreadyExists: existingNames.has(name.toLowerCase()),
      include: !existingNames.has(name.toLowerCase()),
    })))
    setReviewTarget(target)
    setPickingTarget(false)
  }

  function toggleReviewItem(index) {
    setReviewItems((prev) => prev.map((it, i) => i === index ? { ...it, include: !it.include } : it))
  }

  async function confirmPush() {
    const selected = reviewItems.filter((it) => it.include).map((it) => it.name)
    if (selected.length) {
      if (reviewTarget === 'main') {
        await addIngredientsToList(selected)
        setPushMsg('נוסף לרשימה הרגילה')
      } else {
        await addListItems(reviewTarget.id, selected)
        setPushMsg(`נוסף לרשימה "${reviewTarget.name}"`)
      }
    }
    setReviewTarget(null)
    setReviewItems([])
  }

  if (openIdea) {
    const ingredients = parseIngredients(openIdea.ingredients_text)
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
              onClick={() => customLists.length ? setPickingTarget(true) : openReview('main')}
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

        {pickingTarget && (
          <div className="modal-backdrop" onClick={() => setPickingTarget(false)}>
            <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontFamily: 'var(--font-display)' }}>לאיזו רשימה להוסיף?</h3>
              <button className="btn btn-primary btn-full" style={{ marginBottom: 8 }} onClick={() => openReview('main')}>
                הרשימה הרגילה
              </button>
              {customLists.map((list) => (
                <button
                  key={list.id}
                  className="btn btn-outline btn-full"
                  style={{ marginBottom: 8 }}
                  onClick={() => openReview(list)}
                >
                  {list.name}
                </button>
              ))}
              <button className="btn btn-outline btn-full" onClick={() => setPickingTarget(false)}>ביטול</button>
            </div>
          </div>
        )}

        {reviewTarget && (
          <div className="modal-backdrop" onClick={() => { setReviewTarget(null); setReviewItems([]) }}>
            <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontFamily: 'var(--font-display)' }}>אילו מרכיבים להוסיף?</h3>
              <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 10 }}>
                בטלו סימון של מרכיב כדי לא להוסיף אותו.
              </p>
              {reviewItems.map((item, i) => (
                <div key={i} className="item-row">
                  <button
                    className={`circle-btn ${item.include ? 'needed-on' : ''}`}
                    onClick={() => toggleReviewItem(i)}
                  >{item.include && <CheckIcon />}</button>
                  <div className="info">
                    <div className="name">{item.name}</div>
                    {item.alreadyExists && (
                      <div className="cat" style={{ color: 'var(--brick)' }}>
                        ⚠️ כבר ברשימה - יתווסף בכמות כפולה
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button className="btn btn-primary btn-full" style={{ marginTop: 10, marginBottom: 8 }} onClick={confirmPush}>
                הוספה
              </button>
              <button className="btn btn-outline btn-full" onClick={() => { setReviewTarget(null); setReviewItems([]) }}>ביטול</button>
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
