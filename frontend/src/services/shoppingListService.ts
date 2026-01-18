import { supabase } from '../lib/supabaseClient';
import type {
  ShoppingList,
  ShoppingListItem,
  CreateShoppingListForm,
  CreateShoppingListItemForm,
} from '../types';

export const shoppingListService = {
  // =============================================
  // 買い物リスト操作
  // =============================================

  async createList(groupId: string, data: CreateShoppingListForm): Promise<ShoppingList> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('認証が必要です');

    const { data: list, error } = await supabase
      .from('shopping_lists')
      .insert({
        group_id: groupId,
        name: data.name,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return list;
  },

  async getLists(groupId: string): Promise<ShoppingList[]> {
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getList(listId: string): Promise<ShoppingList | null> {
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('id', listId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateList(listId: string, updates: Partial<ShoppingList>): Promise<ShoppingList> {
    const { data, error } = await supabase
      .from('shopping_lists')
      .update(updates)
      .eq('id', listId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteList(listId: string): Promise<void> {
    const { error } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', listId);

    if (error) throw error;
  },

  async archiveList(listId: string): Promise<void> {
    const { error } = await supabase
      .from('shopping_lists')
      .update({ is_active: false })
      .eq('id', listId);

    if (error) throw error;
  },

  // =============================================
  // 買い物リストアイテム操作
  // =============================================

  async getItems(listId: string): Promise<ShoppingListItem[]> {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('*, category:categories(*)')
      .eq('list_id', listId)
      .order('is_purchased', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addItem(listId: string, data: CreateShoppingListItemForm): Promise<ShoppingListItem> {
    // 最大のsort_orderを取得
    const { data: maxOrderData } = await supabase
      .from('shopping_list_items')
      .select('sort_order')
      .eq('list_id', listId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = maxOrderData && maxOrderData.length > 0
      ? maxOrderData[0].sort_order + 1
      : 0;

    const { data: item, error } = await supabase
      .from('shopping_list_items')
      .insert({
        list_id: listId,
        name: data.name,
        quantity: data.quantity,
        category_id: data.category_id,
        sort_order: nextOrder,
      })
      .select()
      .single();

    if (error) throw error;
    return item;
  },

  async updateItem(itemId: string, updates: Partial<ShoppingListItem>): Promise<ShoppingListItem> {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async togglePurchased(itemId: string): Promise<ShoppingListItem> {
    const { data: { user } } = await supabase.auth.getUser();

    // 現在の状態を取得
    const { data: currentItem, error: fetchError } = await supabase
      .from('shopping_list_items')
      .select('is_purchased')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;

    const newPurchased = !currentItem.is_purchased;
    const { data, error } = await supabase
      .from('shopping_list_items')
      .update({
        is_purchased: newPurchased,
        purchased_at: newPurchased ? new Date().toISOString() : null,
        purchased_by: newPurchased ? user?.id : null,
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  },

  async reorderItems(_listId: string, itemIds: string[]): Promise<void> {
    // トランザクション的に並び替えを更新
    const updates = itemIds.map((id, index) => ({
      id,
      sort_order: index,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);

      if (error) throw error;
    }
  },

  async clearPurchasedItems(listId: string): Promise<void> {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('list_id', listId)
      .eq('is_purchased', true);

    if (error) throw error;
  },

  async markAllAsPurchased(listId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('shopping_list_items')
      .update({
        is_purchased: true,
        purchased_at: new Date().toISOString(),
        purchased_by: user?.id,
      })
      .eq('list_id', listId)
      .eq('is_purchased', false);

    if (error) throw error;
  },

  // =============================================
  // 購入済みアイテムを食材に変換
  // =============================================

  async convertToFoodItem(
    itemId: string,
    groupId: string,
    additionalData?: {
      quantity?: number;
      unit?: string;
      expiry_date?: string;
      storage_location?: string;
    }
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('認証が必要です');

    // アイテム情報を取得
    const { data: item, error: fetchError } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;

    // 食材として追加
    const { error: insertError } = await supabase
      .from('food_items')
      .insert({
        group_id: groupId,
        name: item.name,
        category_id: item.category_id,
        quantity: additionalData?.quantity || 1,
        unit: additionalData?.unit,
        expiry_date: additionalData?.expiry_date,
        storage_location: additionalData?.storage_location,
        created_by: user.id,
      });

    if (insertError) throw insertError;

    // 買い物リストからアイテムを削除
    const { error: deleteError } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) throw deleteError;
  },

  // =============================================
  // リアルタイム購読
  // =============================================

  subscribeToList(listId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`shopping_list_items:${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list_items',
          filter: `list_id=eq.${listId}`,
        },
        callback
      )
      .subscribe();
  },

  subscribeToLists(groupId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`shopping_lists:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_lists',
          filter: `group_id=eq.${groupId}`,
        },
        callback
      )
      .subscribe();
  },
};
