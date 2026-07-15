export interface PricingRates {
  linePerMeter: number;
  polylinePerMeter: number;
  freeDrawPerMeter: number;
  wallPerMeter: number;
  beamPerMeter: number;
  lintelPerMeter: number;
  arcPerMeter: number;
  rectanglePerSqMeter: number;
  circlePerSqMeter: number;
}

export interface PricingSettings {
  currency: string;
  rates: PricingRates;
}
