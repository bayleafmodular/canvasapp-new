import { NextResponse } from 'next/server';
import { authenticateRequest, checkRole, AuthError } from '@/middleware/auth';
import { OrderService, OrderError } from '@/services/orders/order.service';

export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);
    checkRole(user, 'admin', 'staff');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const result = await OrderService.listOrders({ page, limit, search, status });
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Admin List Orders API Error:', err);
    if (err instanceof AuthError || (err && err.status === 401)) {
      return NextResponse.json({ message: err.message }, { status: err.status || 401 });
    }
    const status = err.status || 500;
    return NextResponse.json({ message: err.message || 'Internal Server Error' }, { status });
  }
}
