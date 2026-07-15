import { OrderRepository } from '@/repositories/orders/order.repository';
import { DatabaseOrder, PublicOrder } from '@/types/order';
import { CreateOrderInput, UpdateOrderStatusInput } from '@/validators/orders/order.validator';

export class OrderError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.name = 'OrderError';
  }
}

// Initial mock orders for in-memory fallback testing
const INITIAL_MOCK_ORDERS: PublicOrder[] = [
  {
    id: "ORD-2026-001",
    customerName: "Robert Miller",
    email: "robert.miller@example.com",
    phone: "+1 (555) 382-9012",
    address: "124 Oak Ave, Austin, TX 78701",
    productName: "2BHK House Plan Layout",
    quantity: 1,
    totalPrice: 150.00,
    orderDate: "2026-06-15",
    status: "Completed",
    blueprintType: "house_2bhk",
    createdAt: "2026-06-15T00:00:00Z",
    updatedAt: "2026-06-15T00:00:00Z",
    remarks: "",
  },
  {
    id: "ORD-2026-002",
    customerName: "Sarah Jenkins",
    email: "sarah.j@example.com",
    phone: "+1 (555) 019-2834",
    address: "742 Evergreen Terrace, Springfield, OR 97477",
    productName: "Modern Studio Apartment",
    quantity: 1,
    totalPrice: 99.00,
    orderDate: "2026-06-16",
    status: "Processing",
    blueprintType: "studio",
    createdAt: "2026-06-16T00:00:00Z",
    updatedAt: "2026-06-16T00:00:00Z",
    remarks: "",
  },
  {
    id: "ORD-2026-003",
    customerName: "Alex Johnson",
    email: "alex.j@example.com",
    phone: "+1 (555) 728-1934",
    address: "893 Maple St, Seattle, WA 98101",
    productName: "Commercial Office Floorplan",
    quantity: 2,
    totalPrice: 450.00,
    orderDate: "2026-06-17",
    status: "Pending",
    blueprintType: "office",
    createdAt: "2026-06-17T00:00:00Z",
    updatedAt: "2026-06-17T00:00:00Z",
    remarks: "",
  },
  {
    id: "ORD-2026-004",
    customerName: "Michael Chen",
    email: "m.chen@example.com",
    phone: "+1 (555) 392-1209",
    address: "550 Broadway, New York, NY 10012",
    productName: "Industrial Warehouse Blueprint",
    quantity: 1,
    totalPrice: 350.00,
    orderDate: "2026-06-18",
    status: "Completed",
    blueprintType: "warehouse",
    createdAt: "2026-06-18T00:00:00Z",
    updatedAt: "2026-06-18T00:00:00Z",
    remarks: "",
  },
  {
    id: "ORD-2026-005",
    customerName: "Pamela Davis",
    email: "pamela.davis@example.com",
    phone: "+1 (555) 482-1928",
    address: "56 Pine Rd, Atlanta, GA 30309",
    productName: "Duplex Villa Foundation Plan",
    quantity: 1,
    totalPrice: 249.00,
    orderDate: "2026-06-19",
    status: "Pending",
    blueprintType: "duplex",
    createdAt: "2026-06-19T00:00:00Z",
    updatedAt: "2026-06-19T00:00:00Z",
    remarks: "",
  },
  {
    id: "ORD-2026-006",
    customerName: "David Miller",
    email: "david.miller@example.com",
    phone: "+44 20 7946 0192",
    address: "Flat 12, Baker Street, London, NW1 6XE",
    productName: "Retail Store Floor Layout",
    quantity: 1,
    totalPrice: 180.00,
    orderDate: "2026-06-20",
    status: "Processing",
    blueprintType: "retail",
    createdAt: "2026-06-20T00:00:00Z",
    updatedAt: "2026-06-20T00:00:00Z",
    remarks: "",
  },
  {
    id: "ORD-2026-007",
    customerName: "Steven Baker",
    email: "steven.baker@example.com",
    phone: "+1 (555) 891-0293",
    address: "12 Walnut Dr, Denver, CO 80202",
    productName: "3BHK Luxury Floorplan",
    quantity: 1,
    totalPrice: 280.00,
    orderDate: "2026-06-20",
    status: "Pending",
    blueprintType: "house_3bhk",
    createdAt: "2026-06-20T00:00:00Z",
    updatedAt: "2026-06-20T00:00:00Z",
    remarks: "",
  },
  {
    id: "ORD-2026-008",
    customerName: "Emily Watson",
    email: "emily.w@example.com",
    phone: "+1 (555) 902-1245",
    address: "902 Pine Street, Seattle, WA 98101",
    productName: "Kitchen Renovation Plan",
    quantity: 1,
    totalPrice: 79.00,
    orderDate: "2026-06-21",
    status: "Completed",
    blueprintType: "kitchen",
    createdAt: "2026-06-21T00:00:00Z",
    updatedAt: "2026-06-21T00:00:00Z",
    remarks: "",
  },
  {
    id: "ORD-2026-009",
    customerName: "Alan Green",
    email: "alan.green@example.com",
    phone: "+1 (555) 234-5678",
    address: "405 Birch Ave, Boston, MA 02108",
    productName: "Terrace Garden Layout",
    quantity: 1,
    totalPrice: 59.00,
    orderDate: "2026-06-21",
    status: "Processing",
    blueprintType: "garden",
    createdAt: "2026-06-21T00:00:00Z",
    updatedAt: "2026-06-21T00:00:00Z",
    remarks: "",
  },
  {
    id: "ORD-2026-010",
    customerName: "Sophia Rodriguez",
    email: "sophia.r@example.com",
    phone: "+34 612 345 678",
    address: "Calle Mayor 14, Madrid, 28013",
    productName: "Boutique Hotel Suite Design",
    quantity: 3,
    totalPrice: 520.00,
    orderDate: "2026-06-22",
    status: "Pending",
    blueprintType: "hotel",
    createdAt: "2026-06-22T00:00:00Z",
    updatedAt: "2026-06-22T00:00:00Z",
    remarks: "",
  },
  {
    id: "ORD-2026-011",
    customerName: "Vincent Stark",
    email: "vincent.stark@example.com",
    phone: "+1 (555) 678-9012",
    address: "10880 Malibu Point, Malibu, CA 90265",
    productName: "Penthouse Deck Design",
    quantity: 1,
    totalPrice: 199.00,
    orderDate: "2026-06-22",
    status: "Processing",
    blueprintType: "penthouse",
    createdAt: "2026-06-22T00:00:00Z",
    updatedAt: "2026-06-22T00:00:00Z",
    remarks: "",
  },
  {
    id: "ORD-2026-012",
    customerName: "Olivia Taylor",
    email: "olivia.t@example.com",
    phone: "+61 2 9382 1234",
    address: "24 Alfred St, Milsons Point, Sydney, NSW 2061",
    productName: "Co-working Space Concept",
    quantity: 1,
    totalPrice: 399.00,
    orderDate: "2026-06-22",
    status: "Completed",
    blueprintType: "coworking",
    createdAt: "2026-06-22T00:00:00Z",
    updatedAt: "2026-06-22T00:00:00Z",
    remarks: "",
  }
];

const localOrders: PublicOrder[] = [...INITIAL_MOCK_ORDERS];

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
  static async listOrders(): Promise<PublicOrder[]> {
    try {
      const orders = await OrderRepository.listOrders();
      return orders.map((row) => toPublicOrder(row)).filter(Boolean) as PublicOrder[];
    } catch (err) {
      if (OrderRepository.isMissingOrdersTableError(err)) {
        console.warn('Orders table is missing in Supabase. Falling back to local in-memory mock data.');
        return localOrders;
      }
      throw err;
    }
  }

  static async listUserOrders(userId: string, email: string): Promise<PublicOrder[]> {
    try {
      const orders = await OrderRepository.listUserOrders(userId);
      return orders.map((row) => toPublicOrder(row)).filter(Boolean) as PublicOrder[];
    } catch (err) {
      if (OrderRepository.isMissingOrdersTableError(err)) {
        console.warn('Orders table is missing in Supabase. Filtering local mock data.');
        return localOrders.filter(
          (o) =>
            o.userId === userId ||
            (o.email && email && o.email.toLowerCase() === email.toLowerCase())
        );
      }
      throw err;
    }
  }

  static async createOrder(userId: string, input: CreateDrawingInputOrOrderDetails): Promise<PublicOrder> {
    try {
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
    } catch (err) {
      if (OrderRepository.isMissingOrdersTableError(err)) {
        console.warn('Orders table is missing in Supabase. Placing order in local in-memory storage.');
        const year = new Date().getFullYear();
        const count = localOrders.length + 1;
        const localId = `ORD-${year}-${String(count).padStart(3, '0')}`;
        const newOrder: PublicOrder = {
          id: localId,
          userId: userId,
          customerName: input.customerName,
          email: input.email,
          phone: input.phone || null,
          address: input.address || null,
          productName: input.productName,
          quantity: input.quantity || 1,
          totalPrice: Number(input.totalPrice),
          orderDate: new Date().toISOString(),
          status: 'Pending',
          blueprintType: input.blueprintType,
          drawingData: input.drawingData || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          remarks: '',
        };
        localOrders.unshift(newOrder);
        return newOrder;
      }
      throw err;
    }
  }

  static async updateOrderStatus(id: string, input: UpdateOrderStatusInput): Promise<PublicOrder> {
    try {
      const order = await OrderRepository.updateOrderStatus(id, input.status, input.remarks);
      const formatted = toPublicOrder(order);
      if (!formatted) {
        throw new OrderError('Order not found', 404);
      }
      return formatted;
    } catch (err) {
      if (OrderRepository.isMissingOrdersTableError(err)) {
        console.warn('Orders table is missing in Supabase. Updating order in local in-memory storage.');
        const orderIndex = localOrders.findIndex((o) => o.id === id);
        if (orderIndex === -1) {
          throw new OrderError('Order not found', 404);
        }
        localOrders[orderIndex] = {
          ...localOrders[orderIndex],
          status: input.status,
          updatedAt: new Date().toISOString(),
        };
        if (input.remarks !== undefined) {
          localOrders[orderIndex].remarks = input.remarks || '';
        }
        return localOrders[orderIndex];
      }
      throw err;
    }
  }
}

type CreateDrawingInputOrOrderDetails = CreateOrderInput;
