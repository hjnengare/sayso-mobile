import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { BusinessCard } from '../../components/BusinessCard';
import { SkeletonBlock } from '../../components/SkeletonBlock';
import { Text } from '../../components/Typography';
import { TransitionItem } from '../../components/motion/TransitionItem';
import { ConfirmationDialog } from '../../components/profile/ConfirmationDialog';
import { EditProfileModal, type EditProfileSavePayload } from '../../components/profile/EditProfileModal';
import { ProfileReviewItem } from '../../components/profile/ProfileReviewItem';
import { useDeleteAccount } from '../../hooks/useDeleteAccount';
import { useDeleteUserReview, useUserReviews } from '../../hooks/useUserReviews';
import { useGlobalScrollToTop } from '../../hooks/useGlobalScrollToTop';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useSavedBusinesses } from '../../hooks/useSavedBusinesses';
import { useAuthSession } from '../../hooks/useSession';
import { useUserBadges } from '../../hooks/useUserBadges';
import { useUserStats } from '../../hooks/useUserStats';
import { supabase } from '../../lib/supabase';
import { routes } from '../../navigation/routes';
import { useSecurity } from '../../providers/SecurityProvider';
import { APP_PAGE_GUTTER } from '../../styles/layout';

const OFF_WHITE = '#E5E0E5';
const CHARCOAL = '#2D2D2D';
const CARD_BG = '#9DAB9B';
const CORAL = '#722F37';

const CONTRIBUTIONS_INITIAL_COUNT = 2;
const AVATAR_MAX_SIZE = 5 * 1024 * 1024;

type LocationCardStatus = 'loading' | 'granted' | 'denied' | 'prompt';

type StatItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  description: string;
};

