import { NextResponse } from 'next/server';
import { authenticateRequest, checkRole, checkPermission, AuthError } from '@/middleware/auth';
import { AdminService, AdminError } from '@/services/admin/admin.service';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    checkRole(user, 'admin', 'staff');
    checkPermission(user, 'users.edit');

    const resolvedParams = await params;
    const result = await AdminService.deleteUser(resolvedParams.id);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Delete User API Error:', err);
    if (err instanceof AuthError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    if (err instanceof AdminError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
