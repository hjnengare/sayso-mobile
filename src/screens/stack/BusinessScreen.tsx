import { useMemo } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { EmptyState } from '../../components/EmptyState';
import { Text } from '../../components/Typography';
import {
  BusinessActionCard,
  BusinessContactCard,
  BusinessContactInfoCard,
  BusinessDescriptionCard,
  BusinessDetailsCard,
  BusinessHeroCarousel,
  BusinessInfoBlock,
  BusinessLocationCard,
  BusinessOwnedEventsSection,
  BusinessPageHeader,
  BusinessPhotoGrid,
  BusinessReviewsSection,
  PersonalizationInsightsCard,
  SimilarBusinessesSection,
} from '../../components/business-detail';
import {
  normalizeBusinessImages,
  normalizeBusinessRating,
  normalizeCategoryText,
  normalizeDescriptionText,
  normalizeLocationText,
} from '../../components/business-detail/utils';
import { useBusinessDetail } from '../../hooks/useBusinessDetail';
import {
  useSaveBusiness,
  useSavedBusinesses,
  useUnsaveBusiness,
} from '../../hooks/useSavedBusinesses';
import { useAuthSession } from '../../hooks/useSession';
import { ENV } from '../../lib/env';
import { routes } from '../../navigation/routes';
import { businessDetailColors, businessDetailSpacing } from '../../components/business-detail/styles';

type Props = {
  initialTab?: 'overview' | 'reviews';
};

export default function BusinessScreen({ initialTab }: Props) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthSession();

  const { data: business, isLoading, isError } = useBusinessDetail(id);
  const { data: savedData } = useSavedBusinesses();
  const saveMutation = useSaveBusiness();
  const unsaveMutation = useUnsaveBusiness();

  const isSaved = useMemo(() => {
    if (!business) return false;
    const savedBusinesses = savedData?.businesses ?? [];
    return savedBusinesses.some((item: { id: string; slug?: string }) => item.id === business.id || item.slug === business.slug);
  }, [business, savedData?.businesses]);

  const images = useMemo(() => (business ? normalizeBusinessImages(business) : []), [business]);
  const ratingMeta = useMemo(() => (business ? normalizeBusinessRating(business) : { rating: 0, reviewCount: 0 }), [business]);
  const categoryText = useMemo(() => (business ? normalizeCategoryText(business) : 'Business'), [business]);
  const locationText = useMemo(() => (business ? normalizeLocationText(business) : 'Cape Town'), [business]);
  const descriptionText = useMemo(() => (business ? normalizeDescriptionText(business) : ''), [business]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(routes.home() as never);
  };

  const handleShare = async () => {
    if (!business) return;
    const urlId = business.slug || business.id;
    const url = `${ENV.apiBaseUrl}/business/${urlId}`;
    try {
      await Share.share({
        title: business.name,
        message: `${business.name}\n${url}`,
      });
    } catch {
      // Ignore share dismiss errors.
    }
  };

  const handleToggleSave = () => {
    if (!business) return;

    if (!user) {
      router.push(routes.login() as never);
      return;
    }

    if (isSaved) {
      unsaveMutation.mutate(business.id);
      return;
    }

    saveMutation.mutate(business.id);
  };

  const handleLeaveReview = () => {
    if (!business) return;
    if (!user) {
      router.push(routes.login() as never);
      return;
    }

    router.push(routes.businessReviewForm(business.id) as never);
  };

  const isBusinessOwner = Boolean(user && business?.owner_id && user.id === business.owner_id);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={businessDetailColors.charcoal} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !business) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState
          icon="alert-circle-outline"
          title="Business not found"
          message="This business may no longer be available."
          actionLabel="Go home"
          onAction={() => router.replace(routes.home() as never)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainColumn}>
          <BusinessPageHeader
            businessName={business.name}
            onPressBack={handleBack}
            onPressSave={handleToggleSave}
            onPressShare={handleShare}
            isSaved={isSaved}
          />

          <BusinessHeroCarousel
            businessName={business.name}
            images={images}
            rating={ratingMeta.rating}
            verified={business.verified}
          />

          <BusinessInfoBlock
            name={business.name}
            rating={ratingMeta.rating}
            category={categoryText}
            location={locationText}
          />

          <BusinessDescriptionCard description={descriptionText} />

          <BusinessDetailsCard
            priceRange={business.price_range ?? business.priceRange}
            verified={business.verified}
            hours={business.hours}
            openingHours={business.openingHours}
            opening_hours={business.opening_hours}
          />

          <BusinessPhotoGrid businessName={business.name} photos={images} />

          <BusinessLocationCard
            name={business.name}
            address={business.address}
            location={business.location}
            latitude={business.lat}
            longitude={business.lng}
          />

          <BusinessActionCard
            onPressLeaveReview={handleLeaveReview}
            onPressEditBusiness={() => router.push('/role-unsupported' as never)}
            isBusinessOwner={isBusinessOwner}
          />

          <PersonalizationInsightsCard
            business={business}
            onPressLogin={() => router.push(routes.login() as never)}
          />

          <BusinessContactInfoCard
            phone={business.phone}
            email={business.email}
            website={business.website}
            address={business.address}
            location={business.location}
          />

          <BusinessContactCard
            businessId={business.id}
            businessName={business.name}
            phone={business.phone}
          />
        </View>

        <BusinessOwnedEventsSection businessId={business.id} businessName={business.name} />

        <BusinessReviewsSection businessId={business.id} onPressWriteReview={handleLeaveReview} />

        <SimilarBusinessesSection businessId={business.id} />

        {initialTab === 'reviews' ? (
          <View style={styles.deeplinkHint}>
            <Text style={styles.deeplinkHintText}>
              This route now opens the write-review flow to match web behavior.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: businessDetailColors.page,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 6,
    paddingBottom: 26,
    gap: 16,
  },
  mainColumn: {
    marginHorizontal: businessDetailSpacing.pageGutter,
    gap: 14,
  },
  deeplinkHint: {
    marginHorizontal: businessDetailSpacing.pageGutter,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(229,224,229,0.66)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  deeplinkHintText: {
    color: businessDetailColors.textSubtle,
    fontSize: 12,
    lineHeight: 17,
  },
});
