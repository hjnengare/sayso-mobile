import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { BusinessListItemDto } from '@sayso/contracts';
import {
  getCategoryLabelFromBusiness,
  getCategorySlugFromBusiness,
  getPlaceholderImageForBusiness,
  isPlaceholderImage,
} from '../../lib/businessTaxonomy';

export type CategoryIconName = ComponentProps<typeof Ionicons>['name'];

function getValidImage(image: string | null | undefined) {
  if (typeof image !== 'string') return null;
  const trimmed = image.trim();
  if (!trimmed || isPlaceholderImage(trimmed)) return null;
  return trimmed;
}

export function getBusinessIdentifier(business: BusinessListItemDto) {
  return business.slug || business.id;
}

export function resolveDisplayImage(business: BusinessListItemDto) {
  const uploadedImage = Array.isArray(business.uploaded_images)
    ? getValidImage(business.uploaded_images[0] ?? null)
    : null;
  const imageUrl = getValidImage(business.image_url);
  const image = getValidImage(business.image);

  const placeholderImage = getPlaceholderImageForBusiness(business);

  if (uploadedImage) {
    return { image: uploadedImage, isPlaceholder: false, placeholderImage };
  }

  if (imageUrl) {
    return { image: imageUrl, isPlaceholder: false, placeholderImage };
  }

  if (image) {
    return { image, isPlaceholder: false, placeholderImage };
  }

  return { image: placeholderImage, isPlaceholder: true, placeholderImage };
}

export function normalizeCategorySlug(business: BusinessListItemDto) {
  return getCategorySlugFromBusiness(business);
}

export function getDisplayCategoryLabel(business: BusinessListItemDto) {
  return getCategoryLabelFromBusiness(business);
}

export function normalizeRating(business: BusinessListItemDto) {
  const rawRating =
    (typeof business.totalRating === 'number' && Number.isFinite(business.totalRating)
      ? business.totalRating
      : undefined) ??
    (typeof business.rating === 'number' && Number.isFinite(business.rating) ? business.rating : undefined) ??
    0;
  const featuredReviewCount =
    typeof (business as { reviewCount?: number }).reviewCount === 'number' &&
    Number.isFinite((business as { reviewCount?: number }).reviewCount)
      ? (business as { reviewCount?: number }).reviewCount
      : undefined;
  const totalReviews =
    (typeof business.reviews === 'number' && Number.isFinite(business.reviews) ? business.reviews : undefined) ??
    featuredReviewCount ??
    0;
  const hasRating = rawRating > 0;

  return {
    hasRating,
    displayRating: hasRating ? rawRating : undefined,
    totalReviews,
  };
}

export function getCategoryIconName(
  category: string,
  subInterestId?: string,
  subInterestLabel?: string
): CategoryIconName {
  const normalizedCategory = (category || '').toLowerCase();
  const normalizedSubInterest = (subInterestId || subInterestLabel || '').toLowerCase();
  const searchTerm = normalizedSubInterest || normalizedCategory;

  if (searchTerm.includes('salon') || searchTerm.includes('hairdresser') || searchTerm.includes('nail')) {
    return 'cut-outline';
  }
  if (searchTerm.includes('cafe') || searchTerm.includes('coffee')) {
    return 'cafe-outline';
  }
  if (searchTerm.includes('restaurant') || searchTerm.includes('dining') || searchTerm.includes('food')) {
    return 'restaurant-outline';
  }
  if (searchTerm.includes('bar') || searchTerm.includes('pub')) {
    return 'wine-outline';
  }
  if (searchTerm.includes('gym') || searchTerm.includes('fitness') || searchTerm.includes('workout')) {
    return 'barbell-outline';
  }
  if (searchTerm.includes('spa') || searchTerm.includes('wellness') || searchTerm.includes('massage')) {
    return 'leaf-outline';
  }
  if (searchTerm.includes('health') || searchTerm.includes('medical')) {
    return 'heart-outline';
  }
  if (
    searchTerm.includes('shop') ||
    searchTerm.includes('store') ||
    searchTerm.includes('retail') ||
    searchTerm.includes('fashion') ||
    searchTerm.includes('clothing')
  ) {
    return 'bag-outline';
  }
  if (searchTerm.includes('book') || searchTerm.includes('library')) {
    return 'book-outline';
  }
  if (searchTerm.includes('education') || searchTerm.includes('school') || searchTerm.includes('learn')) {
    return 'school-outline';
  }
  if (searchTerm.includes('finance') || searchTerm.includes('bank') || searchTerm.includes('insurance')) {
    return 'card-outline';
  }
  if (searchTerm.includes('business') || searchTerm.includes('office') || searchTerm.includes('professional')) {
    return 'briefcase-outline';
  }
  if (searchTerm.includes('music') || searchTerm.includes('concert') || searchTerm.includes('venue')) {
    return 'musical-notes-outline';
  }
  if (
    searchTerm.includes('movie') ||
    searchTerm.includes('cinema') ||
    searchTerm.includes('theater') ||
    searchTerm.includes('theatre')
  ) {
    return 'film-outline';
  }
  if (searchTerm.includes('art') || searchTerm.includes('gallery') || searchTerm.includes('museum')) {
    return 'color-palette-outline';
  }
  if (searchTerm.includes('travel') || searchTerm.includes('transport') || searchTerm.includes('hotel')) {
    return 'location-outline';
  }
  if (searchTerm.includes('car') || searchTerm.includes('auto') || searchTerm.includes('vehicle')) {
    return 'car-outline';
  }
  if (searchTerm.includes('home') || searchTerm.includes('decor') || searchTerm.includes('furniture')) {
    return 'home-outline';
  }

  return 'pricetag-outline';
}
