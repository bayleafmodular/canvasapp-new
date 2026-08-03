import { NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/middleware/auth';
import { OrderService, OrderError } from '@/services/orders/order.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    const resolvedParams = await params;
    const order = await OrderService.getOrderById(resolvedParams.id);

    // Verify ownership
    const hasAccess =
      order.userId === user.id ||
      (order.email && user.email && order.email.toLowerCase() === user.email.toLowerCase());

    if (!hasAccess) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: order }, { status: 200 });
  } catch (err: any) {
    console.error('Get Order API Error:', err);
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
