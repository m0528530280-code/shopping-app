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
      supabase.from('shopping_sessions').select('*').eq('household_id', householdId).eq('status', 'active').maybeSingle(),
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
      await supabase.from('shopping_list_items').insert({
        household_id: householdId,
        product_id: productId,
        needed: true,
        added_by: userId,
      })
    }
  }

  async function ensureActiveSession() {
    if (session) return session
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
    const existing = sessionItems.find((i) => i.product_id === productId && i.shopping_session_id === sess.id)
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
  }

  async function setPrice(productId, price) {
    const sess = session || (await ensureActiveSession())
    const existing = sessionItems.find((i) => i.product_id === productId && i.shopping_session_id === sess.id)
    if (existing) {
      await supabase
        .from('shopping_session_items')
        .update({ price, updated_by: userId, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('shopping_session_items').insert({
        shopping_session_id: sess.id,
        product_id: productId,
        purchased: false,
        price,
        updated_by: userId,
      })
    }
  }

  async function completeSession() {
    if (!session) return
    const total = sessionItems.reduce((sum, i) => sum + (i.purchased ? Number(i.price || 0) : 0), 0)
    await supabase
      .from('shopping_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString(), total_amount: total, completed_by: userId })
      .eq('id', session.id)
    // reset active list - only remove items that were purchased; keep unpurchased ones for next round
    const purchasedIds = sessionItems.filter((i) => i.purchased).map((i) => i.product_id)
    if (purchasedIds.length) {
      await supabase
        .from('shopping_list_items')
        .delete()
        .eq('household_id', householdId)
        .in('product_id', purchasedIds)
    }
    await reloadAll()
  }

  async function addProduct(name, category, defaultPrice) {
    await supabase.from('products').insert({
      household_id: householdId,
      name,
      category: category || 'אחר',
      default_price: defaultPrice || null,
    })
  }

  async function updateProduct(id, fields) {
    await supabase.from('products').update(fields).eq('id', id)
  }

  return {
    loading,
    products,
    listItems,
    session,
    sessionItems,
    toggleNeeded,
    togglePurchased,
    setPrice,
    ensureActiveSession,
    completeSession,
    addProduct,
    updateProduct,
    reloadAll,
  }
}
