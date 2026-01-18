# 食材消費履歴機能エージェント

## 概要
食材の消費・廃棄履歴を記録し、食品ロス削減に役立てる機能を実装するエージェント

## 担当Issue
GitHub Issue #5: 食材消費履歴機能

## 実装タスク

### 1. データベース設計
```sql
CREATE TABLE consumption_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    food_item_name VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES categories(id),
    action VARCHAR(20) NOT NULL CHECK (action IN ('consumed', 'discarded')),
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20),
    original_expiry_date DATE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recorded_by UUID NOT NULL REFERENCES auth.users(id),
    notes TEXT
);

CREATE INDEX idx_consumption_history_group_id ON consumption_history(group_id);
CREATE INDEX idx_consumption_history_recorded_at ON consumption_history(recorded_at);
CREATE INDEX idx_consumption_history_action ON consumption_history(action);

-- RLSポリシー
ALTER TABLE consumption_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view consumption history of their groups"
    ON consumption_history FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert consumption history"
    ON consumption_history FOR INSERT
    TO authenticated
    WITH CHECK (true);
```

### 2. バックエンド実装
- [ ] services/consumptionService.ts
  - recordConsumption(foodItemId, action, quantity)
  - getConsumptionHistory(groupId, options)
  - getConsumptionStats(groupId, dateRange)
  - deleteHistoryEntry(id)

### 3. フロントエンド実装
- [ ] components/ConsumeActionButtons.tsx
  - 「消費」「廃棄」ボタン
  - 数量入力（部分消費対応）
- [ ] components/ConsumptionChart.tsx
  - 月別の消費/廃棄グラフ
  - カテゴリ別の内訳
- [ ] components/FoodWasteStats.tsx
  - 食品ロス率の表示
  - 前月比較
- [ ] pages/ConsumptionHistory.tsx
  - 履歴一覧
  - フィルター（日付範囲、アクション種別）
- [ ] hooks/useConsumptionHistory.ts
- [ ] hooks/useConsumptionStats.ts

### 4. FoodItemCard の修正
- [ ] 「消費」「廃棄」ボタンの追加
- [ ] アクション実行時の確認モーダル
- [ ] 部分消費時の数量更新

### 5. UI/UX
- [ ] ダッシュボードに統計サマリー追加
- [ ] 履歴ページへのナビゲーション
- [ ] グラフの期間切り替え（週/月/年）
- [ ] CSVエクスポート機能

### 6. 統計計算
```typescript
// 食品ロス率の計算
const wasteRate = discardedCount / (consumedCount + discardedCount) * 100;

// 月間統計
interface MonthlyStats {
  month: string;
  consumed: number;
  discarded: number;
  wasteRate: number;
  topWastedCategories: { category: string; count: number }[];
}
```

## パッケージインストール
```bash
npm install recharts
# または
npm install chart.js react-chartjs-2
```

## 技術的考慮事項
- 食材削除時に履歴も残す（食材名をコピーして保存）
- 大量データ時のパフォーマンス（ページネーション、集計クエリ）
- タイムゾーン処理

## 依存関係
- recharts または chart.js
- date-fns（日付操作）

## テスト項目
- [ ] 消費記録の作成
- [ ] 廃棄記録の作成
- [ ] 部分消費（数量減少）
- [ ] 履歴一覧の表示
- [ ] 統計グラフの表示
- [ ] 日付フィルター
- [ ] 食品ロス率の計算精度
