export type User = {
  id: number;
  full_name?: string | null;
  email: string;
  password?: string | null;
  phone?: string | null;
  role_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
};

export type RegisterPayload = {
  full_name?: string;
  email: string;
  password: string;
  phone?: string;
  role_id?: number;
};
