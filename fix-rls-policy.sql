-- =============================================
-- RLSポリシー修正
-- このSQLをSupabaseのSQL Editorで実行してください
-- =============================================

-- 既存のgroup_membersのINSERTポリシーを削除
DROP POLICY IF EXISTS "Owners can add members" ON group_members;

-- 新しいポリシー: 認証済みユーザーは自分自身をメンバーとして追加できる
-- (新規グループ作成時に自分をオーナーとして登録するため)
CREATE POLICY "Users can add themselves as members"
    ON group_members FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
    );

-- オーナーは他のメンバーも追加できる
CREATE POLICY "Owners can add other members"
    ON group_members FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );
