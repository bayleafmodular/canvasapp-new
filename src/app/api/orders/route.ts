import { NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/middleware/auth';
import { OrderService, OrderError } from '@/services/orders/order.service';
import { createOrderSchema } from '@/validators/orders/order.validator';

export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);
    const result = await OrderService.listUserOrders(user.id, user.email);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('List Orders API Error:', err);
    if (err instanceof AuthError || (err && err.status === 401)) {
      return NextResponse.json({ message: err.message }, { status: err.status || 401 });
    }
    const status = err.status || 500;
    return NextResponse.json({ message: err.message || 'Internal Server Error' }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request);
    const body = await request.json();
    const validated = createOrderSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }

    const result = await OrderService.createOrder(user.id, validated.data);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error('Create Order API Error:', err);
    if (err instanceof AuthError || (err && err.status === 401)) {
      return NextResponse.json({ message: err.message }, { status: err.status || 401 });
    }
    if (err instanceof OrderError || (err && err.status)) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    const status = err.status || 500;
    return NextResponse.json({ message: err.message || 'Internal Server Error' }, { status });
  }
}
