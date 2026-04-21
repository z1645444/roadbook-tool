import type {
  LodgingCandidate,
  LodgingCategory,
  LodgingPolicyStage,
  LodgingSearchInput,
  MapProvider
} from '../map-provider/map-provider.port';

export interface LodgingPolicyAnchor {
  providerId: string;
  lng: number;
  lat: number;
}

export interface BuildLodgingRecommendationsInput {
  sessionId: string;
  dayIndex: number;
  anchor: LodgingPolicyAnchor;
}

export interface DayLodgingRecommendations {
  policyStatus: 'compliant' | 'relaxed' | 'no_match';
  fallbackTrace: string[];
  categories: Record<LodgingCategory, LodgingCandidate[]>;
}

interface CacheEntry {
  expiresAt: number;
  candidates: LodgingCandidate[];
}

interface StageDefinition {
  label: 'strict_8km' | 'radius_12km' | 'radius_20km' | 'price_relaxed_20';
  policyStage: LodgingPolicyStage;
  radiusMeters: number;
  relaxPrice: boolean;
}

const BASE_RADIUS_METERS = 8000;
const RADIUS_STEPS = [12000, 20000] as const;
const PRICE_RELAX_FACTOR = 1.2;
const RATING_FLOOR = 4.0;
const CACHE_TTL_MS = 600000;
const MAX_PER_CATEGORY = 3;

const CATEGORY_ORDER: LodgingCategory[] = ['hostel', 'guesthouse', 'hotel'];

const STRICT_MAX_PRICE: Record<LodgingCategory, number> = {
  hostel: 100,
  guesthouse: 200,
  hotel: 200
};

const STAGES: StageDefinition[] = [
  {
    label: 'strict_8km',
    policyStage: 'strict',
    radiusMeters: BASE_RADIUS_METERS,
    relaxPrice: false
  },
  {
    label: 'radius_12km',
    policyStage: 'radius_12km',
    radiusMeters: RADIUS_STEPS[0],
    relaxPrice: false
  },
  {
    label: 'radius_20km',
    policyStage: 'radius_20km',
    radiusMeters: RADIUS_STEPS[1],
    relaxPrice: false
  },
  {
    label: 'price_relaxed_20',
    policyStage: 'price_relaxed_20',
    radiusMeters: RADIUS_STEPS[1],
    relaxPrice: true
  }
];

const normalizePrice = (priceCny: number | null): number | null => {
  if (priceCny === null || !Number.isFinite(priceCny)) {
    return null;
  }
  return priceCny;
};

const normalizeRating = (rating: number | null): number | null => {
  if (rating === null || !Number.isFinite(rating)) {
    return null;
  }
  return rating;
};

const rankCandidates = (left: LodgingCandidate, right: LodgingCandidate): number => {
  if (left.distanceMeters !== right.distanceMeters) {
    return left.distanceMeters - right.distanceMeters;
  }

  const leftRating = left.rating ?? Number.NEGATIVE_INFINITY;
  const rightRating = right.rating ?? Number.NEGATIVE_INFINITY;
  if (leftRating !== rightRating) {
    return rightRating - leftRating;
  }

  const leftPrice = left.priceCny ?? Number.POSITIVE_INFINITY;
  const rightPrice = right.priceCny ?? Number.POSITIVE_INFINITY;
  if (leftPrice !== rightPrice) {
    return leftPrice - rightPrice;
  }

  return left.providerId.localeCompare(right.providerId);
};

const dedupeCandidates = (items: LodgingCandidate[]): LodgingCandidate[] => {
  const deduped = new Map<string, LodgingCandidate>();
  for (const item of items) {
    if (!deduped.has(item.providerId)) {
      deduped.set(item.providerId, item);
    }
  }
  return [...deduped.values()];
};

const filterByPolicy = (
  category: LodgingCategory,
  candidates: LodgingCandidate[],
  stage: StageDefinition
): LodgingCandidate[] => {
  const strictCap = STRICT_MAX_PRICE[category];
  const maxPrice = stage.relaxPrice ? strictCap * PRICE_RELAX_FACTOR : strictCap;

  return candidates
    .filter((candidate) => {
      const rating = normalizeRating(candidate.rating);
      const price = normalizePrice(candidate.priceCny);
      if (rating === null || price === null) {
        return false;
      }
      if (rating < RATING_FLOOR) {
        return false;
      }
      if (category === 'hostel' && price < 40) {
        return false;
      }
      return price <= maxPrice;
    })
    .sort(rankCandidates)
    .slice(0, MAX_PER_CATEGORY);
};

export class LodgingPolicyService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly provider: MapProvider) {}

  async buildLodgingRecommendations(
    input: BuildLodgingRecommendationsInput
  ): Promise<DayLodgingRecommendations> {
    const categories: Record<LodgingCategory, LodgingCandidate[]> = {
      hostel: [],
      guesthouse: [],
      hotel: []
    };
    const fallbackTrace: string[] = [];

    for (const category of CATEGORY_ORDER) {
      categories[category] = await this.searchCategory(input, category, fallbackTrace);
    }

    const hasAnyMissingCategory = CATEGORY_ORDER.some((category) => categories[category].length === 0);
    const usedRelaxedStage = Object.values(categories).some((list) =>
      list.some((candidate) => candidate.policyStage !== 'strict')
    );

    return {
      policyStatus: hasAnyMissingCategory ? 'no_match' : usedRelaxedStage ? 'relaxed' : 'compliant',
      fallbackTrace,
      categories
    };
  }

  private async searchCategory(
    input: BuildLodgingRecommendationsInput,
    category: LodgingCategory,
    fallbackTrace: string[]
  ): Promise<LodgingCandidate[]> {
    for (const stage of STAGES) {
      if (!fallbackTrace.includes(stage.label)) {
        fallbackTrace.push(stage.label);
      }

      const fetched = await this.fetchCandidates(input, category, stage);
      const filtered = filterByPolicy(category, fetched, stage);
      if (filtered.length > 0) {
        return filtered.map((candidate) => ({
          ...candidate,
          type: category,
          policyStage: stage.policyStage
        }));
      }
    }

    return [];
  }

  private async fetchCandidates(
    input: BuildLodgingRecommendationsInput,
    category: LodgingCategory,
    stage: StageDefinition
  ): Promise<LodgingCandidate[]> {
    if (!this.provider.searchLodgingAround) {
      return [];
    }

    const cacheKey = [
      'lodging',
      input.sessionId,
      input.dayIndex,
      input.anchor.providerId,
      category,
      stage.radiusMeters,
      stage.policyStage
    ].join(':');
    const now = Date.now();
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.candidates;
    }

    const payload: LodgingSearchInput = {
      anchor: input.anchor,
      radiusMeters: stage.radiusMeters,
      page: 1,
      sessionId: input.sessionId,
      dayIndex: input.dayIndex,
      category
    };
    const result = await this.provider.searchLodgingAround(payload);
    const candidates = dedupeCandidates(
      result.candidates.map((candidate) => ({
        ...candidate,
        type: category,
        rating: normalizeRating(candidate.rating),
        priceCny: normalizePrice(candidate.priceCny)
      }))
    );

    this.cache.set(cacheKey, {
      expiresAt: now + CACHE_TTL_MS,
      candidates
    });
    return candidates;
  }
}

