import { constants } from 'ethers';
import { EventType, mapEventType } from '../types/event-type';
import { RawNotification, Notification, fromRawNotification } from '../types/notification';
import { Phase } from '../types/project-phase';

// Fill event message based on event type
export async function filterEventMessage(
  rawNotifications: RawNotification[],
): Promise<Notification[]> {
  const filteredNotifications: Notification[] = [];

  // Helper function to push countdown set notification
  const filterCountdownSet = async (raw: RawNotification) => {
    // update eventString based on IFPS content, if available
    if (!raw.content) {
      return; // skip notification with null content
    }

    try {
      const parsedContent = JSON.parse(raw.content.content);

      if (parsedContent.type !== "nextPhase") {
        return; // skip other types
      }

      const phaseIdStr = parsedContent.phaseId.match(/\[p(\d+)\]/)?.[1];
      if (!phaseIdStr) {
        return; // skip if phaseId dont match
      }

      const phaseId = parseInt(phaseIdStr);
      if (phaseId === Phase.Pending || phaseId === Phase.Rejected) {
        return; // skip Pending and Rejected phases
      }

      const eventMessage = mapEventType(raw.eventType, {
        actionTimestamp: raw.timestamp,
        countdownNextPhase: phaseId,
      });

      const notification = fromRawNotification(raw, eventMessage, phaseId);

      filteredNotifications.push(notification);
    } catch (error) {
      // skip if content is not parsable
    }
  };

  // Helper function to push custom notification
  const filterCustomNotification = async (raw: RawNotification) => {
    // update eventString based on IFPS content, if available
    if (!raw.content) {
      return; // skip notification with null content
    }

    const eventMessage = mapEventType(raw.eventType, {
      customMessage: raw.content.content,
    });

    const notification = fromRawNotification(raw, eventMessage);

    // if project is missing, it is a global notification
    if (notification.project === null) {
      filteredNotifications.push(notification);
      return;
    }

    filteredNotifications.push(notification);
  };

  for (const raw of rawNotifications) {
    // console.log(
    //   "Processing notification message:", notification.eventType,
    //   ", for project:", notification.projectNest,
    // ); // dbg

    switch (raw.eventType) {
      // add token symbol to the event message from additionalData
      case EventType.AvailableOnPortfolio: {
        const eventMessage = mapEventType(raw.eventType, {
          ceTokenSymbol: JSON.parse(raw.additionalData).ceToken.symbol,
        });

        filteredNotifications.push(fromRawNotification(raw, eventMessage));
        break;
      }

      // add action timestamp to the event message
      case EventType.CountdownSet:
        await filterCountdownSet(raw);
        break;

      case EventType.CountdownHidden:
        break; // skip

      // custom notification require more logic
      case EventType.CustomNotification:
        await filterCustomNotification(raw);
        break;

      default: {
        const eventMessage = mapEventType(raw.eventType);
        filteredNotifications.push(fromRawNotification(raw, eventMessage));
      }
    }
  }

  return filteredNotifications;
}
