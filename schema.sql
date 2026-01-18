-- =============================================
-- 食材管理アプリ データベーススキーマ
-- =============================================

-- 1. グループ(家庭)テーブル
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. グループメンバー(中間テーブル)
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- 3. カテゴリマスターテーブル
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. 食材テーブル
CREATE TABLE food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES categories(id),
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit VARCHAR(20),
    expiry_date DATE,
    storage_location VARCHAR(50) CHECK (storage_location IN ('refrigerator', 'freezer', 'pantry', 'other')),
    barcode VARCHAR(50),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- インデックス作成(パフォーマンス向上)
-- =============================================

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_food_items_group_id ON food_items(group_id);
CREATE INDEX idx_food_items_expiry_date ON food_items(expiry_date);
CREATE INDEX idx_food_items_category_id ON food_items(category_id);

-- =============================================
-- Row Level Security (RLS) ポリシー
-- =============================================

-- RLSを有効化
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- groups: 自分が所属するグループのみ閲覧可能
CREATE POLICY "Users can view their groups"
    ON groups FOR SELECT
    USING (
        id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid()
        )
    );

-- groups: 新規グループ作成可能(認証済みユーザー)
CREATE POLICY "Authenticated users can create groups"
    ON groups FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- groups: オーナーのみ更新・削除可能
CREATE POLICY "Owners can update their groups"
    ON groups FOR UPDATE
    USING (
        id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Owners can delete their groups"
    ON groups FOR DELETE
    USING (
        id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- group_members: 自分が所属するグループのメンバー情報のみ閲覧可能
CREATE POLICY "Users can view members of their groups"
    ON group_members FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid()
        )
    );

-- group_members: 認証済みユーザーは自分自身をメンバーとして追加可能
-- (新規グループ作成時に自分をオーナーとして登録するため)
CREATE POLICY "Users can add themselves as members"
    ON group_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- group_members: オーナーは他のメンバーも追加可能
CREATE POLICY "Owners can add other members"
    ON group_members FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- group_members: オーナーのみメンバー削除可能、または自分自身は退会可能
CREATE POLICY "Owners can remove members or users can leave"
    ON group_members FOR DELETE
    USING (
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
        OR user_id = auth.uid()
    );

-- food_items: 自分が所属するグループの食材のみ閲覧可能
CREATE POLICY "Users can view food items in their groups"
    ON food_items FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid()
        )
    );

-- food_items: グループメンバーは食材追加可能
CREATE POLICY "Group members can add food items"
    ON food_items FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid()
        )
    );

-- food_items: グループメンバーは食材更新可能
CREATE POLICY "Group members can update food items"
    ON food_items FOR UPDATE
    USING (
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid()
        )
    );

-- food_items: グループメンバーは食材削除可能
CREATE POLICY "Group members can delete food items"
    ON food_items FOR DELETE
    USING (
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid()
        )
    );

-- categories: 全員閲覧可能
CREATE POLICY "Anyone can view categories"
    ON categories FOR SELECT
    USING (true);

-- =============================================
-- トリガー(自動更新)
-- =============================================

-- updated_atを自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- groupsテーブルにトリガー設定
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- food_itemsテーブルにトリガー設定
CREATE TRIGGER update_food_items_updated_at
    BEFORE UPDATE ON food_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 初期データ投入
-- =============================================

-- カテゴリの初期データ
INSERT INTO categories (name, icon, display_order) VALUES
    ('野菜', '🥬', 1),
    ('果物', '🍎', 2),
    ('肉類', '🥩', 3),
    ('魚介類', '🐟', 4),
    ('乳製品', '🥛', 5),
    ('卵', '🥚', 6),
    ('調味料', '🧂', 7),
    ('穀物', '🌾', 8),
    ('飲料', '🥤', 9),
    ('その他', '📦', 10);
