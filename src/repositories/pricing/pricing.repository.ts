import { supabase } from '@/lib/supabase';
import { PricingSettings } from '@/types/pricing';

const PRICING_TABLE = 'pricing_settings';
const DEFAULT_PRICING_ID = 'default';

export class PricingRepository {
  static isMissingPricingTableError(error: any): boolean {
    return (
      error?.code === '42P01' ||
      error?.code === 'PGRST205' ||
      /pricing_settings/i.test(error?.message || '')
    );
  }

  static async getPricingSettings(): Promise<{ data: PricingSettings } | null> {
    const { data, error } = await supabase
      .from(PRICING_TABLE)
      .select('data')
      .eq('id', DEFAULT_PRICING_ID)
      .maybeSingle();

    if (error) {
      if (this.isMissingPricingTableError(error)) {
        return null;
      }
      throw error;
    }
    return data;
  }

  static async updatePricingSettings(normalized: PricingSettings): Promise<{ data: PricingSettings }> {
    const { data, error } = await supabase
      .from(PRICING_TABLE)
      .upsert({
        id: DEFAULT_PRICING_ID,
        data: normalized,
        updated_at: new Date().toISOString(),
      })
      .select('data')
      .single();

    if (error) {
      throw error;
    }
    return data;
  }
}
