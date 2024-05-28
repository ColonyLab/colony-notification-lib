import LocalStorage from '../local-storage';
import { Notification } from '../types/notification';

// Filter unread flag on notifications using LocalStorage
export function filterUnreadNotifications(
  account: string,
  accountNotifications: Notification[],
): Notification[] {
  const presentTimestamps = LocalStorage.hasNotificationTimestamps(
    account,
    accountNotifications.map(n => n.timestamp),
  );

  // determine "unread" notifications
  for (const notification of accountNotifications) {
    notification.isUnread = !presentTimestamps[notification.timestamp];
  }

  return accountNotifications;
}
