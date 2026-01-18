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
