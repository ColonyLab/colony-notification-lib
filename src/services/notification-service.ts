import GeneralNotifications from './general-notifications';
import NotificationStream from './notification-stream';
import { Notification } from './types/notification';

/// Notification Service
export default class NotificationService {
  private generalNotifications: GeneralNotifications;

  private constructor(){}

  private async init(): Promise<void> {
    this.generalNotifications = await GeneralNotifications.createInstance();
  }

  // Factory method to create an instance of NotificationService
  public static async createInstance(): Promise<NotificationService> {
    const instance = new NotificationService();
    await instance.init();

    return instance;
  }

  public async createStream(
    account: string,
    pageSize: number,
    notificationsHook: (notifications: Notification[]) => void,
  ): Promise<NotificationStream> {
    return NotificationStream.createStream(
      this.generalNotifications,
      account,
      pageSize,
      notificationsHook,
    );
  }
}
