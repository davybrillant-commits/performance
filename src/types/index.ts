export interface Telemarketer {
  id: string;
  name: string;
  validatedSales: number;
  pendingSales: number;
  avatar?: string;
  performanceMonth: string; // Format: "2024-01" pour janvier 2024
  target: number;
  managerId?: string; // ID du manager responsable
  joinDate: string; // Date d'embauche
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  username: string;
  role: 'super_admin' | 'admin' | 'manager' | 'agent';
  name: string;
  email?: string;
  createdAt?: string;
  isActive?: boolean;
  teamId?: string;
  isHidden?: boolean; // Pour cacher les comptes super_admin et admin
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isManager: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAgent: boolean;
  canManageUsers: boolean;
  canManageTeams: boolean;
}

export interface Permission {
  id: string;
  userId: string;
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export type SortOption = 'performance' | 'name' | 'performanceMonth';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'cards' | 'list' | 'table' | 'charts';