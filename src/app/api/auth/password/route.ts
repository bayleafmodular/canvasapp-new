import { NextResponse } from 'next/server';
import { changePasswordSchema } from '@/validators/auth.validator';
import { AuthService, AuthError } from '@/services/auth.service';
import { authenticateRequest } from '@/middleware/auth';

export async function PATCH(request: Request) {
  try {
    const user = await authenticateRequest(request);
    const body = await request.json();
    const validated = changePasswordSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }

    const result = await AuthService.changePassword(user.id, validated.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Change Password API Error:', err);
    if (err instanceof AuthError) {
      return NextResponse.json({ message: err.message, ...err.data }, { status: err.status });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
