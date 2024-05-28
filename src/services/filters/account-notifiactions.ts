import { constants } from 'ethers';
import LocalStorage from '../local-storage';
import EarlyStageService from '../early-stage-service';
import { EventType } from '../types/event-type';
import { Notification } from '../types/notification';
import { Phase } from '../types/project-phase';

// Filter notifications by eventType for a given account
export async function filterAccountNotifications(
  account: string,
  notifications: Notification[],
  limit?: number,
): Promise<Notification[]> {
  if (!notifications || notifications.length === 0) {
    return [];
  }

  const accountNotifications = [];

  // Helper function to check if account is involved
  const involved = (notification: Notification): boolean => {
    if (notification.project === undefined) {
      return false;
    }

    if (notification.project === null) {
      return true;
    }

    return EarlyStageService.isAccountInvolved(
      notification.project.address,
      account,
    );
  };

  // Helper function to push custom notification
  const pushCustomNotification = async (notification: Notification) => {

    // if project is missing, it is a global notification
    if (notification.project === null) {
      accountNotifications.push(notification);
      return;
    }

    if (involved(notification)) {
      accountNotifications.push(notification);
    }
  };

  for (const notification of notifications) {
    if (limit && accountNotifications.length >= limit) {
      break;
    }

    // console.log(
    //   "Processing account notification:", notification.eventType,
    //   ", for project:", notification.projectNest,
    //   ", and account:", account,
    // ); // dbg

    switch (notification.eventType) {
        case EventType.NewProjectOnDealFlow:
        case EventType.NestIsOpen:
          accountNotifications.push(notification);
          break;

        case EventType.CountdownSet:
          //  add DealFlow notifications to everyone
          if (notification.countdownNextPhase === Phase.DealFlow) {
            accountNotifications.push(notification);
            break;
          }

          if (involved(notification)) {
            accountNotifications.push(notification);
          }
          break;

        case EventType.CountdownHidden:
          break; // skip

        // custom notification require more logic
        case EventType.CustomNotification:
          await pushCustomNotification(notification);
          break;

        default:
          if (involved(notification)) {
            accountNotifications.push(notification);
          }
      }
  }

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
