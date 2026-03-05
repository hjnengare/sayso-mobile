import type { BusinessPercentilesDto } from '@sayso/contracts';

export interface BusinessForScoring {
  id: string;
  primary_category_slug?: string | null;
  primary_subcategory_slug?: string | null;
  interest_id?: string | null;
  sub_interest_id?: string | null;
  category?: string;
  price_range?: string;
  description?: string | null;
  verified?: boolean;
  badge?: string | null;
  image_url?: string | null;
  uploaded_images?: string[] | null;
  average_rating?: number;
  total_reviews?: number;
  distance_km?: number | null;
  percentiles?: BusinessPercentilesDto | null;
}

export interface UserPreferences {
  interestIds: string[];
  subcategoryIds: string[];
  dealbreakerIds: string[];
}

export interface PersonalizationScore {
  totalScore: number;
  insights: string[];
}

const WEIGHT_SUBCATEGORY = 5;
const WEIGHT_CATEGORY = 2;
const WEIGHT_VERIFIED = 1;
const WEIGHT_BADGE = 1;
const WEIGHT_HAS_IMAGE = 0.5;
const WEIGHT_HAS_DESCRIPTION = 0.5;

const DEALBREAKER_RULES: Record<string, (business: BusinessForScoring) => boolean> = {
  trustworthiness: (business) => business.verified !== false,
  punctuality: (business) => {
    const score = business.percentiles?.punctuality;
    if (score == null) return true;
    return score >= 70;
  },
  friendliness: (business) => {
    const score = business.percentiles?.friendliness;
    if (score == null) return true;
    return score >= 65;
  },
  'value-for-money': (business) => {
    if (business.price_range) {
      return business.price_range === '$' || business.price_range === '$$';
    }
    const score = business.percentiles?.['cost-effectiveness'];
    if (score == null) return true;
    return score >= 75;
  },
  expensive: (business) =>
    business.price_range !== '$$$$' && business.price_range !== '$$$',
  'slow-service': (business) => {
    const score = business.percentiles?.punctuality;
    if (score == null) return true;
    return score >= 60;
  },
  'no-parking': () => true,
  'cash-only': () => true,
  'bad-hygiene': () => true,
};

function resolveCategoryId(b: BusinessForScoring) {
  return b.primary_category_slug ?? b.interest_id ?? null;
}

function resolveSubcategoryId(b: BusinessForScoring) {
  return b.primary_subcategory_slug ?? b.sub_interest_id ?? null;
}

function hasRealImage(b: BusinessForScoring) {
  if (b.image_url && b.image_url.trim() !== '') return true;
  const images = b.uploaded_images;
  return Array.isArray(images) && images.length > 0;
}

function hasDescription(b: BusinessForScoring) {
  const description = b.description;
  return typeof description === 'string' && description.trim().length > 0;
}

function calculateDealbreakerPenalty(business: BusinessForScoring, userDealbreakerIds: string[]) {
  if (userDealbreakerIds.length === 0) return 0;

  let penalty = 0;
  for (const id of userDealbreakerIds) {
    const rule = DEALBREAKER_RULES[id];
    if (!rule) continue;
    try {
      if (!rule(business)) penalty -= 50;
    } catch {
      // Ignore malformed rule data and keep UI resilient.
    }
  }

  return penalty;
}

function generateInsights(business: BusinessForScoring, userPreferences: UserPreferences) {
  const insights: string[] = [];
  const categoryId = resolveCategoryId(business);
  const subcategoryId = resolveSubcategoryId(business);
  const categoryLabel = business.category ?? business.primary_subcategory_slug ?? 'this category';

  if (categoryId && userPreferences.interestIds.includes(categoryId)) {
    insights.push(`Matches your interest in ${categoryLabel}`);
  }

  if (subcategoryId && userPreferences.subcategoryIds.includes(subcategoryId)) {
    insights.push(`Perfect match for your preferred ${categoryLabel}`);
  }

  if (business.price_range === '$' || business.price_range === '$$') {
    insights.push('Great value for money');
  }

  if (business.verified) {
    insights.push('Verified business');
  }

  const violations: string[] = [];
  for (const id of userPreferences.dealbreakerIds) {
    const rule = DEALBREAKER_RULES[id];
    if (!rule) continue;
    try {
      if (!rule(business)) violations.push(id);
    } catch {
      // Ignore malformed rule data and keep UI resilient.
    }
  }

  if (violations.length > 0) {
    insights.push(`May not match your preferences: ${violations.join(', ')}`);
  }

  return insights;
}

export function calculatePersonalizationScore(
  business: BusinessForScoring,
  userPreferences: UserPreferences
): PersonalizationScore {
  const categoryId = resolveCategoryId(business);
  const subcategoryId = resolveSubcategoryId(business);
  const subcategoryMatch =
    subcategoryId && userPreferences.subcategoryIds.includes(subcategoryId) ? WEIGHT_SUBCATEGORY : 0;
  const categoryMatch =
    categoryId && userPreferences.interestIds.includes(categoryId) ? WEIGHT_CATEGORY : 0;
  const verifiedScore = business.verified ? WEIGHT_VERIFIED : 0;
  const badgeScore =
    business.badge != null && String(business.badge).trim() !== '' ? WEIGHT_BADGE : 0;
  const hasImageScore = hasRealImage(business) ? WEIGHT_HAS_IMAGE : 0;
  const hasDescriptionScore = hasDescription(business) ? WEIGHT_HAS_DESCRIPTION : 0;
  const dealbreakerPenalty = calculateDealbreakerPenalty(business, userPreferences.dealbreakerIds);

  const totalScore =
    subcategoryMatch +
    categoryMatch +
    verifiedScore +
    badgeScore +
    hasImageScore +
    hasDescriptionScore +
    dealbreakerPenalty;

  return {
    totalScore,
    insights: generateInsights(business, userPreferences),
  };
}
