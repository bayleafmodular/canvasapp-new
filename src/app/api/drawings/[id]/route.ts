import { NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/middleware/auth';
import { DrawingService, DrawingError } from '@/services/drawings/drawing.service';
import { updateDrawingSchema } from '@/validators/drawings/drawing.validator';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    const resolvedParams = await params;
    const result = await DrawingService.getDrawingForUser(user.id, resolvedParams.id);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Get Drawing API Error:', err);
    if (err instanceof AuthError || (err && err.status === 401)) {
      return NextResponse.json({ message: err.message }, { status: err.status || 401 });
    }
    if (err instanceof DrawingError || (err && err.status)) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    const resolvedParams = await params;
    const body = await request.json();
    const validated = updateDrawingSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }

    const result = await DrawingService.updateDrawingForUser(user.id, resolvedParams.id, validated.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Update Drawing API Error:', err);
    if (err instanceof AuthError || (err && err.status === 401)) {
      return NextResponse.json({ message: err.message }, { status: err.status || 401 });
    }
    if (err instanceof DrawingError || (err && err.status)) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    const resolvedParams = await params;
    const result = await DrawingService.deleteDrawingForUser(user.id, resolvedParams.id);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Delete Drawing API Error:', err);
    if (err instanceof AuthError || (err && err.status === 401)) {
      return NextResponse.json({ message: err.message }, { status: err.status || 401 });
    }
    if (err instanceof DrawingError || (err && err.status)) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
