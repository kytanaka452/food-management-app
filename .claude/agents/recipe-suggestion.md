# レシピ提案機能エージェント

## 概要
登録されている食材を基にAIがレシピを提案する機能を実装するエージェント

## 担当Issue
GitHub Issue #4: レシピ提案機能（AI連携）

## 実装タスク

### 1. データベース設計
```sql
-- お気に入りレシピテーブル
CREATE TABLE saved_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    ingredients JSONB NOT NULL,
    instructions TEXT NOT NULL,
    cooking_time INTEGER, -- 分
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    servings INTEGER DEFAULT 2,
    ai_generated BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- レシピ生成履歴（API利用量管理）
CREATE TABLE recipe_generation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. バックエンド実装（Supabase Edge Function）
- [ ] functions/generate-recipe/index.ts
  - OpenAI API または Claude API の呼び出し
  - プロンプトエンジニアリング
  - レスポンスのパース
  - 利用量の記録

### 3. フロントエンド実装
- [ ] services/recipeService.ts
  - generateRecipe(ingredients, options)
  - saveRecipe(recipe)
  - getSavedRecipes(groupId)
  - deleteRecipe(recipeId)
- [ ] components/RecipeSuggestion.tsx
  - 食材選択UI
  - オプション設定（人数、調理時間、難易度）
  - 生成中のローディング表示
- [ ] components/RecipeCard.tsx
- [ ] components/RecipeDetail.tsx
- [ ] pages/Recipes.tsx
- [ ] hooks/useRecipes.ts

### 4. UI/UX
- [ ] ダッシュボードに「レシピ提案」ボタン追加
- [ ] 期限切れ間近の食材をハイライト
- [ ] レシピ生成中のスケルトンUI
- [ ] お気に入り保存機能
- [ ] 印刷用レイアウト

### 5. API利用量管理
- [ ] 日次/月次の利用制限
- [ ] 残り利用回数の表示
- [ ] 制限到達時のメッセージ

## プロンプト設計例
```
あなたは料理の専門家です。以下の食材を使ったレシピを提案してください。

【使用可能な食材】
${ingredients.join(', ')}

【条件】
- 調理時間: ${cookingTime}分以内
- 難易度: ${difficulty}
- 人数: ${servings}人分
- 期限が近い食材を優先的に使用: ${expiringIngredients.join(', ')}

以下のJSON形式で回答してください:
{
  "title": "料理名",
  "ingredients": [{"name": "食材名", "amount": "分量"}],
  "instructions": ["手順1", "手順2", ...],
  "cooking_time": 分数,
  "tips": "コツやポイント"
}
```

## 技術的考慮事項
- API利用料金の管理（月額上限設定）
- レスポンスのキャッシュ（同じ食材の組み合わせ）
- エラーハンドリング（API失敗、不適切な応答）
- ストリーミングレスポンスの検討

## 依存関係
- OpenAI API または Anthropic API

## 環境変数
```
OPENAI_API_KEY=xxx
# または
ANTHROPIC_API_KEY=xxx
```

## テスト項目
- [ ] 食材選択からレシピ生成
- [ ] レシピの保存/削除
- [ ] 利用制限の動作
- [ ] エラー時のフォールバック
- [ ] 異なる条件でのレシピ生成
