import { supabase } from '../lib/supabaseClient';
import type {
  NotificationSettings,
  PushSubscription,
  ExpiringFoodItem,
  CreateNotificationSettingsForm,
} from '../types';

export const notificationService = {
  // =============================================
  // 通知設定
  // =============================================

  async getSettings(groupId?: string): Promise<NotificationSettings | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('認証が必要です');

    let query = supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id);

    if (groupId) {
      query = query.eq('group_id', groupId);
    } else {
      query = query.is('group_id', null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    return data;
  },

  async upsertSettings(
    data: CreateNotificationSettingsForm,
    groupId?: string
  ): Promise<NotificationSettings> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('認証が必要です');

    const { data: settings, error } = await supabase
      .from('notification_settings')
      .upsert(
        {
          user_id: user.id,
          group_id: groupId || null,
          ...data,
        },
        {
          onConflict: 'user_id,group_id',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return settings;
  },

  // =============================================
  // プッシュ通知サブスクリプション
  // =============================================

  async savePushSubscription(subscription: PushSubscriptionJSON): Promise<PushSubscription> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('認証が必要です');

    if (!subscription.endpoint || !subscription.keys) {
      throw new Error('無効なサブスクリプション');
    }

    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          user_agent: navigator.userAgent,
        },
        {
          onConflict: 'user_id,endpoint',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removePushSubscription(endpoint: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('認証が必要です');

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);

    if (error) throw error;
  },

  async getPushSubscriptions(): Promise<PushSubscription[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('認証が必要です');

    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;
    return data || [];
  },

  // =============================================
  // 期限切れ食材の取得
  // =============================================

  async getExpiringItems(groupId: string): Promise<ExpiringFoodItem[]> {
    const { data, error } = await supabase
      .from('food_items')
      .select('*, category:categories(*)')
      .eq('group_id', groupId)
      .not('expiry_date', 'is', null)
      .order('expiry_date', { ascending: true });

    if (error) throw error;

    // 期限ステータスを計算
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (data || []).map((item) => {
      const expiryDate = new Date(item.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let expiry_status: 'expired' | 'warning' | 'caution' | 'safe';
      if (diffDays < 0) {
        expiry_status = 'expired';
      } else if (diffDays <= 3) {
        expiry_status = 'warning';
      } else if (diffDays <= 7) {
        expiry_status = 'caution';
      } else {
        expiry_status = 'safe';
      }

      return {
        ...item,
        category_name: item.category?.name,
        expiry_status,
        days_until_expiry: diffDays,
      };
    });
  },

  async getExpiringItemsForAlert(
    groupId: string,
    daysBeforeExpiry: number[]
  ): Promise<ExpiringFoodItem[]> {
    const items = await this.getExpiringItems(groupId);

    // 指定された日数以内の食材をフィルター
    return items.filter((item) => {
      if (item.days_until_expiry < 0) return true; // 期限切れ
      return daysBeforeExpiry.some((days) => item.days_until_expiry <= days);
    });
  },

  // =============================================
  // ブラウザ通知
  // =============================================

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('このブラウザは通知をサポートしていません');
    }

    const permission = await Notification.requestPermission();
    return permission;
  },

  getPermission(): NotificationPermission | null {
    if (!('Notification' in window)) {
      return null;
    }
    return Notification.permission;
  },

  showNotification(title: string, options?: NotificationOptions): void {
    if (!('Notification' in window)) {
      console.warn('このブラウザは通知をサポートしていません');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/vite.svg',
        badge: '/vite.svg',
        ...options,
      });
    }
  },

  // 期限切れ通知を表示
  showExpiryNotifications(items: ExpiringFoodItem[]): void {
    const expired = items.filter((i) => i.expiry_status === 'expired');
    const warning = items.filter((i) => i.expiry_status === 'warning');
    const caution = items.filter((i) => i.expiry_status === 'caution');

    if (expired.length > 0) {
      this.showNotification('期限切れの食材があります', {
        body: `${expired.map((i) => i.name).join(', ')} が期限切れです`,
        tag: 'expiry-expired',
      });
    }

    if (warning.length > 0) {
      this.showNotification('まもなく期限切れの食材', {
        body: `${warning.map((i) => i.name).join(', ')} は3日以内に期限が切れます`,
        tag: 'expiry-warning',
      });
    }

    if (caution.length > 0) {
      this.showNotification('期限が近い食材', {
        body: `${caution.map((i) => i.name).join(', ')} は7日以内に期限が切れます`,
        tag: 'expiry-caution',
      });
    }
  },

  // =============================================
  // Service Worker登録（PWA用）
  // =============================================

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workerがサポートされていません');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  },

  async subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscriptionJSON | null> {
    try {
      // VAPID公開鍵（本番環境では環境変数から取得）
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        console.warn('VAPID公開鍵が設定されていません');
        return null;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      return subscription.toJSON();
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  },
};
