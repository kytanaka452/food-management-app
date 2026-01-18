import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationSettings, useExpiringItems, usePushNotification } from '../hooks/useNotification';
import { notificationService } from '../services/notificationService';
import Layout from '../components/Layout';

function ExpiringItemsList({ title, items, status }: { title: string; items: any[]; status: string }) {
  if (items.length === 0) return null;

  return (
    <div className={`expiring-section ${status}`}>
      <h3>
        {title} ({items.length})
      </h3>
      <ul className="expiring-items-list">
        {items.map((item) => (
          <li key={item.id} className="expiring-item">
            <span className="item-name">{item.name}</span>
            {item.category_name && (
              <span className="item-category">{item.category_name}</span>
            )}
            <span className="item-expiry">
              {item.days_until_expiry < 0
                ? `${Math.abs(item.days_until_expiry)}日前に期限切れ`
                : item.days_until_expiry === 0
                ? '今日が期限'
                : `あと${item.days_until_expiry}日`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function NotificationSettings() {
  const { currentGroup } = useAuth();
  const { settings, updateSettings } = useNotificationSettings(currentGroup?.id);
  const { expired, warning, caution } = useExpiringItems(currentGroup?.id || null);
  const { permission, isSupported, requestPermission } = usePushNotification();

  const [formData, setFormData] = useState({
    push_enabled: true,
    email_enabled: false,
    notification_time: '09:00',
    notify_expired: true,
    notify_warning: true,
    notify_caution: true,
    days_before_expiry: [1, 3, 7],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        push_enabled: settings.push_enabled,
        email_enabled: settings.email_enabled,
        notification_time: settings.notification_time?.slice(0, 5) || '09:00',
        notify_expired: settings.notify_expired,
        notify_warning: settings.notify_warning,
        notify_caution: settings.notify_caution,
        days_before_expiry: settings.days_before_expiry,
      });
    }
  }, [settings]);

  if (!currentGroup) {
    return (
      <Layout>
        <div className="empty-state">
          <p>グループを選択してください</p>
        </div>
      </Layout>
    );
  }

  const handleEnableNotifications = async () => {
    const perm = await requestPermission();
    if (perm === 'granted') {
      setMessage({ type: 'success', text: '通知が有効になりました' });
    } else {
      setMessage({ type: 'error', text: '通知が許可されませんでした' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleTestNotification = () => {
    notificationService.showNotification('テスト通知', {
      body: 'これはテスト通知です。通知が正常に動作しています。',
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      await updateSettings({
        push_enabled: formData.push_enabled,
        email_enabled: formData.email_enabled,
        notification_time: formData.notification_time + ':00',
        notify_expired: formData.notify_expired,
        notify_warning: formData.notify_warning,
        notify_caution: formData.notify_caution,
        days_before_expiry: formData.days_before_expiry,
      });
      setMessage({ type: 'success', text: '設定を保存しました' });
    } catch (err) {
      setMessage({ type: 'error', text: '設定の保存に失敗しました' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDaysChange = (day: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      days_before_expiry: checked
        ? [...prev.days_before_expiry, day].sort((a, b) => a - b)
        : prev.days_before_expiry.filter((d) => d !== day),
    }));
  };

  const totalExpiring = expired.length + warning.length + caution.length;

  return (
    <Layout>
      <div className="notification-settings-page">
        <div className="page-header">
          <h1>通知設定</h1>
        </div>

        {/* 期限切れサマリー */}
        <div className="expiry-summary card">
          <h2>賞味期限の状況</h2>
          {totalExpiring === 0 ? (
            <p className="no-expiring">期限が近い食材はありません</p>
          ) : (
            <div className="expiry-counts">
              <div className="count-item expired">
                <span className="count">{expired.length}</span>
                <span className="label">期限切れ</span>
              </div>
              <div className="count-item warning">
                <span className="count">{warning.length}</span>
                <span className="label">3日以内</span>
              </div>
              <div className="count-item caution">
                <span className="count">{caution.length}</span>
                <span className="label">7日以内</span>
              </div>
            </div>
          )}
        </div>

        {/* 期限切れ食材リスト */}
        {totalExpiring > 0 && (
          <div className="expiring-items card">
            <h2>期限が近い食材</h2>
            <ExpiringItemsList title="期限切れ" items={expired} status="expired" />
            <ExpiringItemsList title="3日以内" items={warning} status="warning" />
            <ExpiringItemsList title="7日以内" items={caution} status="caution" />
          </div>
        )}

        {/* 通知設定フォーム */}
        <div className="notification-form card">
          <h2>通知設定</h2>

          {message && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}

          {/* ブラウザ通知の許可状況 */}
          <div className="setting-section">
            <h3>ブラウザ通知</h3>
            {!isSupported ? (
              <p className="warning">このブラウザは通知をサポートしていません</p>
            ) : permission === 'granted' ? (
              <div className="permission-granted">
                <span className="status">通知許可済み</span>
                <button onClick={handleTestNotification} className="test-btn">
                  テスト通知を送信
                </button>
              </div>
            ) : permission === 'denied' ? (
              <p className="warning">
                通知がブロックされています。ブラウザの設定から許可してください。
              </p>
            ) : (
              <button onClick={handleEnableNotifications} className="enable-btn">
                通知を有効にする
              </button>
            )}
          </div>

          {/* 通知方法 */}
          <div className="setting-section">
            <h3>通知方法</h3>
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.push_enabled}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, push_enabled: e.target.checked }))
                }
              />
              プッシュ通知
            </label>
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.email_enabled}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email_enabled: e.target.checked }))
                }
              />
              メール通知（未実装）
            </label>
          </div>

          {/* 通知タイミング */}
          <div className="setting-section">
            <h3>通知タイミング</h3>
            <label className="time-input">
              通知時刻:
              <input
                type="time"
                value={formData.notification_time}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notification_time: e.target.value }))
                }
              />
            </label>
            <div className="days-selection">
              <p>期限の何日前に通知:</p>
              {[1, 2, 3, 5, 7, 14].map((day) => (
                <label key={day} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.days_before_expiry.includes(day)}
                    onChange={(e) => handleDaysChange(day, e.target.checked)}
                  />
                  {day}日前
                </label>
              ))}
            </div>
          </div>

          {/* 通知対象 */}
          <div className="setting-section">
            <h3>通知対象</h3>
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.notify_expired}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notify_expired: e.target.checked }))
                }
              />
              <span className="expiry-badge expired">期限切れ</span>
            </label>
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.notify_warning}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notify_warning: e.target.checked }))
                }
              />
              <span className="expiry-badge warning">3日以内</span>
            </label>
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.notify_caution}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notify_caution: e.target.checked }))
                }
              />
              <span className="expiry-badge caution">7日以内</span>
            </label>
          </div>

          <button onClick={handleSave} disabled={isSaving} className="save-btn">
            {isSaving ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
