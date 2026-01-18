import { useEffect, useState, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import type { NotificationSettings, ExpiringFoodItem } from '../types';

export function useNotificationSettings(groupId?: string) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationService.getSettings(groupId);
      setSettings(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (data: Partial<NotificationSettings>) => {
    try {
      const updated = await notificationService.upsertSettings(
        {
          days_before_expiry: data.days_before_expiry || [1, 3, 7],
          push_enabled: data.push_enabled ?? true,
          email_enabled: data.email_enabled ?? false,
          notification_time: data.notification_time || '09:00:00',
          notify_expired: data.notify_expired ?? true,
          notify_warning: data.notify_warning ?? true,
          notify_caution: data.notify_caution ?? true,
        },
        groupId
      );
      setSettings(updated);
      return updated;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings,
  };
}

export function useExpiringItems(groupId: string | null) {
  const [items, setItems] = useState<ExpiringFoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!groupId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await notificationService.getExpiringItems(groupId);
      setItems(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const expired = items.filter((i) => i.expiry_status === 'expired');
  const warning = items.filter((i) => i.expiry_status === 'warning');
  const caution = items.filter((i) => i.expiry_status === 'caution');
  const safe = items.filter((i) => i.expiry_status === 'safe');

  return {
    items,
    expired,
    warning,
    caution,
    safe,
    loading,
    error,
    refetch: fetchItems,
  };
}

export function usePushNotification() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    try {
      const perm = await notificationService.requestPermission();
      setPermission(perm);
      return perm;
    } catch (err) {
      console.error('通知許可リクエストエラー:', err);
      return 'denied' as NotificationPermission;
    }
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    notificationService.showNotification(title, options);
  };

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
  };
}
