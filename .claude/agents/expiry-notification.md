# 賞味期限アラートエージェント

## 概要
賞味期限が近づいた食材についてプッシュ通知を送信する機能を実装するエージェント

## 担当Issue
GitHub Issue #2: 賞味期限アラート（プッシュ通知）

## 実装タスク

### 1. データベース設計
- [ ] 通知設定テーブルの作成
- [ ] 通知履歴テーブルの作成

```sql
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    days_before INTEGER DEFAULT 3,
    notification_time TIME DEFAULT '09:00',
    push_subscription JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE TABLE notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    food_item_id UUID REFERENCES food_items(id),
    title VARCHAR(255),
    body TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);
```

### 2. Service Worker実装
- [ ] public/sw.js の作成
- [ ] プッシュ通知の受信処理
- [ ] 通知クリック時のアクション

### 3. バックエンド実装
- [ ] Supabase Edge Function: check-expiry-notifications
- [ ] Web Push送信処理
- [ ] Cron設定（毎日定時実行）

### 4. フロントエンド実装
- [ ] services/notificationService.ts
  - requestPermission()
  - subscribeToPush()
  - unsubscribeFromPush()
  - getNotificationHistory()
  - markAsRead(notificationId)
- [ ] components/NotificationSettings.tsx
- [ ] components/NotificationBell.tsx（ヘッダー用）
- [ ] hooks/useNotifications.ts

### 5. UI/UX
- [ ] 設定画面に通知設定セクション追加
- [ ] 通知ドロップダウン（未読/既読）
- [ ] 通知バッジ表示

## 技術的考慮事項
- VAPID keys の生成と管理
- Web Push API の実装
- Service Worker のライフサイクル管理
- オフライン時の通知キュー

## 依存関係
- web-push パッケージ（Edge Functions用）
- Service Worker API

## 環境変数
```
VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx
VAPID_SUBJECT=mailto:your@email.com
```

## テスト項目
- [ ] 通知許可リクエスト
- [ ] プッシュ通知の受信
- [ ] 通知クリックでアプリ起動
- [ ] 通知設定の保存/読み込み
- [ ] 定時実行の動作確認
