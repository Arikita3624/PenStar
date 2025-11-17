export type Role = {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type RoleCreatePayload = {
  name: string;
  description?: string;
};
