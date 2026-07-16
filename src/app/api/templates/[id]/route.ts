import { NextResponse } from 'next/server';
import { authenticateRequest, checkRole, checkPermission, AuthError } from '@/middleware/auth';
import { TemplateService, TemplateError } from '@/services/templates/template.service';
import { updateTemplateSchema } from '@/validators/templates/template.validator';
import fs from 'fs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authenticateRequest(request);
    const resolvedParams = await params;
    const result = await TemplateService.getTemplateById(resolvedParams.id);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err: any) {
    console.error('Get Template API Error:', err);
    try {
      fs.writeFileSync(
        'c:/Users/ADMIN/Desktop/MNG1308-Backup-29-06/canvasapp-main/next-client/error.log',
        `Error Message: ${err.message}\nStack Trace:\n${err.stack || 'No stack'}`
      );
    } catch (logErr) {
      console.error('Failed to write absolute log file:', logErr);
    }
    if (err instanceof AuthError || (err && err.status === 401)) {
      return NextResponse.json({ message: err.message }, { status: err.status || 401 });
    }
    if (err instanceof TemplateError || (err && err.status === 404)) {
      return NextResponse.json({ message: err.message }, { status: err.status || 404 });
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
    checkRole(user, 'admin', 'staff');
    checkPermission(user, 'templates.edit');

    const resolvedParams = await params;
    const body = await request.json();
    const validated = updateTemplateSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }

    const result = await TemplateService.updateTemplate(resolvedParams.id, validated.data);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err: any) {
    console.error('Update Template API Error:', err);
    if (err instanceof AuthError || (err && err.status)) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    if (err instanceof TemplateError || (err && err.status)) {
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
    checkRole(user, 'admin', 'staff');
    checkPermission(user, 'templates.edit');

    const resolvedParams = await params;
    const result = await TemplateService.deleteTemplate(resolvedParams.id);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Delete Template API Error:', err);
    if (err instanceof AuthError || (err && err.status)) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    if (err instanceof TemplateError || (err && err.status)) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
