import { NextResponse } from 'next/server';
import { authenticateRequest, checkRole, checkPermission, AuthError } from '@/middleware/auth';
import { AdminService, AdminError } from '@/services/admin/admin.service';

export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);
    checkRole(user, 'admin', 'staff');
    checkPermission(user, 'dashboard.show');

    const result = await AdminService.getDashboardStats();
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Get Dashboard Stats API Error:', err);
    if (err instanceof AuthError || (err && err.status === 401)) {
      return NextResponse.json({ message: err.message }, { status: err.status || 401 });
    }
    if (err instanceof AdminError || (err && err.status)) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
