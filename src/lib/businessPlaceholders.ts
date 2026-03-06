/**
 * Taxonomy-driven placeholder images for businesses.
 * Mirrors sayso_web/src/app/utils/subcategoryPlaceholders.ts but uses
 * local require() assets instead of URL paths.
 */

// ─── Asset map ───────────────────────────────────────────────────────────────

const PLACEHOLDER_ASSETS: Record<string, number> = {
  // Food & Drink
  restaurants: require('../../assets/businessImagePlaceholders/food-drink/restaurants.jpg'),
  cafes: require('../../assets/businessImagePlaceholders/food-drink/cafes-coffee.jpg'),
  bars: require('../../assets/businessImagePlaceholders/food-drink/bars-pubs.jpg'),
  'fast-food': require('../../assets/businessImagePlaceholders/food-drink/fast-food.jpg'),
  'fine-dining': require('../../assets/businessImagePlaceholders/food-drink/fine-dining.jpg'),

  // Beauty & Wellness
  gyms: require('../../assets/businessImagePlaceholders/beauty-wellness/gyms-fitness.jpg'),
  spas: require('../../assets/businessImagePlaceholders/beauty-wellness/spas.jpg'),
  salons: require('../../assets/businessImagePlaceholders/beauty-wellness/hair-salons.jpg'),
  wellness: require('../../assets/businessImagePlaceholders/beauty-wellness/wellness-centers.jpg'),
  'nail-salons': require('../../assets/businessImagePlaceholders/beauty-wellness/nail-salons.jpg'),

  // Professional Services
  'education-learning': require('../../assets/businessImagePlaceholders/professional-services/education-learning.jpg'),
  'finance-insurance': require('../../assets/businessImagePlaceholders/professional-services/finance-insurance.jpg'),
  plumbers: require('../../assets/businessImagePlaceholders/professional-services/plumbers.jpg'),
  electricians: require('../../assets/businessImagePlaceholders/professional-services/electricians.jpg'),
  'legal-services': require('../../assets/businessImagePlaceholders/professional-services/legal-services.jpg'),

  // Travel
  travel: require('../../assets/businessImagePlaceholders/travel/travel.jpg'),
  accommodation: require('../../assets/businessImagePlaceholders/travel/travel.jpg'),
  transport: require('../../assets/businessImagePlaceholders/travel/travel.jpg'),
  'transport-travel': require('../../assets/businessImagePlaceholders/travel/travel.jpg'),
  'travel-services': require('../../assets/businessImagePlaceholders/travel/travel.jpg'),

  // Outdoors & Adventure
  hiking: require('../../assets/businessImagePlaceholders/outdoors-adventure/hiking.jpg'),
  cycling: require('../../assets/businessImagePlaceholders/outdoors-adventure/cycling.jpg'),
  'water-sports': require('../../assets/businessImagePlaceholders/outdoors-adventure/water-sports.jpg'),
  camping: require('../../assets/businessImagePlaceholders/outdoors-adventure/camping.jpg'),

  // Entertainment & Experiences
  'events-festivals': require('../../assets/businessImagePlaceholders/entertainment-experiences/events-festivals.jpg'),
  'sports-recreation': require('../../assets/businessImagePlaceholders/entertainment-experiences/sports-recreation.jpg'),
  nightlife: require('../../assets/businessImagePlaceholders/entertainment-experiences/nightlife.jpg'),
  'comedy-clubs': require('../../assets/businessImagePlaceholders/entertainment-experiences/comedy-clubs.jpg'),
  cinemas: require('../../assets/businessImagePlaceholders/entertainment-experiences/cinemas.jpg'),

  // Arts & Culture
  museums: require('../../assets/businessImagePlaceholders/arts-culture/museums.jpg'),
  galleries: require('../../assets/businessImagePlaceholders/arts-culture/art-galleries.jpg'),
  theaters: require('../../assets/businessImagePlaceholders/arts-culture/theatres.jpg'),
  concerts: require('../../assets/businessImagePlaceholders/arts-culture/concerts.jpg'),

  // Family & Pets
  'family-activities': require('../../assets/businessImagePlaceholders/family-pets/family-activities.jpg'),
  'pet-services': require('../../assets/businessImagePlaceholders/family-pets/pet-services.jpg'),
  childcare: require('../../assets/businessImagePlaceholders/family-pets/childcare.jpg'),
  veterinarians: require('../../assets/businessImagePlaceholders/family-pets/veterinarians.jpg'),

  // Shopping & Lifestyle
  fashion: require('../../assets/businessImagePlaceholders/shopping-lifestyle/fashion-clothing.jpg'),
  electronics: require('../../assets/businessImagePlaceholders/shopping-lifestyle/electronics.jpg'),
  'home-decor': require('../../assets/businessImagePlaceholders/shopping-lifestyle/home-decor.jpg'),
  books: require('../../assets/businessImagePlaceholders/shopping-lifestyle/books-media.jpg'),

  // Miscellaneous
  miscellaneous: require('../../assets/businessImagePlaceholders/miscellaneous/miscellaneous.jpeg'),
};

const DEFAULT_PLACEHOLDER: number =
  require('../../assets/businessImagePlaceholders/miscellaneous/miscellaneous.jpeg');

// ─── Alias resolution ─────────────────────────────────────────────────────────

const ALIASES: Record<string, string> = {
  restaurant: 'restaurants',
  cafe: 'cafes',
  bar: 'bars',
  salon: 'salons',
  gym: 'gyms',
  spa: 'spas',
  museum: 'museums',
  gallery: 'galleries',
  theater: 'theaters',
  theatre: 'theaters',
  theatres: 'theaters',
  concert: 'concerts',
  cinema: 'cinemas',
  bookstore: 'books',
  // Interest ids → representative subcategory
  'food-drink': 'restaurants',
  'beauty-wellness': 'salons',
  'professional-services': 'finance-insurance',
  'outdoors-adventure': 'hiking',
  'experiences-entertainment': 'events-festivals',
  'arts-culture': 'museums',
  'family-pets': 'family-activities',
  'shopping-lifestyle': 'fashion',
  // Legacy travel slugs
  airport: 'travel',
  airports: 'travel',
  'train-station': 'travel',
  'car-rental': 'travel',
  'shuttle-service': 'travel',
  'chauffeur-service': 'travel',
  'travel-service': 'travel-services',
  'tour-guide': 'travel-services',
  'travel-agency': 'travel-services',
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the local require() asset for a subcategory/interest slug.
 * Falls back to the miscellaneous placeholder for unknown slugs.
 */
export function getBusinessPlaceholder(slug: string | null | undefined): number {
  if (!slug || typeof slug !== 'string') return DEFAULT_PLACEHOLDER;
  const key = slug.trim().toLowerCase();
  if (!key) return DEFAULT_PLACEHOLDER;

  if (PLACEHOLDER_ASSETS[key] !== undefined) return PLACEHOLDER_ASSETS[key];

  const aliased = ALIASES[key];
  if (aliased && PLACEHOLDER_ASSETS[aliased] !== undefined) return PLACEHOLDER_ASSETS[aliased];

  return DEFAULT_PLACEHOLDER;
}

/**
 * Returns the placeholder for the first candidate that resolves to a known slug.
 */
export function getBusinessPlaceholderFromCandidates(
  candidates: ReadonlyArray<string | null | undefined>
): number {
  for (const c of candidates) {
    const result = getBusinessPlaceholder(c);
    if (result !== DEFAULT_PLACEHOLDER) return result;
  }
  return DEFAULT_PLACEHOLDER;
}
