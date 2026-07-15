import { supabase } from '@/lib/supabase';
import { DatabaseOrder } from '@/types/order';

const ORDERS_TABLE = 'orders';

export class OrderRepository {
  static isMissingOrdersTableError(error: any): boolean {
    return (
      error?.code === '42P01' ||
      error?.code === 'PGRST116' ||
      error?.code === 'PGRST205' ||
      /relation ".*orders" does not exist/i.test(error?.message || '') ||
      /could not find the relation/i.test(error?.message || '')
    ) && error?.code !== 'PGRST204';
  }

  static async listOrders(): Promise<DatabaseOrder[]> {
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .select('*')
      .order('order_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async listUserOrders(userId: string): Promise<DatabaseOrder[]> {
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('order_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createOrder(
    userId: string,
    details: {
      customerName: string;
      email: string;
      phone?: string | null;
      address?: string | null;
      productName: string;
      quantity?: number;
      totalPrice: number;
      blueprintType: string;
      drawingData?: any;
    }
  ): Promise<DatabaseOrder> {
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .insert({
        user_id: userId,
        customer_name: details.customerName,
        email: details.email,
        phone: details.phone || null,
        address: details.address || null,
        product_name: details.productName,
        quantity: details.quantity || 1,
        total_price: details.totalPrice,
        blueprint_type: details.blueprintType,
        drawing_data: details.drawingData || null,
        status: 'Pending',
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  static async updateOrderStatus(
    id: string,
    status: string,
    remarks?: string | null
  ): Promise<DatabaseOrder> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (remarks !== undefined) {
      updateData.remarks = remarks;
    }

    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      // Check if the remarks column is missing in PostgreSQL (undefined_column '42703' or 'PGRST204')
      if ((error.code === '42703' || error.code === 'PGRST204') && remarks !== undefined) {
        console.warn('Supabase orders table does not contain remarks column. Falling back to status-only update.');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from(ORDERS_TABLE)
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*')
          .single();

        if (fallbackError) throw fallbackError;
        if (fallbackData) {
          fallbackData.remarks = remarks; // Attach remarks locally for response mapping
        }
        return fallbackData;
      }
      throw error;
    }
    return data;
  }
}
