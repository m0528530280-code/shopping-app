import { useEffect, useState } from 'react'
import CheckIcon from './CheckIcon'
import EmptyState from './EmptyState'

export default function CustomLists({ extras }) {
  const { customLists, createList, deleteList, getListItems, addListItem, toggleListItem, deleteListItem } = extras
  const [newListName, setNewListName] = useState('')
  const [openList, setOpenList] = useState(null)
  const [items, setItems] = useState([])
  const [newItemText, setNewItemText] = useState('')
  const [deletingList, setDeletingList] = useState(null)

  async function loadItems(list) {
    setOpenList(list)
    const rows = await getListItems(list.id)
    setItems(rows)
  }

  useEffect(() => {
    if (openList) loadItems(openList)
  }, [customLists]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreateList(e) {
    e.preventDefault()
    if (!newListName.trim()) return
    const list = await createList(newListName.trim())
    setNewListName('')
    await loadItems(list)
  }

  async function handleAddItem(e) {
    e.preventDefault()
    if (!newItemText.trim()) return
    await addListItem(openList.id, newItemText)
    setNewItemText('')
    await loadItems(openList)
  }

  async function handleToggle(item) {
    await toggleListItem(item.id, !item.checked)
    await loadItems(openList)
  }

  async function handleDeleteItem(item) {
    await deleteListItem(item.id)
    await loadItems(openList)
  }

  async function confirmDeleteList() {
    await deleteList(deletingList.id)
    setDeletingList(null)
    if (openList?.id === deletingList.id) setOpenList(null)
  }

  if (openList) {
    return (
      <div>
        <button className="auth-link" style={{ marginTop: 0, marginBottom: 10 }} onClick={() => setOpenList(null)}>
          → חזרה לרשימות
        </button>
        <div className="cat-header" style={{ fontSize: 16, textTransform: 'none', color: 'var(--ink)' }}>{openList.name}</div>

        <form onSubmit={handleAddItem} className="item-row" style={{ marginTop: 10 }}>
          <input
            className="search-box"
            style={{ margin: 0, flex: 1 }}
            placeholder="הוסף פריט..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
          />
          <button className="btn btn-primary">הוסף</button>
        </form>

        {items.length === 0 ? (
          <EmptyState icon="📋" title="הרשימה ריקה" subtitle="הוסיפו פריט למעלה" />
        ) : (
          items.map((item) => (
            <div key={item.id} className={`item-row ${item.checked ? 'purchased' : ''}`}>
              <button
                className={`circle-btn ${item.checked ? 'purchased-on' : ''}`}
                onClick={() => handleToggle(item)}
              >{item.checked && <CheckIcon />}</button>
              <div className="info">
                <div className="name">{item.text}</div>
              </div>
              <button className="circle-btn danger" title="מחיקה" onClick={() => handleDeleteItem(item)}>✕</button>
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={handleCreateList} className="item-row">
        <input
          className="search-box"
          style={{ margin: 0, flex: 1 }}
          placeholder="שם רשימה חדשה (למשל: מנגל שישי)"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
        />
        <button className="btn btn-primary">צור</button>
      </form>

      {customLists.length === 0 ? (
        <EmptyState icon="🗂️" title="אין עדיין רשימות מיוחדות" subtitle="צרו רשימה חדשה למעלה" />
      ) : (
        customLists.map((list) => (
          <div key={list.id} className="history-card" onClick={() => loadItems(list)}>
            <div>
              <div className="date">{list.name}</div>
              <div className="meta">{new Date(list.created_at).toLocaleDateString('he-IL')}</div>
            </div>
            <button
              className="circle-btn danger"
              title="מחיקה"
              onClick={(e) => { e.stopPropagation(); setDeletingList(list) }}
            >🗑</button>
          </div>
        ))
      )}

      {deletingList && (
        <div className="modal-backdrop" onClick={() => setDeletingList(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>למחוק את "{deletingList.name}"?</h3>
            <p style={{ color: 'var(--ink-soft)' }}>כל הפריטים ברשימה יימחקו לצמיתות. לא ניתן לבטל פעולה זו.</p>
            <button
              className="btn btn-full"
              style={{ background: 'var(--brick)', color: 'white', marginBottom: 8 }}
              onClick={confirmDeleteList}
            >
              מחיקה
            </button>
            <button className="btn btn-outline btn-full" onClick={() => setDeletingList(null)}>ביטול</button>
          </div>
        </div>
      )}
    </div>
  )
}
