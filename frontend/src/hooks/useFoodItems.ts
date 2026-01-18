import { useEffect, useState, useCallback } from 'react';
import { foodItemService } from '../services/foodItemService';
import type { FoodItemWithCategory } from '../types';

export function useFoodItems(groupId: string | null) {
  const [foodItems, setFoodItems] = useState<FoodItemWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFoodItems = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      const data = await foodItemService.getFoodItems(groupId);
      setFoodItems(data);
      setError(null);
    } catch {
      setError('食材の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId) {
      setFoodItems([]);
      setLoading(false);
      return;
    }

    loadFoodItems();

    const subscription = foodItemService.subscribeToFoodItems(
      groupId,
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setFoodItems((prev) => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setFoodItems((prev) =>
            prev.map((item) => (item.id === payload.new.id ? payload.new : item))
          );
        } else if (payload.eventType === 'DELETE') {
          setFoodItems((prev) => prev.filter((item) => item.id !== payload.old.id));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [groupId, loadFoodItems]);

  return { foodItems, loading, error, reload: loadFoodItems };
}
