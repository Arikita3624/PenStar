export interface Services {
  id: number;
  name: string;
  description: string;
  price: number;
  service_type_code?: string;
  service_type_name?: string;
  service_type_description?: string;
  is_included?: boolean;
  image_url?: string;
  thumbnail?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceType {
  id: number;
  code: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}
