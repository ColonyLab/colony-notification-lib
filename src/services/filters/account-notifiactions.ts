import GraphService from '../graph-service';
import { EventType } from '../types/event-type';
import { Notification } from '../types/notification';
import { Phase } from '../types/project-phase';

import { filterUnreadNotifications } from './unread-notifications';

// Filter notifications by eventType for a given account
export async function filterAccountNotifications(
  account: string,
  notifications: Notification[],
  limit?: number,
): Promise<Notification[]> {
  if (!notifications || notifications.length === 0) {
    return [];
  }

  let accountNotifications = [];

  // Helper function to check if account is involved
  const involved = (notification: Notification): boolean => {
    if (notification.project === undefined) {
      return false;
    }

    if (notification.project === null) {
      return true;
    }

    return GraphService.isAccountInvolved(
      notification.project.address,
      account,
    );
  };

  // Helper function to push custom notification
  const pushCustomNotification = async (notification: Notification) => {
    // if project is missing, it is a global notification
    if (notification.project === undefined) {
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

  accountNotifications = filterUnreadNotifications(account, accountNotifications);

  return accountNotifications;
}
