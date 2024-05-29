import GraphService from '../graph-service';
import { Notification } from '../types/notification';
import { EventType } from '../types/event-type';

// Filter project names
export function fillProjectsData(notifications: Notification[]): Notification[] {
  return notifications.filter((notification) => {
    if (notification.project === undefined) {
      // omit notifications without project
      // unless it is a global custom notification
      if (notification.eventType === EventType.CustomNotification) {
        return true;
      }
      return false;
    }

    const name = GraphService.projectName(notification.project.address);
    if(name === null)
      return false;

    const logo = GraphService.projectLogo(notification.project.address);
    if(logo === null)
      return false;

    notification.project.name = name;
    notification.project.logo = logo;

    return true;
  });
}
