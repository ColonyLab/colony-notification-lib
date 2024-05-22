import LocalStorage from './local-storage';
import GeneralNotifications from './general-notifications';
import { Notification } from './types/notification';

import { filterAccountNotifications } from './filters/account-notifiactions';

export default class NotificationService {
  generalNotifications: GeneralNotifications;

  lastSyncTimestamp: number = 0;

  // map: oldest notification loaded for this account
  accountLastNotificationsTimestamp: Map<string, number> = new Map();

  private constructor(){}

  private async init(): Promise<any> {
    this.generalNotifications = await GeneralNotifications.createInstance();
    this.lastSyncTimestamp = Math.floor(Date.now() / 1000);
  }

  // Factory method to create an instance of NotificationService
  public static async createInstance(): Promise<NotificationService> {
    const instance = new NotificationService();
    await instance.init();

    return instance;
  }

  // Get the last "youngest" notifications for a given account
  // @dev Saves the oldest notification timestamp for the next call
  public async getAccountLastNotifications (account: string, limit: number): Promise<Notification[]> {
    // get timestamp from memory (oldest notification timestamp in this sesion)
    let timestamp = this.accountLastNotificationsTimestamp.get(account);
    if (!timestamp) {
      timestamp = Math.floor(Date.now() / 1000); // use now
    }

    const notifications = await filterAccountNotifications(
      account,
      await this.generalNotifications.getNotificationsTo(timestamp),
      limit,
    )

    if (notifications.length === 0) {
      this.accountLastNotificationsTimestamp.set(account, 0);
      return [];
    }

    this.accountLastNotificationsTimestamp.set(
      account,
      notifications[notifications.length - 1].timestamp
    );

    return notifications;
  }

  public resetAccountLastNotifications (account: string) {
    this.accountLastNotificationsTimestamp.delete(account);
  }

  public async syncAccountNotifications (account: string): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const result = await this.generalNotifications.syncNotifications();
    if (result === false) {
      return false;
    }

    const notifications = this.generalNotifications.getNotifications(this.lastSyncTimestamp, now);
    const accountNotifications = await filterAccountNotifications(account, notifications);

    if (accountNotifications.length === 0) {
      return false;
    }

    // update lastSyncTimestamp
    this.lastSyncTimestamp = now;

    return true;
  }

  /// Set notification timestamp to current time which is used to fetch new notifications
  public setNotificationTimestamp (account: string) {
    // use current timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // set timestamp to local storage
    LocalStorage.setNotificationTimestamp(account, timestamp);
  }
}
