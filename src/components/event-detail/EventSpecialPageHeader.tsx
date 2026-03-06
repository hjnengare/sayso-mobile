import { BusinessPageHeader, type BusinessHeaderMenuItem } from '../business-detail';

export type EventSpecialHeaderMenuItem = BusinessHeaderMenuItem;

type Props = {
  onPressBack: () => void;
  onPressNotifications: () => void;
  onPressMessages: () => void;
  menuItems: EventSpecialHeaderMenuItem[];
  collapsed?: boolean;
};

export function EventSpecialPageHeader(props: Props) {
  return <BusinessPageHeader {...props} />;
}
