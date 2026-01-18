# アプリケーションフロー設計

## ページ構成

### 1. 認証関連ページ
- `/login` - ログインページ
- `/signup` - 新規登録ページ
- `/reset-password` - パスワードリセット

### 2. グループ選択・管理
- `/groups` - グループ一覧・選択ページ
- `/groups/new` - 新規グループ作成
- `/groups/:id/settings` - グループ設定(メンバー管理、グループ名変更など)

### 3. メインアプリケーション
- `/dashboard` - ダッシュボード(期限切れ間近の食材など)
- `/foods` - 食材一覧
- `/foods/new` - 食材追加
- `/foods/:id` - 食材詳細・編集

### 4. その他
- `/profile` - ユーザープロフィール設定
- `/notifications` - 通知設定(Phase 2以降)

## ユーザーフロー

### 初回利用時
1. サインアップ(/signup)
2. メール認証
3. グループ作成(/groups/new)
   - 自動的にownerとして登録
4. ダッシュボード(/dashboard)へリダイレクト

### 既存ユーザー(グループ未所属)
1. ログイン(/login)
2. グループ選択(/groups)
   - グループ作成 or 招待待ち画面

### 既存ユーザー(グループ所属済み)
1. ログイン(/login)
2. 前回選択していたグループで自動ログイン
3. ダッシュボード(/dashboard)へ

### グループ切り替え
- ヘッダーにグループ選択ドロップダウン
- 選択すると該当グループのデータを表示

## 主要な画面遷移

```
[未認証]
  → /login → [認証成功] → /groups → グループ選択 → /dashboard
  → /signup → メール認証 → /groups/new → グループ作成 → /dashboard

[認証済み]
  /dashboard
    ├─ /foods (食材一覧)
    │   ├─ /foods/new (追加)
    │   └─ /foods/:id (詳細・編集)
    │
    ├─ /groups (グループ切り替え)
    │   ├─ /groups/new (新規作成)
    │   └─ /groups/:id/settings (設定)
    │
    └─ /profile (プロフィール)
```

## コンポーネント構成

### レイアウトコンポーネント
- `AuthLayout` - 認証ページ用レイアウト
- `AppLayout` - メインアプリ用レイアウト(ヘッダー、サイドバー含む)

### 共通コンポーネント
- `Header` - ヘッダー(グループ選択、ユーザーメニュー)
- `Sidebar` - サイドバーナビゲーション
- `LoadingSpinner` - ローディング表示
- `ErrorMessage` - エラーメッセージ
- `ConfirmDialog` - 確認ダイアログ

### ドメイン固有コンポーネント

#### 食材関連
- `FoodItemCard` - 食材カード表示
- `FoodItemList` - 食材一覧
- `FoodItemForm` - 食材追加・編集フォーム
- `ExpiryBadge` - 期限表示バッジ(色分け)
- `CategoryFilter` - カテゴリフィルター
- `StorageLocationTabs` - 保存場所タブ

#### グループ関連
- `GroupCard` - グループカード
- `GroupMemberList` - メンバー一覧
- `InviteMemberForm` - メンバー招待フォーム(Phase 2)

## 状態管理戦略

### React Context
- `AuthContext` - 認証状態(user, currentGroup)
- `NotificationContext` - 通知管理(Phase 2)

### Custom Hooks
- `useAuth()` - 認証操作
- `useGroups()` - グループ操作
- `useFoodItems()` - 食材操作
- `useCategories()` - カテゴリ取得

### ローカルステート
- フォーム入力値
- モーダルの開閉状態
- フィルター・ソート条件

## データフェッチング戦略

### リアルタイム更新が必要
- 食材一覧 → Supabase Realtime Subscriptionを使用
  - 家族の誰かが追加/削除したらすぐ反映

### 通常のフェッチでOK
- グループ一覧
- カテゴリマスター
- ユーザープロフィール

## セキュリティ考慮事項

1. **ページアクセス制御**
   - 未認証ユーザーは/login, /signupのみアクセス可
   - 認証済みでグループ未所属なら/groupsへリダイレクト

2. **データアクセス制御**
   - Supabase RLSで担保
   - フロントエンドでも二重チェック

3. **入力バリデーション**
   - フロントエンド: react-hook-formでバリデーション
   - バックエンド: PostgreSQLの制約で担保

## Phase 1 実装範囲

最小限で以下を実装:
- ✅ 認証(ログイン/サインアップ)
- ✅ グループ作成
- ✅ グループ選択
- ✅ 食材CRUD
- ✅ カテゴリ・保存場所フィルター
- ✅ 賞味期限表示(期限切れ判定)

Phase 2以降:
- 🔲 メンバー招待機能
- 🔲 賞味期限アラート(プッシュ通知)
- 🔲 バーコードスキャン
- 🔲 レシピ提案
