import { supabase } from '../lib/supabaseClient';
import type { FoodItemWithCategory, CreateFoodItemForm, UpdateFoodItemForm } from '../types';

export const foodItemService = {
  async getFoodItems(groupId: string): Promise<FoodItemWithCategory[]> {
    const { data, error } = await supabase
      .from('food_items')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('group_id', groupId)
      .order('expiry_date', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data || [];
  },

  async getFoodItem(id: string): Promise<FoodItemWithCategory | null> {
    const { data, error } = await supabase
      .from('food_items')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createFoodItem(groupId: string, form: CreateFoodItemForm): Promise<FoodItemWithCategory> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('認証されていません');

    const { data, error } = await supabase
      .from('food_items')
      .insert({
        group_id: groupId,
        created_by: user.id,
        ...form,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateFoodItem(form: UpdateFoodItemForm): Promise<FoodItemWithCategory> {
    const { id, ...updates } = form;

    const { data, error } = await supabase
      .from('food_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFoodItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('food_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  subscribeToFoodItems(groupId: string, callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: FoodItemWithCategory;
    old: { id: string };
  }) => void) {
    return supabase
      .channel(`food_items:${groupId}`)
      .on(
        'postgres_changes' as const,
        {
          event: '*',
          schema: 'public',
          table: 'food_items',
          filter: `group_id=eq.${groupId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback as any
      )
      .subscribe();
  },
};
