import { constants } from 'ethers';

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
  project?: ProjectNest // could be null for global notifications
  eventType: number
  eventMessage: string // event message
  countdownNextPhase?: number // only count down notification
  isUnread?: boolean
}

export function fromRawNotification(
  raw: RawNotification,
  eventMessage: string,
  countdownNextPhase?: number,
): Notification {

  const notification: Notification = {
    id: raw.id,
    timestamp: raw.timestamp,
    eventType: raw.eventType,
    eventMessage,
  };

  if (raw.projectNest !== constants.AddressZero) {
    notification.project = { address: raw.projectNest };
  }

  if (countdownNextPhase !== undefined) {
    notification.countdownNextPhase = countdownNextPhase;
  }

  return notification;
}
