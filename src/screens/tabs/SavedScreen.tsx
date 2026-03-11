import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BusinessCard } from '../../components/BusinessCard';
import { SkeletonBlock } from '../../components/SkeletonBlock';
import { Text } from '../../components/Typography';
import { TransitionItem } from '../../components/motion/TransitionItem';
import { useGlobalScrollToTop } from '../../hooks/useGlobalScrollToTop';
import { useSavedBusinesses } from '../../hooks/useSavedBusinesses';
import { useAuthSession } from '../../hooks/useSession';
import { routes } from '../../navigation/routes';
import { APP_PAGE_GUTTER } from '../../styles/layout';

const ITEMS_PER_PAGE = 12;

const BREAKPOINT_SM = 640;
const BREAKPOINT_MD = 768;
const BREAKPOINT_XL = 1280;

const OFF_WHITE = '#E5E0E5';
const CARD_BG = '#9DAB9B';
const SAGE = '#7D9B76';
const CHARCOAL = '#2D2D2D';

interface FilterOption {
  value: string | null;
  label: string;
  count: number;
}

type SavedBusinessRecord = {
  id: string;
  name: string;
  category?: string | null;
};

function isNonEmptyString(value: string | null | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

function resolveGridColumns(width: number) {
  if (width >= BREAKPOINT_XL) return 4;
  if (width >= BREAKPOINT_MD) return 3;
  if (width >= BREAKPOINT_SM) return 2;
  return 1;
}

function getPageNumbers(currentPage: number, totalPages: number): Array<number | string> {
  const pages: Array<number | string> = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let page = 1; page <= totalPages; page += 1) {
      pages.push(page);
    }
    return pages;
  }

  pages.push(1);

  if (currentPage > 3) {
    pages.push('...');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 2) {
    pages.push('...');
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

function chunkIntoRows<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
}

function SavedFilterPillGroup({
  options,
  value,
  onChange,
  pillHorizontalPadding,
  pillFontSize,
}: {
  options: FilterOption[];
  value: string | null;
  onChange: (nextValue: string | null) => void;
  pillHorizontalPadding: number;
  pillFontSize: number;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pillRow}
      style={styles.pillScroll}
    >
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <Pressable
            key={`${option.label}-${String(option.value)}`}
            onPress={() => onChange(isActive ? null : option.value)}
            style={({ pressed }) => [
              styles.pill,
              { paddingHorizontal: pillHorizontalPadding },
              isActive ? styles.pillActive : null,
              pressed ? styles.pillPressed : null,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                { fontSize: pillFontSize },
                isActive ? styles.pillTextActive : null,
              ]}
            >
              {option.label}
            </Text>
            {option.count > 0 ? (
              <Text
                style={[
                  styles.pillCount,
                  { fontSize: pillFontSize },
                  isActive ? styles.pillTextActive : null,
                ]}
              >
                ({option.count})
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function SavedPagination({
  currentPage,
  totalPages,
  disabled,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
}) {
  const pageNumbers = useMemo(() => getPageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <View style={styles.paginationRow}>
      <Pressable
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || disabled}
        style={styles.paginationNavButton}
      >
        {currentPage === 1 || disabled ? (
          <View style={styles.paginationNavButtonDisabled}>
            <Ionicons name="chevron-back" size={20} color="rgba(45,45,45,0.3)" />
          </View>
        ) : (
          <LinearGradient
            colors={[SAGE, 'rgba(125,155,118,0.8)']}
            style={styles.paginationNavButtonEnabled}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </LinearGradient>
        )}
      </Pressable>

      <View style={styles.paginationNumbersRow}>
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <Text key={`ellipsis-${index}`} style={styles.paginationEllipsis}>
                ...
              </Text>
            );
          }

          const pageNumber = page as number;
          const isActive = pageNumber === currentPage;

          return (
            <Pressable
              key={`page-${pageNumber}`}
              disabled={disabled}
              onPress={() => onPageChange(pageNumber)}
              style={styles.paginationPageButton}
            >
              <LinearGradient
                colors={
                  isActive
                    ? [SAGE, 'rgba(125,155,118,0.8)']
                    : ['rgba(125,155,118,0.2)', 'rgba(125,155,118,0.1)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.paginationPageGradient}
              >
                <Text style={[styles.paginationPageText, isActive ? styles.paginationPageTextActive : null]}>
                  {pageNumber}
                </Text>
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || disabled}
        style={styles.paginationNavButton}
      >
        {currentPage === totalPages || disabled ? (
          <View style={styles.paginationNavButtonDisabled}>
            <Ionicons name="chevron-forward" size={20} color="rgba(45,45,45,0.3)" />
          </View>
        ) : (
          <LinearGradient
            colors={[SAGE, 'rgba(125,155,118,0.8)']}
            style={styles.paginationNavButtonEnabled}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        )}
      </Pressable>
    </View>
  );
}

function EmptySavedState() {
  return (
    <View style={styles.emptyStateWrap}>
      <View style={styles.emptyStateIconWrap}>
        <Ionicons name="bookmark-outline" size={32} color="rgba(45,45,45,0.35)" />
      </View>
      <Text style={styles.emptyStateTitle}>No saved items yet</Text>
      <Text style={styles.emptyStateSubtitle}>Tap the bookmark icon on any business to save it here</Text>
    </View>
  );
}

function SavedCardSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <SkeletonBlock style={styles.skeletonCardMedia} variant="strong" />
      <View style={styles.skeletonCardBody}>
        <SkeletonBlock style={styles.skeletonCardTitle} />
        <SkeletonBlock style={styles.skeletonCardSubtitle} />
        <SkeletonBlock style={styles.skeletonCardReview} />
        <SkeletonBlock style={styles.skeletonCardPillRow} variant="soft" />
      </View>
    </View>
  );
}

