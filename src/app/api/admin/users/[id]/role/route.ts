import { NextResponse } from 'next/server';
import { authenticateRequest, checkRole, checkPermission, AuthError } from '@/middleware/auth';
import { AdminService, AdminError } from '@/services/admin/admin.service';
import { updateUserRoleSchema } from '@/validators/admin/admin.validator';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    checkRole(user, 'admin', 'staff');
    checkPermission(user, 'users.edit');

    const resolvedParams = await params;
    if (user.id === resolvedParams.id) {
      return NextResponse.json({ message: 'You cannot change your own role' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateUserRoleSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }

    const result = await AdminService.updateUserRole(resolvedParams.id, validated.data.role);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Update User Role API Error:', err);
    if (err instanceof AuthError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    if (err instanceof AdminError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
