import { NextResponse } from 'next/server';
import { AuthError, authenticateRequest } from '@/middleware/auth';

export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);
    return NextResponse.json(user, { status: 200 });
  } catch (err: any) {
    console.error('Get User Profile API Error:', err);
    if (err instanceof AuthError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
