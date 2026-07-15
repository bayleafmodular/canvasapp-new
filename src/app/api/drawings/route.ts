import { NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/middleware/auth';
import { DrawingService, DrawingError } from '@/services/drawings/drawing.service';
import { createDrawingSchema } from '@/validators/drawings/drawing.validator';

export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);
    const drawings = await DrawingService.listDrawingsForUser(user.id);
    return NextResponse.json(drawings, { status: 200 });
  } catch (err: any) {
    console.error('List Drawings API Error:', err);
    if (err instanceof AuthError || (err && err.status === 401)) {
      return NextResponse.json({ message: err.message }, { status: err.status || 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request);
    const body = await request.json();
    const validated = createDrawingSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }

    const result = await DrawingService.createDrawingForUser(user.id, validated.data);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error('Create Drawing API Error:', err);
    if (err instanceof AuthError || (err && err.status === 401)) {
      return NextResponse.json({ message: err.message }, { status: err.status || 401 });
    }
    if (err instanceof DrawingError || (err && err.status)) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
