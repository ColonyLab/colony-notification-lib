import { constants } from 'ethers';
import { getCountdownNextPhase, notificationEventMessage } from '../filters/event-message';
import { fillProjectsData } from '../filters/project-data';

/// Raw Notification retrived from notification subgraph
export interface RawNotification {
  id: string
  timestamp: number
  projectNest: string
  eventType: number
  additionalData: string
  content?: { // could be null
    id: string // dataURI
    content: string
  }
}

export interface ProjectNest {
  address: string
  name?: string
  logo?: string
}

/// User Notification
export interface Notification {
  id: string
  timestamp: number
  project?: ProjectNest // could be undefined for global notifications
  eventType: number
  eventMessage: string // event message
  countdownNextPhase?: number // only count down notification
  isUnread?: boolean
}

export function fromRawNotifications(
  raws: RawNotification[],
): Notification[] {
  let notifications: Notification[] = [];

  for (const raw of raws) {
    const eventMessage = notificationEventMessage(raw);
    if (!eventMessage) {
      continue;
    }

    const notification: Notification = {
      id: raw.id,
      timestamp: raw.timestamp,
      eventType: raw.eventType,
      eventMessage,
    };

    if (raw.projectNest !== constants.AddressZero) {
      notification.project = { address: raw.projectNest };
    }

    const countdownNextPhase = getCountdownNextPhase(raw);
    if (countdownNextPhase !== null) {
      notification.countdownNextPhase = countdownNextPhase;
    }

    notifications.push(notification);
  }

  notifications = fillProjectsData(notifications);

  return notifications;
}
