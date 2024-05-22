import { constants } from 'ethers';
import LocalStorage from '../local-storage';
import EarlyStageService from '../early-stage-service';
import { EventType, mapEventType } from '../types/event-type';
import { Notification } from '../types/notification';

// Filter notifications by eventType for a given account
export async function filterAccountNotifications (
  account: string,
  notifications: Notification[],
  limit?: number,
): Promise<Notification[]> {
  const accountNotifications = [];

  // Helper function to check if account is involved
  const involved = async (notification: Notification): Promise<boolean> => {
    return EarlyStageService.isAccountInvolved(
      notification.projectNest,
      account,
    );
  };

  // Helper function to check if account has allocation
  const hasAllocation = async (notification: Notification): Promise<boolean> => {
    const allocation = await EarlyStageService.accountAllocation(
      notification.projectNest,
      account,
    );
    return allocation > 0
  };

  // Helper function to check if account has overinvestment
  const hasOverinvestment = async (notification: Notification): Promise<boolean> => {
    const overinvestment = await EarlyStageService.accountOverinvestment(
      notification.projectNest,
      account,
    );
    return overinvestment > 0
  };

  // Helper function to push custom notification
  const pushCustomNotification = async (notification: Notification) => {

    // if projectNest is zero address, it is a global notification for all users
    if (notification.projectNest === constants.AddressZero) {
      accountNotifications.push(notification);
      return;
    }

    if (await involved(notification)) {
      accountNotifications.push(notification);
    }
  };

  for (const notification of notifications) {
    if (limit && accountNotifications.length >= limit) {
      break;
    }

    console.log(
      "Processing account notification:", notification.eventType,
      ", for project:", notification.projectNest,
      ", and account:", account
    ); // dbg

    switch (notification.eventType) {
        case EventType.NewProjectOnDealFlow:
        case EventType.NestIsOpen:
          accountNotifications.push(notification);
          break;

        // additional check if account has any allocation in the project
        case EventType.MovedToAnalysis: {
          if (await hasAllocation(notification)) {
            accountNotifications.push(notification);
          }
          break;
        }

        // additional check if account has overinvestment to claim in the project
        case EventType.ClaimUsdcExcess:
          if (await hasOverinvestment(notification)) {
            accountNotifications.push(notification);
          }
          break;

        case EventType.CountdownSet:
          if (await involved(notification)) {
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
          if (await involved(notification)) {
            accountNotifications.push(notification);
          }
      }
  }

  // determine "new" notifications
  const timestamp = LocalStorage.getNotificationTimestamp(account);
  for (const notification of accountNotifications) {
    notification.new = notification.timestamp > timestamp;
  }

  return accountNotifications;
}
