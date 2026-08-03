import { OrderRepository } from '@/repositories/orders/order.repository';
import { DatabaseOrder, PublicOrder } from '@/types/order';
import { CreateOrderInput, UpdateOrderStatusInput } from '@/validators/orders/order.validator';

export class OrderError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.name = 'OrderError';
  }
}

export const toPublicOrder = (row: DatabaseOrder | null): PublicOrder | null => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    productName: row.product_name,
    quantity: row.quantity,
    totalPrice: Number(row.total_price),
    orderDate: row.order_date,
    status: row.status,
    blueprintType: row.blueprint_type,
    drawingData: row.drawing_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    remarks: row.remarks || '',
  };
};

export class OrderService {
  static async listOrders(options: { page?: number; limit?: number; search?: string; status?: string } = {}): Promise<{ data: PublicOrder[]; total: number }> {
    const result = await OrderRepository.listOrders(options);
    return {
      data: result.data.map((row) => toPublicOrder(row)).filter(Boolean) as PublicOrder[],
      total: result.total
    };
  }

  static async listUserOrders(userId: string, email: string, options: { page?: number; limit?: number; search?: string; status?: string } = {}): Promise<{ data: PublicOrder[]; total: number }> {
    const result = await OrderRepository.listUserOrders(userId, options);
    return {
      data: result.data.map((row) => toPublicOrder(row)).filter(Boolean) as PublicOrder[],
      total: result.total
    };
  }

  static async getOrderById(id: string): Promise<PublicOrder> {
    const order = await OrderRepository.getOrderById(id);
    const formatted = toPublicOrder(order);
    if (!formatted) {
      throw new OrderError('Order not found', 404);
    }
    return formatted;
  }

  static async createOrder(userId: string, input: CreateDrawingInputOrOrderDetails): Promise<PublicOrder> {
    const order = await OrderRepository.createOrder(userId, {
      customerName: input.customerName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      productName: input.productName,
      quantity: input.quantity,
      totalPrice: input.totalPrice,
      blueprintType: input.blueprintType,
      drawingData: input.drawingData,
    });

    const formatted = toPublicOrder(order);
    if (!formatted) {
      throw new OrderError('Failed to format order details', 500);
    }
    return formatted;
  }

  static async updateOrderStatus(id: string, input: UpdateOrderStatusInput): Promise<PublicOrder> {
    const order = await OrderRepository.updateOrderStatus(id, input.status, input.remarks);
    const formatted = toPublicOrder(order);
    if (!formatted) {
      throw new OrderError('Order not found', 404);
    }
    return formatted;
  }
}

type CreateDrawingInputOrOrderDetails = CreateOrderInput;
