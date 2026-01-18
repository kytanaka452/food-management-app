-- Phase 2: 買い物リスト機能 & 賞味期限アラート機能
-- このSQLをSupabase SQL Editorで実行してください

-- =============================================
-- 1. 買い物リスト機能
-- =============================================

-- 買い物リストテーブル
CREATE TABLE IF NOT EXISTS shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT '買い物リスト',
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 買い物リストアイテムテーブル
CREATE TABLE IF NOT EXISTS shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    quantity VARCHAR(50),
    category_id UUID REFERENCES categories(id),
    is_purchased BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMP WITH TIME ZONE,
    purchased_by UUID REFERENCES auth.users(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_shopping_lists_group_id ON shopping_lists(group_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id ON shopping_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_purchased ON shopping_list_items(is_purchased);

-- RLS有効化
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: shopping_lists
DROP POLICY IF EXISTS "Authenticated users can view shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Authenticated users can create shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Authenticated users can update shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "Authenticated users can delete shopping lists" ON shopping_lists;

CREATE POLICY "Authenticated users can view shopping lists"
    ON shopping_lists FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create shopping lists"
    ON shopping_lists FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update shopping lists"
    ON shopping_lists FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete shopping lists"
    ON shopping_lists FOR DELETE
    TO authenticated
    USING (true);

-- RLSポリシー: shopping_list_items
DROP POLICY IF EXISTS "Authenticated users can view shopping list items" ON shopping_list_items;
DROP POLICY IF EXISTS "Authenticated users can create shopping list items" ON shopping_list_items;
DROP POLICY IF EXISTS "Authenticated users can update shopping list items" ON shopping_list_items;
DROP POLICY IF EXISTS "Authenticated users can delete shopping list items" ON shopping_list_items;

CREATE POLICY "Authenticated users can view shopping list items"
    ON shopping_list_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create shopping list items"
    ON shopping_list_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update shopping list items"
    ON shopping_list_items FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete shopping list items"
    ON shopping_list_items FOR DELETE
    TO authenticated
    USING (true);

-- Realtime有効化
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_lists;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list_items;

-- updated_atトリガー
CREATE OR REPLACE FUNCTION update_shopping_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_shopping_lists_updated_at ON shopping_lists;
CREATE TRIGGER set_shopping_lists_updated_at
    BEFORE UPDATE ON shopping_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_shopping_lists_updated_at();


-- =============================================
-- 2. 賞味期限アラート機能
-- =============================================

-- 通知設定テーブル
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    -- 通知タイミング（日数）
    days_before_expiry INTEGER[] DEFAULT ARRAY[1, 3, 7],
    -- 通知方法
    push_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT false,
    -- 通知時間帯
    notification_time TIME DEFAULT '09:00:00',
    -- 通知対象
    notify_expired BOOLEAN DEFAULT true,
    notify_warning BOOLEAN DEFAULT true,
    notify_caution BOOLEAN DEFAULT true,
    -- メタデータ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_id)
);

-- プッシュ通知サブスクリプションテーブル
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, endpoint)
);

-- 通知履歴テーブル（重複通知防止用）
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
    notification_type VARCHAR(20) NOT NULL, -- 'expired', 'warning', 'caution'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, food_item_id, notification_type)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_food ON notification_history(user_id, food_item_id);

-- RLS有効化
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: notification_settings
DROP POLICY IF EXISTS "Users can manage own notification settings" ON notification_settings;
CREATE POLICY "Users can manage own notification settings"
    ON notification_settings FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLSポリシー: push_subscriptions
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage own push subscriptions"
    ON push_subscriptions FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLSポリシー: notification_history
DROP POLICY IF EXISTS "Users can view own notification history" ON notification_history;
CREATE POLICY "Users can view own notification history"
    ON notification_history FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notification history" ON notification_history;
CREATE POLICY "System can insert notification history"
    ON notification_history FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- updated_atトリガー for notification_settings
DROP TRIGGER IF EXISTS set_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER set_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_shopping_lists_updated_at();


-- =============================================
-- 3. 期限切れ食材を取得するビュー
-- =============================================

CREATE OR REPLACE VIEW expiring_food_items AS
SELECT
    fi.*,
    g.name as group_name,
    c.name as category_name,
    CASE
        WHEN fi.expiry_date < CURRENT_DATE THEN 'expired'
        WHEN fi.expiry_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'warning'
        WHEN fi.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'caution'
        ELSE 'safe'
    END as expiry_status,
    fi.expiry_date - CURRENT_DATE as days_until_expiry
FROM food_items fi
LEFT JOIN groups g ON fi.group_id = g.id
LEFT JOIN categories c ON fi.category_id = c.id
WHERE fi.expiry_date IS NOT NULL
ORDER BY fi.expiry_date ASC;
