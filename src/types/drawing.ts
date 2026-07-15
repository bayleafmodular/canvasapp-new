export interface DatabaseDrawing {
  id: string;
  user_id?: string;
  name: string;
  data?: any;
  created_at: string;
  updated_at: string;
}

export interface PublicDrawing {
  id: string;
  name: string;
  data?: any;
  createdAt: string;
  updatedAt: string;
}
