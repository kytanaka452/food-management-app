// =============================================
// Supabase クライアント初期化
// src/lib/supabaseClient.ts
// =============================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase環境変数が設定されていません');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================================
// 認証サービス
// src/services/authService.ts
// =============================================

import { supabase } from '../lib/supabaseClient';
import type { User } from '../types';

export const authService = {
  // サインアップ
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  // ログイン
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // ログアウト
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // 現在のユーザー取得
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? { id: user.id, email: user.email! } : null;
  },

  // パスワードリセット要求
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  },

  // 認証状態の変更を監視
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user 
        ? { id: session.user.id, email: session.user.email! }
        : null;
      callback(user);
    });
  },
};

// =============================================
// グループサービス
// src/services/groupService.ts
// =============================================

import { supabase } from '../lib/supabaseClient';
import type { Group, GroupMember, CreateGroupForm } from '../types';

export const groupService = {
  // ユーザーが所属するグループ一覧を取得
  async getUserGroups(): Promise<Group[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .order('joined_at', { ascending: false });

    if (error) throw error;
    return data?.map(item => item.groups).filter(Boolean) as Group[];
  },

  // グループ詳細を取得
  async getGroup(groupId: string): Promise<Group | null> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) throw error;
    return data;
  },

  // グループ作成(自動的にownerとして登録)
  async createGroup(form: CreateGroupForm): Promise<Group> {
    // 1. グループを作成
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name: form.name })
      .select()
      .single();

    if (groupError) throw groupError;

    // 2. 作成者をownerとして登録
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('認証されていません');

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) throw memberError;

    return group;
  },

  // グループ名を更新(ownerのみ)
  async updateGroup(groupId: string, name: string): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .update({ name })
      .eq('id', groupId);

    if (error) throw error;
  },

  // グループ削除(ownerのみ)
  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
  },

  // グループメンバー一覧取得
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};

// =============================================
// 食材サービス
// src/services/foodItemService.ts
// =============================================

import { supabase } from '../lib/supabaseClient';
import type { FoodItem, CreateFoodItemForm, UpdateFoodItemForm } from '../types';

export const foodItemService = {
  // グループの食材一覧を取得
  async getFoodItems(groupId: string): Promise<FoodItem[]> {
    const { data, error } = await supabase
      .from('food_items')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('group_id', groupId)
      .order('expiry_date', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data || [];
  },

  // 食材詳細を取得
  async getFoodItem(id: string): Promise<FoodItem | null> {
    const { data, error } = await supabase
      .from('food_items')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // 食材を追加
  async createFoodItem(groupId: string, form: CreateFoodItemForm): Promise<FoodItem> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('認証されていません');

    const { data, error } = await supabase
      .from('food_items')
      .insert({
        group_id: groupId,
        created_by: user.id,
        ...form,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 食材を更新
  async updateFoodItem(form: UpdateFoodItemForm): Promise<FoodItem> {
    const { id, ...updates } = form;
    
    const { data, error } = await supabase
      .from('food_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 食材を削除
  async deleteFoodItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('food_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // リアルタイム監視を設定
  subscribeToFoodItems(groupId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`food_items:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_items',
          filter: `group_id=eq.${groupId}`,
        },
        callback
      )
      .subscribe();
  },
};

// =============================================
// カテゴリサービス
// src/services/categoryService.ts
// =============================================

import { supabase } from '../lib/supabaseClient';
import type { Category } from '../types';

export const categoryService = {
  // カテゴリ一覧を取得
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
