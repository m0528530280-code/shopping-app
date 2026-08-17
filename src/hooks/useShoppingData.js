import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'

export function useShoppingData(householdId, userId) {
  const [products, setProducts] = useState([])
  const [listItems, setListItems] = useState([])       // shopping_list_items
  const [session, setSession] = useState(null)          // active shopping_sessions row
  const [sessionItems, setSessionItems] = useState([])  // shopping_session_items for active session
  const [loading, setLoading] = useState(true)

  const reloadAll = useCallback(async () => {
    if (!householdId) return
    const [{ data: prod }, { data: list }, { data: sess }] = await Promise.all([
      supabase.from('products').select('*').eq('household_id', householdId).order('name'),
      supabase.from('shopping_list_items').select('*').eq('household_id', householdId),
      supabase.from('shopping_sessions').select('*').eq('household_id', householdId).eq('status', 'active').order('started_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    setProducts(prod || [])
    setListItems(list || [])
    setSession(sess || null)
    if (sess) {
      const { data: items } = await supabase
        .from('shopping_session_items')
        .select('*')
        .eq('shopping_session_id', sess.id)
      setSessionItems(items || [])
    } else {
      setSessionItems([])
    }
    setLoading(false)
  }, [householdId])

  useEffect(() => {
    reloadAll()
  }, [reloadAll])

  // -- Realtime subscriptions --
  useEffect(() => {
    if (!householdId) return
    const channel = supabase
      .channel(`household-${householdId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list_items', filter: `household_id=eq.${householdId}` }, reloadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_sessions', filter: `household_id=eq.${householdId}` }, reloadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_session_items' }, reloadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `household_id=eq.${householdId}` }, reloadAll)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId, reloadAll])

  // -- Mutations --

  async function toggleNeeded(productId) {
    const existing = listItems.find((i) => i.product_id === productId)
    if (existing) {
      await supabase.from('shopping_list_items').delete().eq('id', existing.id)
    } else {
      const { error } = await supabase.from('shopping_list_items').insert({
        household_id: householdId,
        product_id: productId,
        needed: true,
        added_by: userId,
      })
      if (error && error.code !== '23505') throw error
    }
    await reloadAll()
  }

  async function setQty(productId, qty) {
    const existing = listItems.find((i) => i.product_id === productId)
    if (!existing) return
    await supabase.from('shopping_list_items').update({ qty: Math.max(1, qty) }).eq('id', existing.id)
    await reloadAll()
  }

  async function ensureActiveSession() {
    if (session) return session
    // double-check the DB directly in case state is stale - avoid ever creating a second active session
    const { data: existingActive } = await supabase
      .from('shopping_sessions')
      .select('*')
      .eq('household_id', householdId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (existingActive) {
      await reloadAll()
      return existingActive
    }
    const { data, error } = await supabase
      .from('shopping_sessions')
      .insert({ household_id: householdId, status: 'active' })
      .select()
      .single()
    if (error) throw error
    // seed session items from current list
    const rows = listItems.map((li) => ({
      shopping_session_id: data.id,
      product_id: li.product_id,
      purchased: false,
      updated_by: userId,
    }))
    if (rows.length) await supabase.from('shopping_session_items').insert(rows)
    await reloadAll()
    return data
  }

  async function togglePurchased(productId) {
    const sess = session || (await ensureActiveSession())
    // ensureActiveSession may have just seeded session items and reloaded state;
    // the sessionItems closure here can be stale, so re-check against the DB directly
    const { data: freshRows } = await supabase
      .from('shopping_session_items')
      .select('*')
      .eq('shopping_session_id', sess.id)
      .eq('product_id', productId)
    const existing = freshRows?.[0]
    const product = products.find((p) => p.id === productId)
    if (existing) {
      await supabase
        .from('shopping_session_items')
        .update({ purchased: !existing.purchased, updated_by: userId, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('shopping_session_items').insert({
        shopping_session_id: sess.id,
        product_id: productId,
        purchased: true,
        price: product?.default_price ?? null,
        updated_by: userId,
      })
    }
    await reloadAll()
  }

  async function completeSession(manualTotal) {
    if (!session) return
    const computed = sessionItems.reduce((sum, i) => sum + (i.purchased ? Number(i.price || 0) : 0), 0)
    const total = manualTotal !== undefined && !Number.isNaN(manualTotal) ? manualTotal : computed
    await supabase
      .from('shopping_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString(), total_amount: total, completed_by: userId })
      .eq('id', session.id)
    // reset the entire active list back to base state - nothing stays marked as needed
    await supabase
      .from('shopping_list_items')
      .delete()
      .eq('household_id', householdId)
    await reloadAll()
  }

  async function addProduct(name, category, defaultPrice) {
    await supabase.from('products').insert({
      household_id: householdId,
      name,
      category: category || 'אחר',
      default_price: defaultPrice || null,
    })
    await reloadAll()
  }

  async function updateProduct(id, fields) {
    await supabase.from('products').update(fields).eq('id', id)
    await reloadAll()
  }

  async function addProducts(items) {
    const existingNames = new Set(products.map((p) => p.name.trim().toLowerCase()))
    const rows = items
      .filter((it) => !existingNames.has(it.name.trim().toLowerCase()))
      .map((it) => ({
        household_id: householdId,
        name: it.name,
        category: it.category || 'אחר',
        default_price: it.default_price || null,
      }))
    if (rows.length) {
      const { error } = await supabase.from('products').insert(rows)
      if (error) throw error
    }
    await reloadAll()
    return rows.length
  }

  async function addIngredientsToList(lines) {
    const names = []
    const seen = new Set()
    for (const raw of lines) {
      const name = raw.trim()
      const key = name.toLowerCase()
      if (!name || seen.has(key)) continue
      seen.add(key)
      names.push(name)
    }
    if (!names.length) return

    const existingByName = new Map(products.map((p) => [p.name.trim().toLowerCase(), p.id]))
    const toCreate = names.filter((n) => !existingByName.has(n.toLowerCase()))
    const resolvedIds = names.filter((n) => existingByName.has(n.toLowerCase())).map((n) => existingByName.get(n.toLowerCase()))

    if (toCreate.length) {
      const { data: created, error } = await supabase
        .from('products')
        .insert(toCreate.map((name) => ({ household_id: householdId, name, category: 'אחר' })))
        .select()
      if (error) throw error
      resolvedIds.push(...created.map((p) => p.id))
    }

    const listItemByProduct = new Map(listItems.map((li) => [li.product_id, li]))
    const toInsert = []
    for (const id of resolvedIds) {
      const existing = listItemByProduct.get(id)
      if (existing) {
        // caller already confirmed adding this on top of an existing entry - bump quantity
        await supabase.from('shopping_list_items').update({ qty: (Number(existing.qty) || 1) + 1 }).eq('id', existing.id)
      } else {
        toInsert.push({ household_id: householdId, product_id: id, needed: true, added_by: userId, qty: 1 })
      }
    }
    if (toInsert.length) {
      await supabase.from('shopping_list_items').insert(toInsert)
    }
    await reloadAll()
  }

  return {
    loading,
    products,
    listItems,
    session,
    sessionItems,
    toggleNeeded,
    togglePurchased,
    setQty,
    ensureActiveSession,
    completeSession,
    addProduct,
    updateProduct,
    addProducts,
    addIngredientsToList,
    reloadAll,
  }
}
