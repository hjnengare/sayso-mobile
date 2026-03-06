import { Stack } from 'expo-router';
import { sharedStackScreenOptions } from '../../src/navigation/screenOptions';
import { StackPageHeader } from '../../src/components/StackPageHeader';

export default function SharedStackLayout() {
  return (
    <Stack
      screenOptions={{
        ...sharedStackScreenOptions,
        header: (props) => <StackPageHeader {...props} />,
      }}
    />
  );
}
