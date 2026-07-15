import { NextResponse } from 'next/server';
import { verifyLogin2faSchema } from '@/validators/auth.validator';
import { AuthService, AuthError } from '@/services/auth.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = verifyLogin2faSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }

    const result = await AuthService.verifyLogin2fa(validated.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Verify 2FA API Error:', err);
    if (err instanceof AuthError) {
      return NextResponse.json({ message: err.message, ...err.data }, { status: err.status });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
