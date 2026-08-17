import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useExtras(householdId) {
  const [customLists, setCustomLists] = useState([])
  const [mealIdeas, setMealIdeas] = useState([])

  const reload = useCallback(async () => {
    if (!householdId) return
    const [{ data: lists }, { data: ideas }] = await Promise.all([
      supabase.from('custom_lists').select('*').eq('household_id', householdId).order('created_at', { ascending: false }),
      supabase.from('meal_ideas').select('*').eq('household_id', householdId).order('created_at', { ascending: false }),
    ])
    setCustomLists(lists || [])
    setMealIdeas(ideas || [])
  }, [householdId])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (!householdId) return
    const channel = supabase
      .channel(`extras-${householdId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_lists', filter: `household_id=eq.${householdId}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_list_items' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_ideas', filter: `household_id=eq.${householdId}` }, reload)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId, reload])

  // -- Custom lists --

  async function createList(name) {
    const { data, error } = await supabase
      .from('custom_lists')
      .insert({ household_id: householdId, name })
      .select()
      .single()
    if (error) throw error
    await reload()
    return data
  }

  async function deleteList(listId) {
    await supabase.from('custom_lists').delete().eq('id', listId)
    await reload()
  }

  async function getListItems(listId) {
    const { data } = await supabase
      .from('custom_list_items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true })
    return data || []
  }

  async function addListItem(listId, text) {
    if (!text.trim()) return
    await supabase.from('custom_list_items').insert({ list_id: listId, text: text.trim() })
  }

  async function toggleListItem(itemId, checked) {
    await supabase.from('custom_list_items').update({ checked }).eq('id', itemId)
  }

  async function deleteListItem(itemId) {
    await supabase.from('custom_list_items').delete().eq('id', itemId)
  }

  return {
    customLists,
    mealIdeas,
    reload,
    createList,
    deleteList,
    getListItems,
    addListItem,
    toggleListItem,
    deleteListItem,
  }
}
