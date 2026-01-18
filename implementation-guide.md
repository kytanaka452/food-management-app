# 食材管理アプリ 実装手順書

## Phase 1: 基本機能実装

### Step 1: 環境構築 (所要時間: 1-2時間)

#### 1.1 Supabaseプロジェクト作成
1. https://supabase.com にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインイン
4. 「New Project」をクリック
5. プロジェクト情報を入力:
   - Name: `food-management-app`
   - Database Password: 強力なパスワードを設定(メモしておく)
   - Region: `Northeast Asia (Tokyo)` を選択
6. 「Create new project」をクリック(約2分待つ)

#### 1.2 データベースセットアップ
1. 左サイドバーの「SQL Editor」をクリック
2. 「New query」をクリック
3. 提供した`schema.sql`の内容をコピー&ペースト
4. 「Run」をクリックして実行
5. エラーがないことを確認

#### 1.3 Supabase環境変数取得
1. 左サイドバーの「Project Settings」→「API」をクリック
2. 以下をメモ:
   - Project URL (例: https://xxxxx.supabase.co)
   - anon public key (長い文字列)

#### 1.4 Reactプロジェクト作成
```bash
# Vite + React + TypeScriptでプロジェクト作成
npm create vite@latest food-management-frontend -- --template react-ts

cd food-management-frontend

# 依存パッケージをインストール
npm install

# Supabaseクライアントをインストール
npm install @supabase/supabase-js

# その他必要なパッケージ
npm install react-router-dom
npm install @types/react-router-dom --save-dev
npm install react-hook-form
npm install date-fns  # 日付操作用
```

#### 1.5 環境変数設定
プロジェクトルートに`.env`ファイルを作成:
```
VITE_SUPABASE_URL=あなたのProject URL
VITE_SUPABASE_ANON_KEY=あなたのanon public key
```

`.env`を`.gitignore`に追加(重要!):
```
# .gitignore
node_modules
dist
.env
.env.local
```

---

### Step 2: 認証機能実装 (所要時間: 3-4時間)

#### 2.1 Supabaseクライアント設定
`src/lib/supabaseClient.ts`を作成(提供したコードを使用)

#### 2.2 型定義
`src/types/index.ts`を作成(提供したコードを使用)

#### 2.3 認証コンテキスト作成
`src/contexts/AuthContext.tsx`を作成:
```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import type { User, Group } from '../types';

interface AuthContextType {
  user: User | null;
  currentGroup: Group | null;
  setCurrentGroup: (group: Group | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初回ロード時に認証状態を確認
    authService.getCurrentUser().then(setUser).finally(() => setLoading(false));

    // 認証状態の変更を監視
    const { data: { subscription } } = authService.onAuthStateChange(setUser);

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, currentGroup, setCurrentGroup, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

#### 2.4 ログイン/サインアップページ作成
`src/pages/Login.tsx`と`src/pages/SignUp.tsx`を作成

**実装のポイント:**
- react-hook-formでフォーム管理
- エラーハンドリングを適切に行う
- ローディング状態の表示

#### 2.5 ルーティング設定
`src/App.tsx`でReact Routerを設定:
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Groups from './pages/Groups';
import Dashboard from './pages/Dashboard';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/groups" element={
            <PrivateRoute><Groups /></PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

---

### Step 3: グループ機能実装 (所要時間: 2-3時間)

#### 3.1 グループ選択ページ
`src/pages/Groups.tsx`を作成:
- ユーザーが所属するグループ一覧を表示
- 新規グループ作成ボタン
- グループ選択でダッシュボードへ遷移

#### 3.2 グループ作成ページ/モーダル
`src/components/CreateGroupModal.tsx`を作成:
- グループ名入力フォーム
- 作成成功後、自動的にそのグループを選択

---

### Step 4: 食材管理機能実装 (所要時間: 5-6時間)

#### 4.1 ダッシュボードページ
`src/pages/Dashboard.tsx`を作成:
- 期限切れ間近の食材を強調表示
- カテゴリ別の食材数を表示
- 保存場所別のタブ表示

#### 4.2 食材一覧ページ
`src/pages/FoodItems.tsx`を作成:
- 食材カード/リスト表示
- カテゴリフィルター
- 保存場所フィルター
- 期限でソート

#### 4.3 食材追加フォーム
`src/components/FoodItemForm.tsx`を作成:
- 必須項目: 名前、数量
- 任意項目: カテゴリ、単位、期限、保存場所、メモ
- バリデーション

#### 4.4 食材詳細・編集
同じフォームを編集モードでも使用

#### 4.5 リアルタイム更新
`useFoodItems`カスタムフックでリアルタイム監視を実装:
```typescript
import { useEffect, useState } from 'react';
import { foodItemService } from '../services/foodItemService';
import type { FoodItem } from '../types';

export function useFoodItems(groupId: string | null) {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;

    // 初回データ取得
    foodItemService.getFoodItems(groupId)
      .then(setFoodItems)
      .finally(() => setLoading(false));

    // リアルタイム監視
    const subscription = foodItemService.subscribeToFoodItems(
      groupId,
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setFoodItems(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setFoodItems(prev => 
            prev.map(item => item.id === payload.new.id ? payload.new : item)
          );
        } else if (payload.eventType === 'DELETE') {
          setFoodItems(prev => prev.filter(item => item.id !== payload.old.id));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [groupId]);

  return { foodItems, loading };
}
```

---

### Step 5: UI/UX改善 (所要時間: 3-4時間)

#### 5.1 レイアウトコンポーネント
`src/components/Layout.tsx`を作成:
- ヘッダー(グループ選択ドロップダウン、ユーザーメニュー)
- サイドバーナビゲーション
- メインコンテンツエリア

#### 5.2 期限表示の色分け
```typescript
// src/utils/expiryHelpers.ts
import { differenceInDays } from 'date-fns';

export function getExpiryStatus(expiryDate: string | null | undefined) {
  if (!expiryDate) return 'none';
  
  const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());
  
  if (daysUntilExpiry < 0) return 'expired';      // 期限切れ(赤)
  if (daysUntilExpiry <= 3) return 'warning';     // 3日以内(黄)
  if (daysUntilExpiry <= 7) return 'caution';     // 7日以内(オレンジ)
  return 'safe';                                   // 安全(緑)
}
```

#### 5.3 レスポンシブデザイン
Tailwind CSSまたはCSS Modulesで対応

---

### Step 6: デプロイ (所要時間: 1時間)

#### 6.1 Vercelにデプロイ
1. https://vercel.com にアクセス
2. GitHubアカウントでサインイン
3. 「Add New Project」をクリック
4. GitHubリポジトリをインポート
5. 環境変数を設定:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. 「Deploy」をクリック

#### 6.2 カスタムドメイン設定(オプション)
Vercelの設定画面からドメイン追加可能

---

## テストチェックリスト

### 認証
- [ ] サインアップできる
- [ ] メール認証が機能する
- [ ] ログインできる
- [ ] ログアウトできる
- [ ] 未認証時に保護されたページにアクセスできない

### グループ
- [ ] グループを作成できる
- [ ] グループ一覧が表示される
- [ ] グループを選択できる
- [ ] グループ切り替えが機能する

### 食材
- [ ] 食材を追加できる
- [ ] 食材一覧が表示される
- [ ] 食材を編集できる
- [ ] 食材を削除できる
- [ ] カテゴリフィルターが機能する
- [ ] 保存場所フィルターが機能する
- [ ] 期限の色分けが正しく表示される

### リアルタイム
- [ ] 別のブラウザで追加した食材がリアルタイムで表示される
- [ ] 削除・編集もリアルタイムで反映される

### セキュリティ
- [ ] 他のグループの食材が見えない
- [ ] 所属していないグループにアクセスできない

---

## トラブルシューティング

### よくあるエラー

**「Row Level Security policy violation」**
→ RLSポリシーが正しく設定されているか確認
→ schema.sqlを再実行

**「Invalid API key」**
→ .envファイルの環境変数を確認
→ Vercelの環境変数設定を確認

**リアルタイム更新が機能しない**
→ SupabaseダッシュボードでRealtime機能が有効か確認
→ サブスクリプションが正しく設定されているか確認

---

## 次のステップ(Phase 2以降)

1. メンバー招待機能
2. 賞味期限アラート(プッシュ通知)
3. バーコードスキャン(外部API連携)
4. レシピ提案(ChatGPT API連携)
5. 食材消費履歴
6. 買い物リスト機能
