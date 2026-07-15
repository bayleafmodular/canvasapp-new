export interface DatabaseOrder {
  id: string;
  user_id: string;
  customer_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  product_name: string;
  quantity: number;
  total_price: number;
  order_date: string;
  status: string;
  blueprint_type: string;
  drawing_data?: any;
  created_at: string;
  updated_at: string;
  remarks?: string | null;
}

export interface PublicOrder {
  id: string;
  userId?: string;
  customerName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  productName: string;
  quantity: number;
  totalPrice: number;
  orderDate: string;
  status: string;
  blueprintType: string;
  drawingData?: any;
  createdAt: string;
  updatedAt: string;
  remarks?: string;
}
