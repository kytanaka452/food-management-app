# 買い物リスト機能エージェント

## 概要
買い物リストを作成・管理する機能を実装するエージェント

## 担当Issue
GitHub Issue #6: 買い物リスト機能

## 実装タスク

### 1. データベース設計
```sql
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT '買い物リスト',
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shopping_list_items (
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

CREATE INDEX idx_shopping_lists_group_id ON shopping_lists(group_id);
CREATE INDEX idx_shopping_list_items_list_id ON shopping_list_items(list_id);

-- RLSポリシー
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage shopping lists"
    ON shopping_lists FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage shopping list items"
    ON shopping_list_items FOR ALL
    TO authenticated
    USING (true);

-- Realtime有効化
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_lists;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list_items;
```

### 2. バックエンド実装
- [ ] services/shoppingListService.ts
  - createList(groupId, name)
  - getLists(groupId)
  - getListItems(listId)
  - addItem(listId, item)
  - updateItem(itemId, updates)
  - togglePurchased(itemId)
  - deleteItem(itemId)
  - deleteList(listId)
  - reorderItems(listId, itemIds)
  - convertToFoodItem(itemId) - 購入済みを食材に変換

### 3. フロントエンド実装
- [ ] pages/ShoppingList.tsx
  - リスト選択
  - アイテム一覧
  - チェックボックス操作
- [ ] components/ShoppingListCard.tsx
- [ ] components/AddShoppingItem.tsx
  - クイック追加フォーム
  - カテゴリ選択
  - 過去の購入履歴からサジェスト
- [ ] components/ShoppingItemRow.tsx
  - スワイプで削除
  - ドラッグで並び替え
- [ ] hooks/useShoppingList.ts
- [ ] hooks/useShoppingListRealtime.ts（リアルタイム同期）

### 4. UI/UX
- [ ] ナビゲーションに買い物リストアイコン追加
- [ ] 未購入アイテム数のバッジ表示
- [ ] カテゴリ別のグルーピング表示
- [ ] 購入済みアイテムを下部に移動
- [ ] 「全て購入済みにする」ボタン
- [ ] 「購入済みをクリア」ボタン
- [ ] リストの共有状態表示

### 5. 追加機能
- [ ] 食材から買い物リストに追加（在庫切れ時）
- [ ] 購入済みアイテムを食材として自動登録
- [ ] 定番アイテムのサジェスト
- [ ] 音声入力対応（オプション）

### 6. PWA対応
- [ ] オフラインでの閲覧・編集
- [ ] オンライン復帰時の同期
- [ ] Service Worker でのキャッシュ

## パッケージインストール
```bash
npm install @dnd-kit/core @dnd-kit/sortable  # ドラッグ&ドロップ
# または
npm install react-beautiful-dnd
```

## 技術的考慮事項
- リアルタイム同期（家族で同時編集）
- オフライン対応（IndexedDB）
- 並び替えの永続化
- コンフリクト解決（同時編集時）

## 依存関係
- @dnd-kit/core（ドラッグ&ドロップ）
- Supabase Realtime

## テスト項目
- [ ] リストの作成/削除
- [ ] アイテムの追加/削除
- [ ] チェックボックスのトグル
- [ ] リアルタイム同期（複数ブラウザ）
- [ ] ドラッグ&ドロップでの並び替え
- [ ] 購入済みアイテムの食材変換
- [ ] オフライン動作（PWA）