function SavedPageSkeleton({
  showHeader = true,
  columnCount,
  gridGap,
}: {
  showHeader?: boolean;
  columnCount: number;
  gridGap: number;
}) {
  const skeletonItems = useMemo(() => Array.from({ length: 8 }, (_, index) => index), []);
  const skeletonRows = useMemo(() => chunkIntoRows(skeletonItems, columnCount), [columnCount, skeletonItems]);

  return (
    <View style={styles.maxContainer}>
      {showHeader ? (
        <View style={styles.skeletonHeaderWrap}>
          <SkeletonBlock style={styles.skeletonHeadingBar} />
          <SkeletonBlock style={styles.skeletonSubtitleBar} />
        </View>
      ) : null}

      <View style={styles.skeletonPillWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skeletonPillRow}>
          <SkeletonBlock style={styles.skeletonPillSmall} />
          <SkeletonBlock style={styles.skeletonPillMedium} />
          <SkeletonBlock style={styles.skeletonPillLarge} />
          <SkeletonBlock style={styles.skeletonPillMedium} />
        </ScrollView>
      </View>

      <View style={[styles.gridWrap, { rowGap: gridGap }]}> 
        {skeletonRows.map((row, rowIndex) => (
          <View key={`skeleton-row-${rowIndex}`} style={[styles.gridRow, { columnGap: gridGap }]}> 
            {row.map((item) => (
              <View key={`skeleton-cell-${item}`} style={styles.gridCell}>
                <SavedCardSkeleton />
              </View>
            ))}
            {row.length < columnCount
              ? Array.from({ length: columnCount - row.length }, (_, index) => (
                  <View key={`skeleton-placeholder-${rowIndex}-${index}`} style={styles.gridCell} />
                ))
              : null}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function SavedScreen() {
  const router = useRouter();
  const { user } = useAuthSession();
  const { width } = useWindowDimensions();

  const scrollRef = useRef<ScrollView | null>(null);
  const scrollTopVisibleRef = useRef(false);
  const pageChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paginationDoneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);

  const savedQuery = useSavedBusinesses();
  const savedBusinesses = (savedQuery.data?.businesses ?? []) as SavedBusinessRecord[];
  const isLoading = savedQuery.isLoading;
  const errorMessage = savedQuery.error instanceof Error ? savedQuery.error.message : null;

  const isSmUp = width >= BREAKPOINT_SM;
  const isMdUp = width >= BREAKPOINT_MD;
  const gridColumns = resolveGridColumns(width);
  const gridGap = isSmUp ? 12 : 16;
  const headingFontSize = isMdUp ? 36 : isSmUp ? 30 : 24;
  const breadcrumbFontSize = isSmUp ? 16 : 14;
  const titleSectionMarginBottom = isSmUp ? 32 : 24;
  const pillHorizontalPadding = isSmUp ? 16 : 12;
  const pillFontSize = isSmUp ? 14 : 12;

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(savedBusinesses.map((business) => business.category).filter(isNonEmptyString))).sort(
      (a, b) => a.localeCompare(b)
    );
    return ['All', ...uniqueCategories];
  }, [savedBusinesses]);

  const filteredBusinesses = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All') {
      return savedBusinesses;
    }
    return savedBusinesses.filter((business) => business.category === selectedCategory);
  }, [savedBusinesses, selectedCategory]);

  const totalPages = useMemo(() => Math.ceil(filteredBusinesses.length / ITEMS_PER_PAGE), [filteredBusinesses.length]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBusinesses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredBusinesses]);

  const paginatedRows = useMemo(() => chunkIntoRows(paginatedItems, gridColumns), [gridColumns, paginatedItems]);

  const filterOptions = useMemo<FilterOption[]>(
    () =>
      categories.map((category) => ({
        value: category === 'All' ? null : category,
        label: category,
        count:
          category === 'All'
            ? savedBusinesses.length
            : savedBusinesses.filter((business) => business.category === category).length,
      })),
    [categories, savedBusinesses]
  );

  const hasAnyContent = savedBusinesses.length > 0;
  const totalSavedCount = savedBusinesses.length;

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
    enabled: Boolean(user) && hasAnyContent,
    onScrollToTop: handleScrollToTop,
  });

  useEffect(() => {
    if (!hasAnyContent) {
      setScrollTopVisible(false);
    }
  }, [hasAnyContent, setScrollTopVisible]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategory && !categories.includes(selectedCategory)) {
      setSelectedCategory(null);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (currentPage > 1 && totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(
    () => () => {
      if (pageChangeTimeoutRef.current) {
        clearTimeout(pageChangeTimeoutRef.current);
      }
      if (paginationDoneTimeoutRef.current) {
        clearTimeout(paginationDoneTimeoutRef.current);
      }
    },
    []
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (nextPage === currentPage || nextPage < 1 || nextPage > totalPages) return;

      if (pageChangeTimeoutRef.current) {
        clearTimeout(pageChangeTimeoutRef.current);
      }
      if (paginationDoneTimeoutRef.current) {
        clearTimeout(paginationDoneTimeoutRef.current);
      }

      setIsPaginationLoading(true);
      scrollRef.current?.scrollTo({ y: 0, animated: true });

      pageChangeTimeoutRef.current = setTimeout(() => {
        setCurrentPage(nextPage);
        paginationDoneTimeoutRef.current = setTimeout(() => {
          setIsPaginationLoading(false);
        }, 300);
      }, 150);
    },
    [currentPage, totalPages]
  );

  const handleRefetch = useCallback(() => {
    void savedQuery.refetch();
  }, [savedQuery]);

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(125,155,118,0.10)', OFF_WHITE, 'rgba(114,47,55,0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={savedQuery.isRefetching} onRefresh={handleRefetch} />}
      >
        <TransitionItem variant="header" index={0}>
          <View style={styles.maxContainer}>
            <View style={styles.breadcrumbWrap}>
              <View style={styles.breadcrumbRow}>
                <Pressable onPress={() => router.push(routes.home() as never)}>
                  <Text style={[styles.breadcrumbLink, { fontSize: breadcrumbFontSize }]}>Home</Text>
                </Pressable>
                <Ionicons name="chevron-forward" size={16} color="rgba(45,45,45,0.6)" />
                <Text style={[styles.breadcrumbCurrent, { fontSize: breadcrumbFontSize }]}>Saved</Text>
              </View>
            </View>
          </View>
        </TransitionItem>

        {isLoading ? (
          <SavedPageSkeleton columnCount={gridColumns} gridGap={gridGap} />
        ) : errorMessage ? (
          <TransitionItem variant="card" index={1}>
            <View style={styles.errorWrap}>
              <View style={styles.errorInner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <Pressable style={styles.retryButton} onPress={handleRefetch}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </Pressable>
              </View>
            </View>
          </TransitionItem>
        ) : (
          <TransitionItem variant="card" index={1}>
            <View style={styles.maxContainer}>
              <View style={[styles.titleSection, { marginBottom: titleSectionMarginBottom }]}>
                <Text style={[styles.titleHeading, { fontSize: headingFontSize }]}>Your Saved Gems</Text>
                <Text style={styles.titleSubtitle}>
                  {hasAnyContent
                    ? `${totalSavedCount} ${totalSavedCount === 1 ? 'item' : 'items'} saved`
                    : 'Businesses you bookmark will appear here'}
                </Text>
              </View>

              {hasAnyContent ? (
                <>
                  {categories.length > 1 ? (
                    <View style={styles.filterWrap}>
                      <SavedFilterPillGroup
                        options={filterOptions}
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        pillHorizontalPadding={pillHorizontalPadding}
                        pillFontSize={pillFontSize}
                      />
                    </View>
                  ) : null}

                  {filteredBusinesses.length > 0 ? (
                    <View style={[styles.gridWrap, { rowGap: gridGap }]}> 
                      {paginatedRows.map((row, rowIndex) => (
                        <View key={`row-${rowIndex}`} style={[styles.gridRow, { columnGap: gridGap }]}> 
                          {row.map((business) => (
                            <View key={business.id} style={styles.gridCell}>
                              <BusinessCard business={business as any} />
                            </View>
                          ))}
                          {row.length < gridColumns
                            ? Array.from({ length: gridColumns - row.length }, (_, index) => (
                                <View key={`placeholder-${rowIndex}-${index}`} style={styles.gridCell} />
                              ))
                            : null}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.filteredEmptyWrap}>
                      <View style={styles.filteredEmptyIconWrap}>
                        <Ionicons name="storefront-outline" size={24} color="rgba(45,45,45,0.85)" />
                      </View>
                      <Text style={styles.filteredEmptyText}>No saved businesses yet</Text>
                      <Pressable style={styles.exploreButton} onPress={() => router.push(routes.home() as never)}>
                        <Text style={styles.exploreButtonText}>Explore Businesses</Text>
                      </Pressable>
                    </View>
                  )}

                  {filteredBusinesses.length > ITEMS_PER_PAGE ? (
                    <View style={styles.paginationWrap}>
                      <SavedPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        disabled={isPaginationLoading}
                        onPageChange={handlePageChange}
                      />
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={styles.emptyStatePad}>
                  <EmptySavedState />
                </View>
              )}
            </View>
          </TransitionItem>
        )}
      </ScrollView>

      {isPaginationLoading ? (
        <View style={styles.paginationOverlay}>
          <View style={styles.paginationOverlayInner}>
            <SavedPageSkeleton showHeader={false} columnCount={gridColumns} gridGap={gridGap} />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  maxContainer: {
    width: '100%',
    maxWidth: 2000,
    alignSelf: 'center',
    paddingHorizontal: APP_PAGE_GUTTER,
  },

  breadcrumbWrap: {
    paddingHorizontal: APP_PAGE_GUTTER,
    paddingBottom: 4,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbLink: {
    color: 'rgba(45,45,45,0.7)',
    fontWeight: '500',
  },
  breadcrumbCurrent: {
    color: CHARCOAL,
    fontWeight: '600',
  },

  titleSection: {
    paddingHorizontal: APP_PAGE_GUTTER,
  },
  titleHeading: {
    color: CHARCOAL,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  titleSubtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(45,45,45,0.6)',
    fontWeight: '500',
  },

  filterWrap: {
    marginBottom: 24,
    paddingHorizontal: APP_PAGE_GUTTER,
  },
  pillScroll: {
    maxHeight: 42,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 999,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.12)',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  pillActive: {
    borderColor: 'rgba(157,171,155,0.5)',
    backgroundColor: 'rgba(157,171,155,0.92)',
  },
  pillPressed: {
    opacity: 0.92,
  },
  pillText: {
    color: 'rgba(45,45,45,0.7)',
    fontWeight: '600',
  },
  pillCount: {
    color: 'rgba(45,45,45,0.6)',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },

  gridWrap: {
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  gridCell: {
    flex: 1,
    minWidth: 0,
  },

  filteredEmptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  filteredEmptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(229,224,229,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filteredEmptyText: {
    marginTop: 10,
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(45,45,45,0.6)',
    textAlign: 'center',
    fontWeight: '500',
  },
  exploreButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: CARD_BG,
  },
  exploreButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  paginationWrap: {
    marginTop: 32,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  paginationNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  paginationNavButtonEnabled: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  paginationNavButtonDisabled: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(229,224,229,0.5)',
  },
  paginationNumbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationEllipsis: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: 'rgba(45,45,45,0.7)',
    fontWeight: '500',
  },
  paginationPageButton: {
    minWidth: 40,
    height: 40,
    borderRadius: 999,
    overflow: 'hidden',
  },
  paginationPageGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  paginationPageText: {
    fontSize: 14,
    fontWeight: '600',
    color: CHARCOAL,
  },
  paginationPageTextActive: {
    color: '#FFFFFF',
  },

  errorWrap: {
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  errorInner: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(45,45,45,0.7)',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: CARD_BG,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  emptyStatePad: {
    paddingHorizontal: APP_PAGE_GUTTER,
  },
  emptyStateWrap: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateIconWrap: {
    width: 64,
    height: 64,
    marginBottom: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(45,45,45,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(45,45,45,0.5)',
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(45,45,45,0.38)',
    textAlign: 'center',
  },

  skeletonHeaderWrap: {
    marginBottom: 24,
    paddingHorizontal: APP_PAGE_GUTTER,
  },
  skeletonHeadingBar: {
    height: 36,
    width: 224,
    borderRadius: 12,
    backgroundColor: 'rgba(45,45,45,0.10)',
  },
  skeletonSubtitleBar: {
    marginTop: 12,
    height: 16,
    width: 160,
    borderRadius: 8,
    backgroundColor: 'rgba(45,45,45,0.10)',
  },
  skeletonPillWrap: {
    marginBottom: 24,
    paddingHorizontal: APP_PAGE_GUTTER,
  },
  skeletonPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonPillSmall: {
    width: 64,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(45,45,45,0.10)',
  },
  skeletonPillMedium: {
    width: 80,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(45,45,45,0.10)',
  },
  skeletonPillLarge: {
    width: 96,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(45,45,45,0.10)',
  },
  skeletonCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: CARD_BG,
  },
  skeletonCardMedia: {
    width: '100%',
    height: 220,
    backgroundColor: 'rgba(157,171,155,0.95)',
  },
  skeletonCardBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(157,171,155,0.32)',
  },
  skeletonCardTitle: {
    height: 24,
    borderRadius: 10,
    width: '72%',
    backgroundColor: 'rgba(45,45,45,0.10)',
  },
  skeletonCardSubtitle: {
    marginTop: 10,
    height: 13,
    borderRadius: 7,
    width: '48%',
    backgroundColor: 'rgba(45,45,45,0.08)',
  },
  skeletonCardReview: {
    marginTop: 9,
    height: 12,
    borderRadius: 6,
    width: '38%',
    backgroundColor: 'rgba(45,45,45,0.08)',
  },
  skeletonCardPillRow: {
    marginTop: 12,
    height: 28,
    borderRadius: 14,
    width: '92%',
    backgroundColor: 'rgba(229,224,229,0.55)',
  },

  paginationOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
    backgroundColor: 'rgba(229,224,229,0.92)',
  },
  paginationOverlayInner: {
    paddingTop: 96,
    paddingBottom: 40,
    flex: 1,
  },
});
