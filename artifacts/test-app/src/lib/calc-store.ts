export interface Sport {
  id: number;
  name: string;
  icon: string;
  baseMet: number;
  appliesElevation: boolean;
}

export interface Multiplier {
  key: string;
  label: string;
  description: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  unit: string;
}

export const DEFAULT_SPORTS: Sport[] = [
  { id: 1,  name: "Course à pied",      icon: "🏃", baseMet: 8.0, appliesElevation: true  },
  { id: 2,  name: "Cyclisme",            icon: "🚴", baseMet: 7.5, appliesElevation: true  },
  { id: 3,  name: "Natation",            icon: "🏊", baseMet: 8.3, appliesElevation: false },
  { id: 4,  name: "Randonnée",           icon: "🥾", baseMet: 5.3, appliesElevation: true  },
  { id: 5,  name: "Ski de fond",         icon: "⛷️", baseMet: 9.0, appliesElevation: true  },
  { id: 6,  name: "Aviron",             icon: "🚣", baseMet: 7.0, appliesElevation: false },
  { id: 7,  name: "Boxe",               icon: "🥊", baseMet: 9.8, appliesElevation: false },
  { id: 8,  name: "Yoga",               icon: "🧘", baseMet: 2.5, appliesElevation: false },
  { id: 9,  name: "Escalade",           icon: "🧗", baseMet: 7.5, appliesElevation: true  },
  { id: 10, name: "Football",           icon: "⚽", baseMet: 7.0, appliesElevation: false },
  { id: 11, name: "Basketball",         icon: "🏀", baseMet: 6.5, appliesElevation: false },
  { id: 12, name: "Tennis",             icon: "🎾", baseMet: 6.0, appliesElevation: false },
  { id: 13, name: "Musculation",        icon: "🏋️", baseMet: 5.0, appliesElevation: false },
  { id: 14, name: "Vélo elliptique",    icon: "🔄", baseMet: 5.5, appliesElevation: false },
];

export const DEFAULT_MULTIPLIERS: Multiplier[] = [
  {
    key: "duration",
    label: "Multiplicateur durée",
    description: "Facteur global appliqué à la durée d'effort",
    value: 1.0,
    defaultValue: 1.0,
    min: 0.5,
    max: 2.0,
    step: 0.05,
    unit: "×",
  },
  {
    key: "heart_rate",
    label: "Sensibilité fréquence cardiaque",
    description: "Influence de la FC sur la dépense calorique",
    value: 1.2,
    defaultValue: 1.2,
    min: 0.5,
    max: 3.0,
    step: 0.1,
    unit: "×",
  },
  {
    key: "vo2_max",
    label: "Facteur VO2 max",
    description: "Ajustement par ml/kg/min au-dessus de 40 (référence)",
    value: 0.01,
    defaultValue: 0.01,
    min: 0.001,
    max: 0.05,
    step: 0.001,
    unit: "ml/kg/min",
  },
  {
    key: "elevation",
    label: "Bonus dénivelé",
    description: "METs supplémentaires par 100m de dénivelé positif",
    value: 0.5,
    defaultValue: 0.5,
    min: 0.1,
    max: 2.0,
    step: 0.1,
    unit: "MET/100m",
  },
];

const STORAGE_KEY = "calc-multipliers";

export function loadMultipliers(): Multiplier[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_MULTIPLIERS;
    const parsed: Record<string, number> = JSON.parse(stored);
    return DEFAULT_MULTIPLIERS.map((m) => ({
      ...m,
      value: parsed[m.key] ?? m.value,
    }));
  } catch {
    return DEFAULT_MULTIPLIERS;
  }
}

export function saveMultipliers(multipliers: Multiplier[]): void {
  const obj: Record<string, number> = {};
  for (const m of multipliers) obj[m.key] = m.value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export function resetMultipliers(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export interface CalcInput {
  sport: Sport;
  durationMinutes: number;
  heartRateBpm: number;
  vo2Max: number;
  elevationGainMeters?: number;
  weightKg: number;
}

export interface CalcBreakdown {
  base: number;
  heartRateFactor: number;
  vo2Factor: number;
  elevationBonus: number;
  durationHours: number;
}

export interface CalcResult {
  calories: number;
  breakdown: CalcBreakdown;
}

export function computeCalories(input: CalcInput, multipliers: Multiplier[]): CalcResult {
  const mByKey = Object.fromEntries(multipliers.map((m) => [m.key, m.value]));

  const durationHours = input.durationMinutes / 60;
  const baseMet = input.sport.baseMet;

  const maxHr = 220 - 35;
  const hrPercent = input.heartRateBpm / maxHr;
  const hrMultiplier = mByKey["heart_rate"] ?? 1.2;
  const heartRateFactor = 1 + (hrPercent - 0.5) * hrMultiplier;

  const vo2Multiplier = mByKey["vo2_max"] ?? 0.01;
  const vo2Factor = Math.max(0.5, 1 + (input.vo2Max - 40) * vo2Multiplier);

  const elevationMultiplier = mByKey["elevation"] ?? 0.5;
  const elevationBonus =
    input.sport.appliesElevation && input.elevationGainMeters
      ? (input.elevationGainMeters / 100) * elevationMultiplier
      : 0;

  const durationMult = mByKey["duration"] ?? 1.0;

  const base = baseMet * input.weightKg * durationHours;
  const calories =
    base * heartRateFactor * vo2Factor * durationMult +
    elevationBonus * input.weightKg * durationHours;

  return {
    calories: Math.round(calories),
    breakdown: {
      base: Math.round(base),
      heartRateFactor: Math.round(heartRateFactor * 100) / 100,
      vo2Factor: Math.round(vo2Factor * 100) / 100,
      elevationBonus: Math.round(elevationBonus * 100) / 100,
      durationHours: Math.round(durationHours * 100) / 100,
    },
  };
}
