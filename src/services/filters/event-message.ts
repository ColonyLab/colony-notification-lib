import { EventType, mapEventType } from '../types/event-type';
import { RawNotification } from '../types/notification';
import { Phase } from '../types/project-phase';

export function getCountdownNextPhase(raw: RawNotification): number | null {
  // update eventString based on IFPS content, if available
  if (!raw.content) {
    return null; // skip notification with null content
  }

  try {
    const parsedContent = JSON.parse(raw.content.content);

    if (parsedContent.type !== "nextPhase") {
      return null; // skip other types
    }

    const phaseIdStr = parsedContent.phaseId.match(/\[p(\d+)\]/)?.[1];
    if (!phaseIdStr) {
      return null; // skip if phaseId dont match
    }

    return parseInt(phaseIdStr);
  } catch (error) {
    return null; // null if content is not parsable
  }
}

// Helper function to get countdown set notification event message
function countdownSetEventMessage(
  raw: RawNotification,
): string | null {
  const phaseId = getCountdownNextPhase(raw);
  if (phaseId === null) {
    return null;
  }

  if (phaseId === Phase.Pending || phaseId === Phase.Rejected) {
    return null; // skip Pending and Rejected phases
  }

  return mapEventType(raw.eventType, {
    actionTimestamp: raw.timestamp,
    countdownNextPhase: phaseId,
  });
}

// Helper function to get custom notification event message
function customNotificationEventMessage(raw: RawNotification): string | null {
  // update eventString based on IFPS content, if available
  if (!raw.content) {
    return null; // skip notification with null content
  }

  return mapEventType(raw.eventType, {
    customMessage: raw.content.content,
  });
}

// return event message based on event type
export function notificationEventMessage(
  raw: RawNotification,
): string | null {

  // console.log(
  //   "Processing notification message:", raw.eventType,
  //   ", for project:", raw.projectNest,
  // ); // dbg

  switch (raw.eventType) {
    // add token symbol to the event message from additionalData
    case EventType.AvailableOnPortfolio:
      return mapEventType(raw.eventType, {
        ceTokenSymbol: JSON.parse(raw.additionalData).ceToken.symbol,
      });

    // add action timestamp to the event message
    case EventType.CountdownSet:
      return countdownSetEventMessage(raw);

    case EventType.CountdownHidden:
      break; // skip

    // custom notification require more logic
    case EventType.CustomNotification:
      return customNotificationEventMessage(raw);

    default: {
      return mapEventType(raw.eventType);
    }
  }

  return null;
}
