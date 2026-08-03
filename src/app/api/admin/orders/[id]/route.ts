import { NextResponse } from 'next/server';
import { authenticateRequest, checkRole, AuthError } from '@/middleware/auth';
import { OrderService, OrderError } from '@/services/orders/order.service';
import { updateOrderStatusSchema } from '@/validators/orders/order.validator';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    checkRole(user, 'admin', 'staff');

    const resolvedParams = await params;
    const result = await OrderService.getOrderById(resolvedParams.id);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err: any) {
    console.error('Admin Get Order API Error:', err);
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    checkRole(user, 'admin', 'staff');

    const resolvedParams = await params;
    const body = await request.json();
    const validated = updateOrderStatusSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }

    const result = await OrderService.updateOrderStatus(resolvedParams.id, validated.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Admin Update Order Status API Error:', err);
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
