export type User = {
  id: number;
  email: string;
  role_id?: number;
  role?: string;
} | null;

export type RolesMap = {
  byId: Record<number, string>;
  byName: Record<string, number>;
  order: string[];
} | null;

export type AuthContextType = {
  token: string | null;
  user: User;
  rolesMap: RolesMap;
  loginWithToken: (t: string) => void;
  logout: () => void;
  getRoleName: (u?: User) => string | null;
};
