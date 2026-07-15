import { PricingRepository } from '@/repositories/pricing/pricing.repository';
import { PricingSettings } from '@/types/pricing';
import { UpdatePricingInput } from '@/validators/pricing/pricing.validator';

export class PricingError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.name = 'PricingError';
  }
}

export const DEFAULT_PRICING: PricingSettings = {
  currency: 'INR',
  rates: {
    linePerMeter: 0,
    polylinePerMeter: 0,
    freeDrawPerMeter: 0,
    wallPerMeter: 1.2,
    beamPerMeter: 1.5,
    lintelPerMeter: 0.8,
    arcPerMeter: 0,
    rectanglePerSqMeter: 0,
    circlePerSqMeter: 0,
  },
};

export class PricingService {
  private static toNumber(value: any, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }

  static normalizePricing(pricing: any = {}): PricingSettings {
    const rates = pricing.rates || {};
    const defaultRates = DEFAULT_PRICING.rates;

    return {
      currency: String(pricing.currency || DEFAULT_PRICING.currency).trim().slice(0, 8) || DEFAULT_PRICING.currency,
      rates: {
        linePerMeter: this.toNumber(rates.linePerMeter, defaultRates.linePerMeter),
        polylinePerMeter: this.toNumber(rates.polylinePerMeter, defaultRates.polylinePerMeter),
        freeDrawPerMeter: this.toNumber(rates.freeDrawPerMeter, defaultRates.freeDrawPerMeter),
        wallPerMeter: this.toNumber(rates.wallPerMeter, defaultRates.wallPerMeter),
        beamPerMeter: this.toNumber(rates.beamPerMeter, defaultRates.beamPerMeter),
        lintelPerMeter: this.toNumber(rates.lintelPerMeter, defaultRates.lintelPerMeter),
        arcPerMeter: this.toNumber(rates.arcPerMeter, defaultRates.arcPerMeter),
        rectanglePerSqMeter: this.toNumber(rates.rectanglePerSqMeter, defaultRates.rectanglePerSqMeter),
        circlePerSqMeter: this.toNumber(rates.circlePerSqMeter, defaultRates.circlePerSqMeter),
      },
    };
  }

  static async getPricingSettings(): Promise<PricingSettings> {
    try {
      const data = await PricingRepository.getPricingSettings();
      if (!data) {
        console.warn('pricing_settings table is missing; using default pricing settings');
        return this.normalizePricing(DEFAULT_PRICING);
      }
      return this.normalizePricing(data.data);
    } catch (err: any) {
      if (PricingRepository.isMissingPricingTableError(err)) {
        console.warn('pricing_settings table is missing; using default pricing settings');
        return this.normalizePricing(DEFAULT_PRICING);
      }
      throw err;
    }
  }

  static async updatePricingSettings(input: UpdatePricingInput): Promise<PricingSettings> {
    const current = await this.getPricingSettings();
    const updatedPayload = {
      currency: input.currency !== undefined ? input.currency : current.currency,
      rates: {
        ...current.rates,
        ...(input.rates || {}),
      },
    };

    const normalized = this.normalizePricing(updatedPayload);

    try {
      const result = await PricingRepository.updatePricingSettings(normalized);
      return this.normalizePricing(result.data);
    } catch (err: any) {
      if (PricingRepository.isMissingPricingTableError(err)) {
        throw new PricingError(
          'Pricing table is missing. Run server/sql/pricing_settings.sql in Supabase.',
          503
        );
      }
      throw err;
    }
  }
}