function StatItem({ icon, label, value, description }: StatItemProps) {
  return (
    <LinearGradient
      colors={[CARD_BG, CARD_BG, 'rgba(157,171,155,0.95)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statCard}
    >
      <View style={styles.statTitleRow}>
        <View style={styles.statIconWrap}>
          <Ionicons name={icon} size={14} color="rgba(45,45,45,0.85)" />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statDescription}>{description}</Text>
    </LinearGradient>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <LinearGradient
        colors={[CARD_BG, CARD_BG, 'rgba(157,171,155,0.95)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroContent}>
          <SkeletonBlock style={{ width: 96, height: 96, borderRadius: 48 }} />
          <SkeletonBlock style={{ width: 190, height: 24, borderRadius: 12, marginTop: 16 }} />
          <SkeletonBlock style={{ width: 160, height: 13, borderRadius: 7, marginTop: 8 }} />
          <SkeletonBlock style={{ width: 220, height: 12, borderRadius: 7, marginTop: 10 }} />
          <SkeletonBlock style={{ width: 120, height: 40, borderRadius: 20, marginTop: 16 }} />
        </View>
      </LinearGradient>

      <View style={styles.statsGrid}>
        {[0, 1, 2, 3].map((index) => (
          <LinearGradient
            key={`profile-stat-skeleton-${index}`}
            colors={[CARD_BG, CARD_BG, 'rgba(157,171,155,0.95)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statTitleRow}>
              <SkeletonBlock style={{ width: 32, height: 32, borderRadius: 16 }} />
              <SkeletonBlock style={{ width: 74, height: 12, borderRadius: 6 }} />
            </View>
            <SkeletonBlock style={{ width: 46, height: 24, borderRadius: 10, marginTop: 8 }} />
            <SkeletonBlock style={{ width: 94, height: 12, borderRadius: 6, marginTop: 8 }} />
          </LinearGradient>
        ))}
      </View>

      {[0, 1, 2].map((index) => (
        <LinearGradient
          key={`profile-section-skeleton-${index}`}
          colors={[CARD_BG, CARD_BG, 'rgba(157,171,155,0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sectionCard}
        >
          <SkeletonBlock style={{ width: 140, height: 18, borderRadius: 9, marginBottom: 14 }} />
          <SkeletonBlock style={{ width: '100%', height: 14, borderRadius: 7 }} />
          <SkeletonBlock style={{ width: '88%', height: 14, borderRadius: 7, marginTop: 10 }} />
        </LinearGradient>
      ))}
    </>
  );
}

function formatMemberSince(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const year = String(date.getFullYear()).slice(-2);
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} '${year}`;
}

function normalizeProfileLocation(value?: string | null) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return 'Location not set';
  if (/^[a-z]{2}(?:-[A-Z]{2})?$/.test(trimmed)) return 'Location not set';
  return trimmed;
}

function extractStoragePath(avatarUrl?: string | null) {
  if (!avatarUrl) return null;
  const token = '/storage/v1/object/public/avatars/';
  const tokenIndex = avatarUrl.indexOf(token);
  if (tokenIndex < 0) return null;

  const start = tokenIndex + token.length;
  const withoutQuery = avatarUrl.slice(start).split('?')[0];
  if (!withoutQuery) return null;
  return decodeURIComponent(withoutQuery);
}

function getAvatarExtension(fileName?: string | null, mimeType?: string | null) {
  if (fileName && fileName.includes('.')) {
    return fileName.split('.').pop()?.toLowerCase() || 'jpg';
  }
  if (mimeType && mimeType.includes('/')) {
    const subtype = mimeType.split('/')[1]?.toLowerCase() || '';
    if (subtype === 'jpeg') return 'jpg';
    return subtype || 'jpg';
  }
  return 'jpg';
}

function normalizeLocalSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function badgeImageSource(iconPath?: string | null) {
  if (!iconPath) return null;
  if (iconPath.startsWith('http://') || iconPath.startsWith('https://')) {
    return { uri: iconPath };
  }
  return null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthSession();
  const { guardSensitiveAction } = useSecurity();

  const profileQuery = useProfile();
  const statsQuery = useUserStats();
  const reviewsQuery = useUserReviews();
  const badgesQuery = useUserBadges();
  const savedQuery = useSavedBusinesses();

  const updateProfile = useUpdateProfile();
  const deleteReview = useDeleteUserReview();
  const deleteAccount = useDeleteAccount();

  const profile = profileQuery.data?.data;
  const userStats = statsQuery.data?.data;
  const userReviews = reviewsQuery.data?.data?.data ?? [];
  const earnedBadges = badgesQuery.data ?? [];
  const savedBusinesses = savedQuery.data?.businesses ?? [];

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [showAllContributions, setShowAllContributions] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [deleteReviewError, setDeleteReviewError] = useState<string | null>(null);

  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  const [locationStatus, setLocationStatus] = useState<LocationCardStatus>('loading');

  const scrollRef = useRef<ScrollView | null>(null);
  const scrollTopVisibleRef = useRef(false);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);

  const setScrollTopVisible = useCallback((visible: boolean) => {
    if (scrollTopVisibleRef.current === visible) return;
    scrollTopVisibleRef.current = visible;
    setShowScrollTopButton(visible);
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrollTopVisible(event.nativeEvent.contentOffset.y > 220);
    },
    [setScrollTopVisible]
  );

  const handleScrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  useGlobalScrollToTop({
    visible: showScrollTopButton,
    enabled: Boolean(user),
    onScrollToTop: handleScrollToTop,
  });

  useEffect(() => {
    if (!user) {
      setScrollTopVisible(false);
    }
  }, [setScrollTopVisible, user]);

  const syncLocationPermission = useCallback(async () => {
    setLocationStatus('loading');
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.granted) {
        setLocationStatus('granted');
        return;
      }
      setLocationStatus(permission.canAskAgain ? 'prompt' : 'denied');
    } catch {
      setLocationStatus('prompt');
    }
  }, []);

  useEffect(() => {
    syncLocationPermission();
  }, [syncLocationPermission]);

  const requestLocationPermission = useCallback(async () => {
    setLocationStatus('loading');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.granted) {
        setLocationStatus('granted');
        return;
      }
      setLocationStatus(permission.canAskAgain ? 'prompt' : 'denied');
    } catch {
      setLocationStatus('denied');
    }
  }, []);

  const displayLabel =
    profile?.display_name?.trim() ||
    profile?.username ||
    user?.email?.split('@')[0] ||
    'Your Profile';

  const profileLocation = normalizeProfileLocation(profile?.location);
  const memberSinceLabel = formatMemberSince(userStats?.accountCreationDate ?? profile?.created_at ?? user?.created_at ?? null);

  const reviewsCount = userReviews.length > 0
    ? userReviews.length
    : profile?.reviews_count ?? profile?.review_count ?? userStats?.totalReviewsWritten ?? 0;
  const badgesCount = earnedBadges.length;
  const interestsCount = profile?.interests_count ?? 0;
  const helpfulVotesCount = userStats?.helpfulVotesReceived ?? 0;
  const savedBusinessesCount = savedBusinesses.length > 0
    ? savedBusinesses.length
    : userStats?.totalBusinessesSaved ?? 0;

  const displayedReviews = showAllContributions
    ? userReviews
    : userReviews.slice(0, CONTRIBUTIONS_INITIAL_COUNT);

  const isRefreshing =
    profileQuery.isRefetching ||
    statsQuery.isRefetching ||
    reviewsQuery.isRefetching ||
    badgesQuery.isRefetching ||
    savedQuery.isRefetching;

  const handleRefresh = useCallback(() => {
    profileQuery.refetch();
    statsQuery.refetch();
    reviewsQuery.refetch();
    badgesQuery.refetch();
    savedQuery.refetch();
    syncLocationPermission();
  }, [badgesQuery, profileQuery, reviewsQuery, savedQuery, statsQuery, syncLocationPermission]);

  const removeExistingAvatar = useCallback(async (avatarUrl?: string | null) => {
    const existingPath = extractStoragePath(avatarUrl);
    if (!existingPath) return;
    await supabase.storage.from('avatars').remove([existingPath]);
  }, []);

  const handleSaveProfile = useCallback(
    async (payload: EditProfileSavePayload) => {
      if (!user) return;

      setProfileSaveError(null);
      setProfileSaving(true);

      try {
        const currentAvatarUrl = profile?.avatar_url ?? null;
        const currentAvatarPath = extractStoragePath(currentAvatarUrl);

        let nextAvatarUrl: string | null = currentAvatarUrl;
        let shouldRemoveCurrentAvatar = payload.removeAvatar;

        if (payload.removeAvatar) {
          nextAvatarUrl = null;
        }

        if (payload.avatarAsset) {
          const mimeType = payload.avatarAsset.mimeType || 'image/jpeg';
          if (!mimeType.startsWith('image/')) {
            throw new Error('Please select an image file for your avatar.');
          }

          if ((payload.avatarAsset.fileSize ?? 0) > AVATAR_MAX_SIZE) {
            throw new Error('Image file is too large. Maximum size is 5MB.');
          }

          const extension = getAvatarExtension(payload.avatarAsset.fileName, mimeType);
          const path = `${user.id}/avatar-${Date.now()}.${extension}`;

          const response = await fetch(payload.avatarAsset.uri);
          const blob = await response.blob();
          if (blob.size > AVATAR_MAX_SIZE) {
            throw new Error('Image file is too large. Maximum size is 5MB.');
          }

          const { error: uploadError } = await supabase.storage.from('avatars').upload(path, blob, {
            cacheControl: '3600',
            upsert: true,
            contentType: mimeType,
          });

          if (uploadError) {
            throw new Error(uploadError.message || 'Failed to upload avatar image.');
          }

          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
          if (!publicUrlData?.publicUrl) {
            throw new Error('Failed to retrieve uploaded avatar URL.');
          }

          nextAvatarUrl = publicUrlData.publicUrl;
          shouldRemoveCurrentAvatar = Boolean(currentAvatarPath && currentAvatarPath !== path);
        }

        await updateProfile.mutateAsync({
          username: payload.username.trim(),
          display_name: payload.displayName.trim() || null,
          avatar_url: nextAvatarUrl,
        });

        if (shouldRemoveCurrentAvatar && currentAvatarUrl) {
          removeExistingAvatar(currentAvatarUrl).catch(() => {});
        }

        setIsEditOpen(false);
      } catch (error) {
        setProfileSaveError(error instanceof Error ? error.message : 'Failed to update profile.');
      } finally {
        setProfileSaving(false);
      }
    },
    [profile?.avatar_url, removeExistingAvatar, updateProfile, user]
  );

  const handleEditReview = useCallback(
    (reviewId: string, businessId?: string | null) => {
      if (!businessId) {
        Alert.alert('Unable to edit', 'Business details for this review are unavailable.');
        return;
      }
      router.push(routes.writeReview('business', businessId, reviewId) as never);
    },
    [router]
  );

  const handleDeleteReviewConfirm = useCallback(async () => {
    if (!reviewToDelete) return;

    setDeleteReviewError(null);

    try {
      await deleteReview.mutateAsync(reviewToDelete);
      setReviewToDelete(null);
    } catch {
      setDeleteReviewError('Failed to delete this review. Please try again.');
    }
  }, [deleteReview, reviewToDelete]);

  const handleSignOut = useCallback(async () => {
    const gate = guardSensitiveAction('account_action');
    if (!gate.allowed) {
      Alert.alert('Action blocked', gate.reason || 'This action is blocked on this device.');
      return;
    }

    try {
      await signOut();
    } catch {
      Alert.alert('Error', 'Failed to sign out.');
    }
  }, [guardSensitiveAction, signOut]);

  const handleDeleteAccountConfirm = useCallback(async () => {
    const gate = guardSensitiveAction('account_action');
    if (!gate.allowed) {
      setDeleteAccountError(gate.reason || 'This action is blocked on this device.');
      return;
    }

    setDeleteAccountError(null);

    try {
      await deleteAccount.mutateAsync();
      await signOut();
      router.replace(routes.onboarding() as never);
    } catch {
      setDeleteAccountError('Failed to delete account. Please try again.');
    }
  }, [deleteAccount, guardSensitiveAction, router, signOut]);

  const heroMeta = useMemo(() => {
    const data = [
      profileLocation !== 'Location not set'
        ? { icon: 'location-outline' as const, label: profileLocation }
        : null,
      { icon: 'calendar-outline' as const, label: `Member since ${memberSinceLabel}` },
    ].filter(Boolean) as Array<{ icon: keyof typeof Ionicons.glyphMap; label: string }>;

    return data;
  }, [memberSinceLabel, profileLocation]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <Ionicons name="person-circle-outline" size={44} color="rgba(45,45,45,0.55)" />
          <Text style={styles.centeredTitle}>Sign in to view your profile</Text>
          <Pressable style={styles.primaryActionButton} onPress={() => router.push(routes.onboarding() as never)}>
            <Text style={styles.primaryActionText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const reviewSectionLoading = reviewsQuery.isLoading;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {(profileQuery.isLoading && !profile) ? (
          <TransitionItem variant="card" index={0}>
            <ProfileSkeleton />
          </TransitionItem>
        ) : (
          <>
            <TransitionItem variant="card" index={0}>
              <LinearGradient
                colors={[CARD_BG, CARD_BG, 'rgba(157,171,155,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroContent}>
                  {profile?.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Ionicons name="person" size={38} color="rgba(45,45,45,0.50)" />
                    </View>
                  )}

                  <View style={styles.heroNameRow}>
                    <Text style={styles.heroName}>{displayLabel}</Text>
                    {profile?.is_top_reviewer ? (
                      <View style={styles.topReviewerPill}>
                        <Ionicons name="ribbon-outline" size={12} color="#7D9B76" />
                        <Text style={styles.topReviewerText}>Top Reviewer</Text>
                      </View>
                    ) : null}
                  </View>

                  {profile?.bio ? <Text style={styles.heroBio}>{profile.bio}</Text> : null}

                  <View style={styles.heroMetaWrap}>
                    {heroMeta.map((item) => (
                      <View key={`${item.icon}-${item.label}`} style={styles.heroMetaChip}>
                        <View style={styles.heroMetaIconCircle}>
                          <Ionicons name={item.icon} size={12} color="rgba(45,45,45,0.84)" />
                        </View>
                        <Text style={styles.heroMetaText}>{item.label}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.heroReviewCount}>{reviewsCount} reviews</Text>

                  <Pressable style={styles.editProfileButton} onPress={() => setIsEditOpen(true)}>
                    <Ionicons name="create-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.editProfileButtonText}>Edit Profile</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </TransitionItem>

            <TransitionItem variant="card" index={1}>
              <View style={styles.statsGrid}>
                <StatItem
                  icon="thumbs-up-outline"
                  label="Helpful votes"
                  value={helpfulVotesCount}
                  description="Received"
                />
                <StatItem
                  icon="star-outline"
                  label="Reviews"
                  value={reviewsCount}
                  description="Total written"
                />
                <StatItem
                  icon="ribbon-outline"
                  label="Badges"
                  value={badgesCount}
                  description="Achievements unlocked"
                />
                <StatItem
                  icon="eye-outline"
                  label="Interests"
                  value={interestsCount}
                  description="Communities followed"
                />

                <LinearGradient
                  colors={[CARD_BG, CARD_BG, 'rgba(157,171,155,0.95)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.savedStatCard}
                >
                  <View style={styles.statTitleRow}>
                    <View style={styles.statIconWrap}>
                      <Ionicons name="bookmark-outline" size={14} color="rgba(45,45,45,0.85)" />
                    </View>
                    <Text style={styles.statLabel}>Saved</Text>
                  </View>
                  <Text style={styles.statValue}>{savedBusinessesCount}</Text>
                  <Text style={styles.statDescription}>
                    {savedBusinessesCount > 0 ? `${savedBusinessesCount} businesses` : 'Your saved gems'}
                  </Text>

                  <Pressable style={styles.inlineLink} onPress={() => router.push(routes.saved() as never)}>
                    <Text style={styles.inlineLinkText}>View saved</Text>
                    <Ionicons name="chevron-forward" size={14} color={CORAL} />
                  </Pressable>
                </LinearGradient>
              </View>
            </TransitionItem>

            {savedBusinesses.length > 0 ? (
              <TransitionItem variant="card" index={2}>
                <LinearGradient
                  colors={[CARD_BG, CARD_BG, 'rgba(157,171,155,0.95)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sectionCard}
                >
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionHeaderLeft}>
                      <View style={styles.sectionIconCircle}>
                        <Ionicons name="bookmark" size={14} color="rgba(45,45,45,0.84)" />
                      </View>
                      <Text style={styles.sectionTitle}>Saved Businesses</Text>
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{savedBusinesses.length}</Text>
                      </View>
                    </View>
                    <Pressable style={styles.inlineLink} onPress={() => router.push(routes.saved() as never)}>
                      <Text style={styles.inlineLinkText}>View all</Text>
                      <Ionicons name="chevron-forward" size={14} color={CORAL} />
                    </Pressable>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.savedPreviewRow}
                  >
                    {savedBusinesses.map((business: any) => (
                      <View key={business.id} style={styles.savedBusinessCardWrap}>
                        <BusinessCard business={business} />
                        <View style={styles.savedIndicator}>
                          <Ionicons name="bookmark" size={12} color="#FFFFFF" />
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </LinearGradient>
              </TransitionItem>
            ) : null}

            <TransitionItem variant="card" index={3}>
              <LinearGradient
                colors={[CARD_BG, CARD_BG, 'rgba(157,171,155,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sectionCard}
              >
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderLeft}>
                    <View style={styles.sectionIconCircle}>
                      <Ionicons name="ribbon-outline" size={14} color="rgba(45,45,45,0.84)" />
                    </View>
                    <Text style={styles.sectionTitle}>Badges</Text>
                  </View>
                  {earnedBadges.length > 0 ? (
                    <Pressable style={styles.inlineLink} onPress={() => router.push(routes.achievements() as never)}>
                      <Text style={styles.inlineLinkText}>View all</Text>
                      <Ionicons name="chevron-forward" size={14} color={CORAL} />
                    </Pressable>
                  ) : null}
                </View>

                {badgesQuery.isLoading ? (
                  <View style={styles.badgesGrid}>
                    {[0, 1, 2, 3].map((index) => (
                      <View key={`badge-skeleton-${index}`} style={styles.badgeTile}>
                        <SkeletonBlock style={{ width: 28, height: 28, borderRadius: 14 }} />
                        <SkeletonBlock style={{ width: '86%', height: 11, borderRadius: 6, marginTop: 6 }} />
                        <SkeletonBlock style={{ width: '70%', height: 10, borderRadius: 5, marginTop: 4 }} />
                      </View>
                    ))}
                  </View>
                ) : earnedBadges.length === 0 ? (
                  <View style={styles.emptyStateWrap}>
                    <Text style={styles.emptyStateText}>
                      No badges earned yet. Start reviewing businesses to unlock badges.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.badgesGrid}>
                    {earnedBadges.map((badge, index) => {
                      const source = badgeImageSource(badge.icon_path);
                      return (
                        <View key={`${badge.id}-${index}`} style={styles.badgeTile}>
                          {source ? (
                            <Image source={source} style={styles.badgeIcon} contentFit="contain" />
                          ) : (
                            <View style={styles.badgeFallbackIcon}>
                              <Ionicons name="ribbon-outline" size={16} color="rgba(45,45,45,0.84)" />
                            </View>
                          )}
                          <Text numberOfLines={1} style={styles.badgeName}>{badge.name}</Text>
                          <Text numberOfLines={2} style={styles.badgeDescription}>
                            {badge.description || 'Earned badge'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </LinearGradient>
            </TransitionItem>

            <TransitionItem variant="card" index={4}>
              <LinearGradient
                colors={[CARD_BG, CARD_BG, 'rgba(157,171,155,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sectionCard}
              >
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderLeft}>
                    <View style={styles.sectionIconCircle}>
                      <Ionicons name="document-text-outline" size={14} color="rgba(45,45,45,0.84)" />
                    </View>
                    <Text style={styles.sectionTitle}>Your Contributions</Text>
                  </View>

                  {userReviews.length > CONTRIBUTIONS_INITIAL_COUNT ? (
                    <Pressable style={styles.inlineLink} onPress={() => setShowAllContributions((prev) => !prev)}>
                      <Text style={styles.inlineLinkText}>{showAllContributions ? 'Hide' : 'See all'}</Text>
                      <Ionicons
                        name={showAllContributions ? 'chevron-up' : 'chevron-forward'}
                        size={14}
                        color={CORAL}
                      />
                    </Pressable>
                  ) : null}
                </View>

                {reviewSectionLoading ? (
                  <View style={styles.reviewsSkeletonList}>
                    {[0, 1].map((index) => (
                      <View key={`review-skeleton-${index}`} style={styles.reviewSkeletonRow}>
                        <SkeletonBlock style={{ width: 48, height: 48, borderRadius: 12 }} />
                        <View style={{ flex: 1, gap: 7 }}>
                          <SkeletonBlock style={{ width: '58%', height: 13, borderRadius: 7 }} />
                          <SkeletonBlock style={{ width: '72%', height: 11, borderRadius: 6 }} />
                          <SkeletonBlock style={{ width: '40%', height: 11, borderRadius: 6 }} />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : displayedReviews.length === 0 ? (
                  <View style={styles.emptyStateWrap}>
                    <Text style={styles.emptyStateText}>You haven&apos;t written any reviews yet.</Text>
                  </View>
                ) : (
                  <View>
                    {displayedReviews.map((review) => {
                      const businessSlugOrId =
                        review.business?.slug ||
                        review.business?.id ||
                        normalizeLocalSearchParam(review.business_id) ||
                        '';

                      return (
                        <ProfileReviewItem
                          key={review.id}
                          businessName={review.business?.name || 'Unknown Business'}
                          businessImageUrl={review.business?.image_url || null}
                          businessCategorySlug={review.business?.primary_subcategory_slug || review.business?.category || null}
                          rating={review.rating}
                          reviewText={review.body || review.content || null}
                          reviewTitle={review.title || null}
                          tags={review.tags || null}
                          createdAt={review.created_at}
                          onViewClick={() => {
                            if (!businessSlugOrId) return;
                            router.push(routes.businessDetail(businessSlugOrId) as never);
                          }}
                          onEdit={() => handleEditReview(review.id, review.business?.id || review.business_id)}
                          onDelete={() => {
                            setDeleteReviewError(null);
                            setReviewToDelete(review.id);
                          }}
                        />
                      );
                    })}
                  </View>
                )}
              </LinearGradient>
            </TransitionItem>

            <TransitionItem variant="card" index={5}>
              <LinearGradient
                colors={[CARD_BG, CARD_BG, 'rgba(157,171,155,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sectionCard}
              >
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderLeft}>
                    <View style={styles.sectionIconCircle}>
                      <Ionicons name="navigate-outline" size={14} color="rgba(45,45,45,0.84)" />
                    </View>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                  </View>
                </View>

                <View style={styles.preferenceRow}>
                  <View style={styles.preferenceTextWrap}>
                    <Text style={styles.preferenceTitle}>Location Distance</Text>
                    <Text style={styles.preferenceDescription}>
                      {locationStatus === 'granted'
                        ? 'Enabled - distances are shown on business cards.'
                        : locationStatus === 'denied'
                          ? 'Blocked - update in your device settings, then tap retry.'
                          : 'Allow location to see how far businesses are from you.'}
                    </Text>
                  </View>

                  {locationStatus === 'granted' ? (
                    <View style={styles.enabledPill}>
                      <Ionicons name="checkmark" size={13} color="#7D9B76" />
                      <Text style={styles.enabledPillText}>Enabled</Text>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.preferenceButton}
                      onPress={requestLocationPermission}
                      disabled={locationStatus === 'loading'}
                    >
                      <Ionicons name="navigate-outline" size={13} color="#FFFFFF" />
                      <Text style={styles.preferenceButtonText}>
                        {locationStatus === 'loading' ? 'Requesting...' : locationStatus === 'denied' ? 'Retry' : 'Allow'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </LinearGradient>
            </TransitionItem>

            <TransitionItem variant="card" index={6}>
              <LinearGradient
                colors={[CARD_BG, CARD_BG, 'rgba(157,171,155,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sectionCard}
              >
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderLeft}>
                    <View style={styles.sectionIconCircle}>
                      <Ionicons name="warning-outline" size={14} color="rgba(45,45,45,0.84)" />
                    </View>
                    <Text style={styles.sectionTitle}>Account Actions</Text>
                  </View>
                </View>

                <View style={styles.accountActionsWrap}>
                  <View style={styles.accountActionRow}>
                    <View style={styles.accountActionInfo}>
                      <Text style={styles.accountActionTitle}>Log Out</Text>
                      <Text style={styles.accountActionDescription}>Sign out of your account on this device.</Text>
                    </View>
                    <Pressable style={[styles.accountActionButton, styles.accountActionButtonPrimary]} onPress={handleSignOut}>
                      <Text style={styles.accountActionButtonPrimaryText}>Log Out</Text>
                    </Pressable>
                  </View>

                  <View style={[styles.accountActionRow, styles.accountActionRowBordered]}>
                    <View style={styles.accountActionInfo}>
                      <Text style={styles.accountActionTitle}>Delete Account</Text>
                      <Text style={styles.accountActionDescription}>
                        Permanently delete your account and associated data.
                      </Text>
                    </View>
                    <Pressable
                      style={[styles.accountActionButton, styles.accountActionButtonSecondary]}
                      onPress={() => {
                        setDeleteAccountError(null);
                        setIsDeleteAccountOpen(true);
                      }}
                    >
                      <Text style={styles.accountActionButtonSecondaryText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </LinearGradient>
            </TransitionItem>
          </>
        )}
      </ScrollView>

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => {
          if (profileSaving) return;
          setIsEditOpen(false);
          setProfileSaveError(null);
        }}
        onSave={handleSaveProfile}
        currentUsername={profile?.username || ''}
        currentDisplayName={profile?.display_name || null}
        currentAvatarUrl={profile?.avatar_url || null}
        saving={profileSaving || updateProfile.isPending}
        error={profileSaveError}
      />

      <ConfirmationDialog
        isOpen={Boolean(reviewToDelete)}
        onClose={() => {
          if (deleteReview.isPending) return;
          setReviewToDelete(null);
          setDeleteReviewError(null);
        }}
        onConfirm={handleDeleteReviewConfirm}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText={deleteReview.isPending ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteReview.isPending}
        error={deleteReviewError}
      />

      <ConfirmationDialog
        isOpen={isDeleteAccountOpen}
        onClose={() => {
          if (deleteAccount.isPending) return;
          setIsDeleteAccountOpen(false);
          setDeleteAccountError(null);
        }}
        onConfirm={handleDeleteAccountConfirm}
        title="Delete Account"
        message="Are you sure you want to permanently delete your account? This action cannot be undone."
        confirmText={deleteAccount.isPending ? 'Deleting...' : 'Delete Account'}
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteAccount.isPending}
        error={deleteAccountError}
        requireConfirmText="DELETE"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  content: {
    paddingBottom: 34,
    gap: 10,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  centeredTitle: {
    fontSize: 18,
    color: CHARCOAL,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryActionButton: {
    marginTop: 6,
    borderRadius: 999,
    backgroundColor: CORAL,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  heroCard: {
    marginHorizontal: APP_PAGE_GUTTER,
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(229,224,229,0.55)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.72)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNameRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroName: {
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '700',
    color: CHARCOAL,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  topReviewerPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(229,224,229,0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topReviewerText: {
    fontSize: 11,
    color: '#7D9B76',
    fontWeight: '700',
  },
  heroBio: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(45,45,45,0.86)',
    textAlign: 'center',
  },
  heroMetaWrap: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 8,
  },
  heroMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(229,224,229,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMetaText: {
    fontSize: 13,
    color: 'rgba(45,45,45,0.76)',
  },
  heroReviewCount: {
    marginTop: 12,
    fontSize: 13,
    color: 'rgba(45,45,45,0.72)',
    fontWeight: '600',
  },
  editProfileButton: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: CORAL,
    borderWidth: 1,
    borderColor: 'rgba(125,155,118,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  editProfileButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  statsGrid: {
    marginHorizontal: APP_PAGE_GUTTER,
    marginTop: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48.4%',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(229,224,229,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(45,45,45,0.72)',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    lineHeight: 28,
    color: CHARCOAL,
    fontWeight: '700',
  },
  statDescription: {
    marginTop: 4,
    fontSize: 11,
    color: 'rgba(45,45,45,0.62)',
  },
  savedStatCard: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  sectionCard: {
    marginHorizontal: APP_PAGE_GUTTER,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  sectionIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(229,224,229,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    color: CHARCOAL,
    fontWeight: '700',
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(229,224,229,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    color: '#7D9B76',
    fontWeight: '700',
  },
  inlineLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  inlineLinkText: {
    color: CORAL,
    fontSize: 12,
    fontWeight: '700',
  },

  savedPreviewRow: {
    gap: 12,
    paddingBottom: 4,
    paddingTop: 2,
  },
  savedBusinessCardWrap: {
    width: 314,
  },
  savedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7D9B76',
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeTile: {
    width: '48.4%',
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(229,224,229,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  badgeIcon: {
    width: 30,
    height: 30,
    marginBottom: 7,
  },
  badgeFallbackIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    marginBottom: 7,
  },
  badgeName: {
    fontSize: 11,
    color: CHARCOAL,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeDescription: {
    marginTop: 3,
    fontSize: 10,
    color: 'rgba(45,45,45,0.74)',
    textAlign: 'center',
    lineHeight: 13,
  },

  emptyStateWrap: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: 'rgba(45,45,45,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },

  reviewsSkeletonList: {
    gap: 10,
  },
  reviewSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },

  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.45)',
    paddingTop: 14,
  },
  preferenceTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: CHARCOAL,
  },
  preferenceDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(45,45,45,0.66)',
  },
  enabledPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(125,155,118,0.25)',
    backgroundColor: 'rgba(125,155,118,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enabledPillText: {
    fontSize: 11,
    color: '#7D9B76',
    fontWeight: '700',
  },
  preferenceButton: {
    borderRadius: 999,
    backgroundColor: CORAL,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  preferenceButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  accountActionsWrap: {
    gap: 12,
  },
  accountActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountActionRowBordered: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.45)',
    paddingTop: 12,
  },
  accountActionInfo: {
    flex: 1,
    minWidth: 0,
  },
  accountActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: CHARCOAL,
  },
  accountActionDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(45,45,45,0.66)',
  },
  accountActionButton: {
    minWidth: 94,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountActionButtonPrimary: {
    backgroundColor: CORAL,
  },
  accountActionButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  accountActionButtonSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(114,47,55,0.25)',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  accountActionButtonSecondaryText: {
    color: '#7F1D1D',
    fontSize: 12,
    fontWeight: '700',
  },
});
