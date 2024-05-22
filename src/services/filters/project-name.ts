import { constants } from 'ethers';
import EarlyStageService from '../early-stage-service';
import { Notification } from '../types/notification';
import { EventType } from '../types/event-type';

// Filter project names
export function filterProjectsNames(notifications: Notification[]): Notification[] {
  return notifications.filter((notification) => {
    const name = EarlyStageService.projectName(notification.projectNest);
    if(name === null) {

      // omit notifications without project name
      // unless it is a global custom notification
      if (
        notification.eventType === EventType.CustomNotification &&
        notification.projectNest === constants.AddressZero
      ) {
        notification.projectName = undefined
        return true;
      }

      return false;
    }

    notification.projectName = name;
    return true;
  })
}
