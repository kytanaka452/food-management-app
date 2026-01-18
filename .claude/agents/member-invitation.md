# メンバー招待機能エージェント

## 概要
グループに他のユーザーを招待する機能を実装するエージェント

## 担当Issue
GitHub Issue #1: メンバー招待機能

## 実装タスク

### 1. データベース設計
- [ ] 招待テーブルの作成（invitations）
- [ ] RLSポリシーの設定

```sql
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    token UUID DEFAULT gen_random_uuid(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, email)
);
```

### 2. バックエンド実装
- [ ] invitationService.ts の作成
  - createInvitation(groupId, email)
  - getInvitations(groupId)
  - acceptInvitation(token)
  - rejectInvitation(token)
  - cancelInvitation(invitationId)

### 3. フロントエンド実装
- [ ] components/InviteMemberModal.tsx
- [ ] components/MemberList.tsx
- [ ] pages/AcceptInvitation.tsx（招待リンクのランディングページ）
- [ ] hooks/useGroupMembers.ts

### 4. UI/UX
- [ ] グループ設定画面にメンバー管理セクション追加
- [ ] 招待状態の表示（pending, accepted, etc.）
- [ ] メンバー削除の確認ダイアログ

## 技術的考慮事項
- Supabase Edge Functions でメール送信を実装
- 招待トークンの有効期限管理
- オーナー権限のチェック

## 依存関係
- 既存のgroupService.ts
- AuthContext

## テスト項目
- [ ] 招待メールの送信
- [ ] 招待リンクからの参加
- [ ] 期限切れ招待の処理
- [ ] 重複招待の防止
- [ ] メンバー削除（オーナーのみ）
