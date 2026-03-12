import { StyleSheet, View } from 'react-native';
import type { BusinessPercentilesDto } from '@sayso/contracts';
import { BusinessCardPercentileChip } from './BusinessCardPercentileChip';

type Props = {
  percentiles?: BusinessPercentilesDto;
};

export function BusinessCardPercentiles({ percentiles }: Props) {
  return (
    <View style={styles.wrap}>
      <BusinessCardPercentileChip label="punctuality" value={percentiles?.punctuality} />
      <BusinessCardPercentileChip
        label="cost-effectiveness"
        value={percentiles?.['cost-effectiveness']}
      />
      <BusinessCardPercentileChip label="friendliness" value={percentiles?.friendliness} />
      <BusinessCardPercentileChip label="trustworthiness" value={percentiles?.trustworthiness} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    width: '92%',
  },
});
