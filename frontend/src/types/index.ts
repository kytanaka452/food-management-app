export type UserRole = 'owner' | 'member';

export type StorageLocation = 'refrigerator' | 'freezer' | 'pantry' | 'other';

export interface Group {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  display_order: number;
  created_at: string;
}

export interface FoodItem {
  id: string;
  group_id: string;
  name: string;
  category_id?: string;
  quantity: number;
  unit?: string;
  expiry_date?: string;
  storage_location?: StorageLocation;
  barcode?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FoodItemWithCategory extends FoodItem {
  category?: Category;
}

export interface GroupWithMembers extends Group {
  members?: GroupMember[];
  member_count?: number;
}

export interface GroupMemberWithUser extends GroupMember {
  user?: {
    id: string;
    email: string;
  };
}

export interface CreateGroupForm {
  name: string;
}

export interface CreateFoodItemForm {
  name: string;
  category_id?: string;
  quantity: number;
  unit?: string;
  expiry_date?: string;
  storage_location?: StorageLocation;
  barcode?: string;
  notes?: string;
}

export interface UpdateFoodItemForm extends Partial<CreateFoodItemForm> {
  id: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  currentGroup: Group | null;
}

// =============================================
// 買い物リスト関連の型
// =============================================

export interface ShoppingList {
  id: string;
  group_id: string;
  name: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  list_id: string;
  name: string;
  quantity?: string;
  category_id?: string;
  is_purchased: boolean;
  purchased_at?: string;
  purchased_by?: string;
  sort_order: number;
  created_at: string;
}

export interface ShoppingListItemWithCategory extends ShoppingListItem {
  category?: Category;
}

export interface CreateShoppingListForm {
  name: string;
}

export interface CreateShoppingListItemForm {
  name: string;
  quantity?: string;
  category_id?: string;
}

// =============================================
// 通知設定関連の型
// =============================================

export interface NotificationSettings {
  id: string;
  user_id: string;
  group_id?: string;
  days_before_expiry: number[];
  push_enabled: boolean;
  email_enabled: boolean;
  notification_time: string;
  notify_expired: boolean;
  notify_warning: boolean;
  notify_caution: boolean;
  created_at: string;
  updated_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
  created_at: string;
}

export interface NotificationHistory {
  id: string;
  user_id: string;
  food_item_id: string;
  notification_type: 'expired' | 'warning' | 'caution';
  sent_at: string;
}

export interface ExpiringFoodItem extends FoodItem {
  group_name?: string;
  category_name?: string;
  expiry_status: 'expired' | 'warning' | 'caution' | 'safe';
  days_until_expiry: number;
}

export interface CreateNotificationSettingsForm {
  days_before_expiry: number[];
  push_enabled: boolean;
  email_enabled: boolean;
  notification_time: string;
  notify_expired: boolean;
  notify_warning: boolean;
  notify_caution: boolean;
}
