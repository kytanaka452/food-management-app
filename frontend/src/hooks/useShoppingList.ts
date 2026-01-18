import { useEffect, useState, useCallback } from 'react';
import { shoppingListService } from '../services/shoppingListService';
import type { ShoppingList, ShoppingListItem, CreateShoppingListItemForm } from '../types';

export function useShoppingLists(groupId: string | null) {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    if (!groupId) {
      setLists([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await shoppingListService.getLists(groupId);
      setLists(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    if (!groupId) return;

    const subscription = shoppingListService.subscribeToLists(groupId, () => {
      fetchLists();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [groupId, fetchLists]);

  const createList = async (name: string) => {
    if (!groupId) throw new Error('グループが選択されていません');
    const newList = await shoppingListService.createList(groupId, { name });
    setLists((prev) => [newList, ...prev]);
    return newList;
  };

  const deleteList = async (listId: string) => {
    await shoppingListService.deleteList(listId);
    setLists((prev) => prev.filter((l) => l.id !== listId));
  };

  return {
    lists,
    loading,
    error,
    createList,
    deleteList,
    refetch: fetchLists,
  };
}

export function useShoppingListItems(listId: string | null) {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!listId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await shoppingListService.getItems(listId);
      setItems(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (!listId) return;

    const subscription = shoppingListService.subscribeToList(listId, (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setItems((prev) => [...prev, payload.new].sort((a, b) => {
          if (a.is_purchased !== b.is_purchased) {
            return a.is_purchased ? 1 : -1;
          }
          return a.sort_order - b.sort_order;
        }));
      } else if (payload.eventType === 'UPDATE') {
        setItems((prev) =>
          prev
            .map((item) => (item.id === payload.new.id ? payload.new : item))
            .sort((a, b) => {
              if (a.is_purchased !== b.is_purchased) {
                return a.is_purchased ? 1 : -1;
              }
              return a.sort_order - b.sort_order;
            })
        );
      } else if (payload.eventType === 'DELETE') {
        setItems((prev) => prev.filter((item) => item.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [listId]);

  const addItem = async (data: CreateShoppingListItemForm) => {
    if (!listId) throw new Error('リストが選択されていません');
    const newItem = await shoppingListService.addItem(listId, data);
    setItems((prev) => [...prev, newItem].sort((a, b) => {
      if (a.is_purchased !== b.is_purchased) {
        return a.is_purchased ? 1 : -1;
      }
      return a.sort_order - b.sort_order;
    }));
    return newItem;
  };

  const togglePurchased = async (itemId: string) => {
    const updatedItem = await shoppingListService.togglePurchased(itemId);
    setItems((prev) =>
      prev
        .map((item) => (item.id === itemId ? updatedItem : item))
        .sort((a, b) => {
          if (a.is_purchased !== b.is_purchased) {
            return a.is_purchased ? 1 : -1;
          }
          return a.sort_order - b.sort_order;
        })
    );
  };

  const deleteItem = async (itemId: string) => {
    await shoppingListService.deleteItem(itemId);
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearPurchased = async () => {
    if (!listId) return;
    await shoppingListService.clearPurchasedItems(listId);
    setItems((prev) => prev.filter((item) => !item.is_purchased));
  };

  const markAllPurchased = async () => {
    if (!listId) return;
    await shoppingListService.markAllAsPurchased(listId);
    await fetchItems();
  };

  return {
    items,
    loading,
    error,
    addItem,
    togglePurchased,
    deleteItem,
    clearPurchased,
    markAllPurchased,
    refetch: fetchItems,
  };
}
