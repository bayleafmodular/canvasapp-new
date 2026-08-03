import { NextResponse } from 'next/server';
import { authenticateRequest, checkRole, checkPermission, AuthError } from '@/middleware/auth';
import { TemplateService, TemplateError } from '@/services/templates/template.service';
import { createTemplateSchema } from '@/validators/templates/template.validator';

export async function GET(request: Request) {
  try {
    await authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') || '1', 10) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') || '10', 10) : undefined;
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;

    const result = await TemplateService.listTemplates({ page, limit, search, status, category });
    
    // For backward compatibility: if page and limit are not provided, return the list directly in { data }
    if (page === undefined && limit === undefined) {
      return NextResponse.json({ data: result.data }, { status: 200 });
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('List Templates API Error:', err);
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
    checkPermission(user, 'templates.create');

    const body = await request.json();
    const validated = createTemplateSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }

    const result = await TemplateService.createTemplate(validated.data);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err: any) {
    console.error('Create Template API Error:', err);
    if (err instanceof AuthError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    if (err instanceof TemplateError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
