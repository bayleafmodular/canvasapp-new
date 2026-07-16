import { ShapeType } from '@/types';

export const PRICE_FIELD_DEFS = [
  { key: "wallPerMeter", label: "Wall", unit: "per mm" },
  { key: "beamPerMeter", label: "Beam", unit: "per mm" },
  { key: "lintelPerMeter", label: "Lintel", unit: "per mm" },
  { key: "linePerMeter", label: "Line", unit: "per mm" },
  { key: "polylinePerMeter", label: "Polyline", unit: "per mm" },
  { key: "freeDrawPerMeter", label: "Free draw", unit: "per mm" },
  { key: "arcPerMeter", label: "Arc", unit: "per mm" },
  { key: "rectanglePerSqMeter", label: "Rectangle perimeter", unit: "per mm" },
  { key: "circlePerSqMeter", label: "Circle circumference", unit: "per mm" },
];

export const DEFAULT_PRICING = {
  currency: "INR",
  rates: {
    linePerMeter: 0,
    polylinePerMeter: 0,
    freeDrawPerMeter: 0,
    wallPerMeter: 1200,
    beamPerMeter: 1500,
    lintelPerMeter: 800,
    arcPerMeter: 0,
    rectanglePerSqMeter: 0,
    circlePerSqMeter: 0,
  },
};

const distance = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1);

const pathLengthMm = (points: number[] = []) => {
  let total = 0;
  for (let i = 0; i < points.length - 3; i += 2) {
    total += distance(points[i], points[i + 1], points[i + 2], points[i + 3]);
  }
  return total;
};

interface LineItem {
  key: string;
  label: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

const addLineItem = (items: LineItem[], key: string, label: string, quantity: number, unit: string, rate: number) => {
  if (!quantity || !rate) return;
  const existing = items.find((item) => item.key === key);
  if (existing) {
    existing.quantity += quantity;
    existing.total = existing.quantity * existing.rate;
    return;
  }
  items.push({ key, label, quantity, unit, rate, total: quantity * rate });
};

export function calculateDrawingPrice(objects: any[] = [], pricing: any = DEFAULT_PRICING) {
  const rates = { ...DEFAULT_PRICING.rates, ...(pricing.rates || {}) } as any;
  const items: LineItem[] = [];

  objects.forEach((obj) => {
    switch (obj.type) {
      case ShapeType.LINE:
        addLineItem(items, "linePerMeter", "Line", pathLengthMm(obj.points), "mm", Number(rates.linePerMeter));
        break;
      case ShapeType.POLYLINE:
        addLineItem(items, "polylinePerMeter", "Polyline", pathLengthMm(obj.points), "mm", Number(rates.polylinePerMeter));
        break;
      case ShapeType.FREE_DRAW:
        addLineItem(items, "freeDrawPerMeter", "Free draw", pathLengthMm(obj.points), "mm", Number(rates.freeDrawPerMeter));
        break;
      case ShapeType.WALL:
        addLineItem(items, "wallPerMeter", "Wall", pathLengthMm(obj.points), "mm", Number(rates.wallPerMeter));
        break;
      case ShapeType.BEAM:
        addLineItem(items, "beamPerMeter", "Beam", pathLengthMm(obj.points), "mm", Number(rates.beamPerMeter));
        break;
      case ShapeType.LINTEL:
        addLineItem(items, "lintelPerMeter", "Lintel", pathLengthMm(obj.points), "mm", Number(rates.lintelPerMeter));
        break;
      case ShapeType.ARC: {
        const arcLengthMm = Number(obj.radius || 0) * Math.abs(Number(obj.endAngle || 0)) * Math.PI / 180;
        addLineItem(items, "arcPerMeter", "Arc", arcLengthMm, "mm", Number(rates.arcPerMeter));
        break;
      }
      case ShapeType.RECTANGLE: {
        const perimeterMm = 2 * (Math.abs(Number(obj.width || 0)) + Math.abs(Number(obj.height || 0)));
        addLineItem(items, "rectanglePerSqMeter", "Rectangle perimeter", perimeterMm, "mm", Number(rates.rectanglePerSqMeter));
        break;
      }
      case ShapeType.CIRCLE: {
        const circumferenceMm = 2 * Math.PI * Number(obj.radius || 0);
        addLineItem(items, "circlePerSqMeter", "Circle circumference", circumferenceMm, "mm", Number(rates.circlePerSqMeter));
        break;
      }
    }
  });

  return {
    currency: pricing.currency || DEFAULT_PRICING.currency,
    items,
    total: items.reduce((sum, item) => sum + item.total, 0),
  };
}

