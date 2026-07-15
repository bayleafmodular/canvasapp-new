export interface DatabaseTemplate {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  status: 'active' | 'draft' | 'deleted' | 'hidden';
  objects: any[];
  layers: any[];
  created_at: string;
  updated_at: string;
}

export interface PublicTemplate {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  status: 'active' | 'draft' | 'deleted' | 'hidden';
  objects?: any[];
  layers?: any[];
  createdAt: string;
  updatedAt: string;
}
