import EarlyStageService from '../early-stage-service';
import { Notification } from '../types/notification';
import { EventType } from '../types/event-type';

// Filter project names
export function fillProjectsData(notifications: Notification[]): Notification[] {
  return notifications.filter((notification) => {
    if (notification.project === undefined)
      return false;

    if (notification.project === null) {
      // omit notifications without project
      // unless it is a global custom notification
      if (notification.eventType === EventType.CustomNotification) {
        return true;
      }
    }

    const name = EarlyStageService.projectName(notification.project.address);
    if(name === null)
      return false;

    const logo = EarlyStageService.projectLogo(notification.project.address);
    if(logo === null)
      return false;

    notification.project.name = name;
    notification.project.logo = logo;

    return true;
  });
}
