import { NextResponse } from 'next/server';
import { authenticateRequest, checkRole, checkPermission, AuthError } from '@/middleware/auth';
import { PricingService, PricingError } from '@/services/pricing/pricing.service';
import { updatePricingSchema } from '@/validators/pricing/pricing.validator';

export async function GET(request: Request) {
  try {
    await authenticateRequest(request);
    const result = await PricingService.getPricingSettings();
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Get Pricing API Error:', err);
    if (err instanceof AuthError || (err && err.status === 401)) {
      return NextResponse.json({ message: err.message }, { status: err.status || 401 });
    }
    return NextResponse.json({ message: 'Failed to load pricing settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await authenticateRequest(request);
    checkRole(user, 'admin', 'staff');
    checkPermission(user, 'pricing.edit');

    const body = await request.json();
    const validated = updatePricingSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }

    const result = await PricingService.updatePricingSettings(validated.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Update Pricing API Error:', err);
    if (err instanceof AuthError || (err && err.status)) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    if (err instanceof PricingError || (err && err.status)) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Failed to update pricing settings' }, { status: 500 });
  }
}
