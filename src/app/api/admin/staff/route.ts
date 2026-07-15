import { NextResponse } from 'next/server';
import { authenticateRequest, checkRole, checkPermission, AuthError } from '@/middleware/auth';
import { AdminService, AdminError } from '@/services/admin/admin.service';
import { createStaffSchema } from '@/validators/admin/admin.validator';

export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);
    checkRole(user, 'admin', 'staff');
    checkPermission(user, 'staff.show');

    const result = await AdminService.listStaff();
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('List Staff API Error:', err);
    if (err instanceof AuthError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request);
    checkRole(user, 'admin', 'staff');
    checkPermission(user, 'staff.create');

    const body = await request.json();
    const validated = createStaffSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }

    const result = await AdminService.createStaff(validated.data);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error('Create Staff API Error:', err);
    if (err instanceof AuthError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    if (err instanceof AdminError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
