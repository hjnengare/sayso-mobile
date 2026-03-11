import { StyleSheet } from 'react-native';
import { businessDetailColors, businessDetailSpacing } from '../../../components/business-detail/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: businessDetailColors.page,
  },
  searchWrap: {
    paddingHorizontal: businessDetailSpacing.pageGutter,
    paddingTop: 10,
    paddingBottom: 8,
  },
  filtersWrap: {
    paddingHorizontal: businessDetailSpacing.pageGutter,
    paddingBottom: 8,
    gap: 10,
  },
  filterGroup: {
    gap: 6,
  },
  filterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: businessDetailColors.textMuted,
  },
  pillRow: {
    gap: 8,
    paddingRight: businessDetailSpacing.pageGutter,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: businessDetailColors.coral,
    borderColor: businessDetailColors.coral,
  },
  pillInactive: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(45,55,72,0.18)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: businessDetailColors.white,
  },
  pillTextInactive: {
    color: businessDetailColors.charcoal,
  },
  activeBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: businessDetailSpacing.pageGutter,
    paddingBottom: 8,
    gap: 8,
    alignItems: 'center',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: businessDetailColors.sage,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: businessDetailColors.white,
  },
  clearBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(45,55,72,0.2)',
  },
  clearBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: businessDetailColors.textMuted,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: businessDetailSpacing.pageGutter,
    paddingBottom: 10,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(45,55,72,0.1)',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 40,
    borderRadius: 999,
  },
  toggleBtnActiveList: {
    backgroundColor: businessDetailColors.cardBg,
  },
  toggleBtnActiveMap: {
    backgroundColor: businessDetailColors.coral,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: businessDetailColors.white,
  },
  toggleBtnTextInactive: {
    color: businessDetailColors.charcoal,
  },
  list: {
    paddingHorizontal: businessDetailSpacing.pageGutter,
    paddingTop: 4,
    paddingBottom: 4,
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  skeletonStack: {
    gap: 12,
    paddingTop: 4,
  },
  loadMoreBtn: {
    marginVertical: 4,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45,55,72,0.12)',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: businessDetailColors.charcoal,
  },
  footerSpacer: {
    height: 24,
  },
  hero: {
    paddingHorizontal: businessDetailSpacing.pageGutter,
    paddingTop: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: businessDetailColors.charcoal,
    textAlign: 'center',
  },
  heroDesc: {
    fontSize: 15,
    lineHeight: 22,
    color: businessDetailColors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
});
