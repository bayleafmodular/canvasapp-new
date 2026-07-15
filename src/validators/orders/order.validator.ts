import { z } from 'zod';

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  productName: z.string().trim().min(1, 'Product name is required'),
  quantity: z.number().int().min(1).default(1).optional(),
  totalPrice: z.number().min(0, 'Total price must be positive'),
  blueprintType: z.string().trim().min(1, 'Blueprint type is required'),
  drawingData: z.any().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['Pending', 'In Review', 'Processing', 'Approved', 'Rejected', 'Completed']),
  remarks: z.string().trim().nullable().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
