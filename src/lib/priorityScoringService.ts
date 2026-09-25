import { PriorityBreakdown, PriorityWeights } from '@/types';

export const PRIORITY_WEIGHTS: PriorityWeights = {
  demand: 0.30,
  population: 0.25,
  urgency: 0.25,
  infrastructureGap: 0.20,
};

export const PRIORITY_METHODOLOGY =
  'Explainable prototype score based on citizen demand, affected population, urgency, and citizen-reported infrastructure gaps.';

export interface HotspotScoringInput {
  totalRequests: number;
  affectedPopulation: number;
  highUrgencyRequests: number;
  infrastructureRequests: number;
}

export interface CalculatedPriorityResult {
  priorityScore: number;
  priorityBreakdown: PriorityBreakdown;
  priorityMethodology: string;
}

/**
 * Safely rounds a number to one decimal place and clamps between min and max.
 * Protects against NaN and Infinity.
 */
export function safeRound1dp(value: number, min = 0, max = 100): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return min;
  }
  const clamped = Math.min(max, Math.max(min, value));
  return Math.round(clamped * 10) / 10;
}

/**
 * 1. Citizen Demand Score (0 - 100)
 * Normalized relative to the maximum totalRequests across all hotspots.
 * Hotspot with highest totalRequests receives 100.
 * If single hotspot or maxRequests is 0, handles safely.
 */
export function calculateDemandScore(totalRequests: number, maxRequests: number): number {
  if (!totalRequests || totalRequests <= 0 || !maxRequests || maxRequests <= 0) {
    return 0;
  }
  const raw = (totalRequests / maxRequests) * 100;
  return safeRound1dp(raw);
}

/**
 * 2. Affected Population Score (0 - 100)
 * Normalized relative to the maximum affectedPopulation across all hotspots.
 * Hotspot with highest affectedPopulation receives 100.
 * Handles zero values and single hotspot safely.
 */
export function calculatePopulationScore(affectedPopulation: number, maxPopulation: number): number {
  if (!affectedPopulation || affectedPopulation <= 0 || !maxPopulation || maxPopulation <= 0) {
    return 0;
  }
  const raw = (affectedPopulation / maxPopulation) * 100;
  return safeRound1dp(raw);
}

/**
 * 3. Urgency Score (0 - 100)
 * Calculated as the ratio of highUrgencyRequests / totalRequests converted to 0-100.
 * Handles totalRequests = 0 safely.
 */
export function calculateUrgencyScore(highUrgencyRequests: number, totalRequests: number): number {
  if (!totalRequests || totalRequests <= 0 || !highUrgencyRequests || highUrgencyRequests <= 0) {
    return 0;
  }
  const raw = (Math.min(highUrgencyRequests, totalRequests) / totalRequests) * 100;
  return safeRound1dp(raw);
}

/**
 * 4. Infrastructure Gap Score (0 - 100)
 * Citizen-reported infrastructure-gap proxy based on the ratio of requests
 * mentioning affected infrastructure to total requests.
 * Handles totalRequests = 0 safely.
 */
export function calculateInfrastructureGapScore(infrastructureRequests: number, totalRequests: number): number {
  if (!totalRequests || totalRequests <= 0 || !infrastructureRequests || infrastructureRequests <= 0) {
    return 0;
  }
  const raw = (Math.min(infrastructureRequests, totalRequests) / totalRequests) * 100;
  return safeRound1dp(raw);
}

/**
 * 5. Final Priority Score (0 - 100)
 * Weighted sum:
 * - Citizen Demand: 30%
 * - Affected Population: 25%
 * - Urgency: 25%
 * - Infrastructure Gap: 20%
 * Clamped between 0 and 100 and rounded to one decimal place.
 */
export function calculateFinalPriorityScore(
  demandScore: number,
  populationScore: number,
  urgencyScore: number,
  infrastructureGapScore: number
): number {
  const weightedSum =
    demandScore * PRIORITY_WEIGHTS.demand +
    populationScore * PRIORITY_WEIGHTS.population +
    urgencyScore * PRIORITY_WEIGHTS.urgency +
    infrastructureGapScore * PRIORITY_WEIGHTS.infrastructureGap;

  return safeRound1dp(weightedSum);
}

/**
 * Computes priority score and breakdown for a single hotspot given maximum context values.
 */
export function computeHotspotPriority(
  input: HotspotScoringInput,
  maxRequests: number,
  maxPopulation: number
): CalculatedPriorityResult {
  const demandScore = calculateDemandScore(input.totalRequests, maxRequests);
  const populationScore = calculatePopulationScore(input.affectedPopulation, maxPopulation);
  const urgencyScore = calculateUrgencyScore(input.highUrgencyRequests, input.totalRequests);
  const infrastructureGapScore = calculateInfrastructureGapScore(input.infrastructureRequests, input.totalRequests);

  const priorityScore = calculateFinalPriorityScore(
    demandScore,
    populationScore,
    urgencyScore,
    infrastructureGapScore
  );

  return {
    priorityScore,
    priorityBreakdown: {
      demandScore,
      populationScore,
      urgencyScore,
      infrastructureGapScore,
      weights: { ...PRIORITY_WEIGHTS },
    },
    priorityMethodology: PRIORITY_METHODOLOGY,
  };
}

/**
 * Batch scores a list of hotspots by first finding maximum demand and population
 * benchmarks across the collection, then deterministically scoring and sorting them
 * in descending order by priorityScore (secondary sort: totalRequests DESC).
 */
export function scoreAndRankHotspots<T extends HotspotScoringInput>(hotspots: T[]): (T & CalculatedPriorityResult)[] {
  if (!hotspots || hotspots.length === 0) {
    return [];
  }

  const maxRequests = Math.max(...hotspots.map((h) => h.totalRequests || 0), 0);
  const maxPopulation = Math.max(...hotspots.map((h) => h.affectedPopulation || 0), 0);

  const scored = hotspots.map((hotspot) => {
    const priorityResult = computeHotspotPriority(hotspot, maxRequests, maxPopulation);
    return {
      ...hotspot,
      ...priorityResult,
    };
  });

  // Sort descending by priorityScore (secondary sort: totalRequests DESC)
  scored.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return (b.totalRequests || 0) - (a.totalRequests || 0);
  });

  return scored;
}
