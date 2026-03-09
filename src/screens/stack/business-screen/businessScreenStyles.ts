import { StyleSheet } from 'react-native';
import { businessDetailColors, businessDetailSpacing } from '../../../components/business-detail/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: businessDetailColors.page,
  },
  stickyHeader: {
    paddingHorizontal: businessDetailSpacing.pageGutter,
    paddingTop: 14,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
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
