import EarlyStageService from '../early-stage-service';
import { Notification } from '../types/notification';

// Filter project names
export function filterProjectsNames(notifications: Notification[]): Notification[] {
  return notifications.filter((notification) => {
    const name = EarlyStageService.projectName(notification.projectNest);
    if(name === null) {
      return false; // omit notifications without project name
    }
    notification.projectName = name;
    return true;
  })
}
