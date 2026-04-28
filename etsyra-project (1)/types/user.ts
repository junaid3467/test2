export type UserRole = 'admin' | 'staff';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  assigned_stores?: string[];
}

export interface StaffStore {
  user_id: string;
  store_id: string;
}
