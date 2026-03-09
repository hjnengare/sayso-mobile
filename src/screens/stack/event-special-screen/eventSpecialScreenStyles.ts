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
});
