import { constants } from 'ethers';
import EarlyStageService from '../early-stage-service';
import { EventType, mapEventType } from '../types/event-type';
import { Notification } from '../types/notification';

// Fill event message based on event type
export async function filterEventMessage(
  notifications: Notification[],
): Promise<Notification[]> {
  const filteredNotifications = [];

  // Helper function to push custom notification
  const filterCustomNotification = async (notification: Notification) => {
    // update eventString based on IFPS content, if available
    if (!notification.content) {
      return; // skip notification with null content
    }

    notification.eventMessage = mapEventType(notification.eventType, {
      customMessage: notification.content.content,
    });

    // if projectNest is zero address, it is a global notification
    if (notification.projectNest === constants.AddressZero) {
      filteredNotifications.push(notification);
      return;
    }

    const exist = await EarlyStageService.projectExist(notification.projectNest);
    if (!exist) {
      return; // skip if project does not exist
    }

    filteredNotifications.push(notification);
  };

  for (const notification of notifications) {
    console.log(
      "Processing notification message:", notification.eventType,
      ", for project:", notification.projectNest,
    ); // dbg

    switch (notification.eventType) {
        // add token symbol to the event message from additionalData
        case EventType.AvailableOnPortfolio:
          notification.eventMessage = mapEventType(notification.eventType, {
            ceTokenSymbol: JSON.parse(notification.additionalData).ceToken.symbol,
          });
          filteredNotifications.push(notification);
          break;

        // add action timestamp to the event message
        case EventType.CountdownSet:
          notification.eventMessage = mapEventType(notification.eventType, {
            actionTimestamp: notification.timestamp,
          });
          filteredNotifications.push(notification);
          break;

        case EventType.CountdownHidden:
          break; // skip

        // custom notification require more logic
        case EventType.CustomNotification:
          await filterCustomNotification(notification);
          break;

        default:
          notification.eventMessage = mapEventType(notification.eventType);
          filteredNotifications.push(notification);
      }
  }

  // remove not needed any more content field
  for (const notification of filteredNotifications) {
    delete notification.content;
  }

  return filteredNotifications;
}
