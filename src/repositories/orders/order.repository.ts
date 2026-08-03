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

  static async listOrders(options: { page?: number; limit?: number; search?: string; status?: string } = {}): Promise<{ data: DatabaseOrder[]; total: number }> {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const offset = (page - 1) * limit;

    let query = supabase
      .from(ORDERS_TABLE)
      .select('*', { count: 'exact' });

    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    if (options.search) {
      const searchPattern = `%${options.search}%`;
      query = query.or(`customer_name.ilike.${searchPattern},email.ilike.${searchPattern},id.ilike.${searchPattern},product_name.ilike.${searchPattern}`);
    }

    const { data, error, count } = await query
      .order('order_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return {
      data: data || [],
      total: count || 0
    };
  }

  static async listUserOrders(userId: string, options: { page?: number; limit?: number; search?: string; status?: string } = {}): Promise<{ data: DatabaseOrder[]; total: number }> {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const offset = (page - 1) * limit;

    let query = supabase
      .from(ORDERS_TABLE)
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    if (options.search) {
      const searchPattern = `%${options.search}%`;
      query = query.or(`id.ilike.${searchPattern},product_name.ilike.${searchPattern}`);
    }

    const { data, error, count } = await query
      .order('order_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return {
      data: data || [],
      total: count || 0
    };
  }

  static async getOrderById(id: string): Promise<DatabaseOrder | null> {
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
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
