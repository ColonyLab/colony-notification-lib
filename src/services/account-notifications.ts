import LocalStorage from './local-storage';
import { Notification } from './types/notification';
import { dateLimit } from './general-notifications';
import { filterAccountNotifications } from './filters/account-notifiactions';

/// Limiting this number increase performance
const limitForAccountNotifications = 20;

/// Notifications focused on a specific account
export default class AccountNotifications {
  account: string;
  notifications: Notification[];
  nextTimestamp: number; // used for simplified "next" pagination
  lastSyncTimestamp: number; // used for sync

  private constructor() {
    this.notifications = [];
  }

  // boolean is used for sync status
  public async syncNotifications(notifications: Notification[]): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const newNotifications = await filterAccountNotifications(
      this.account,
      notifications,
      limitForAccountNotifications,
    );

    // notifications are sorted by timestamp from newest to oldest
    this.notifications = newNotifications.concat(this.notifications);

    const added = newNotifications.length > 0;
    if (added) {
      this.lastSyncTimestamp = now;
    }

    return newNotifications.length > 0;
  }

  private async init(
    account: string,
    allNotifications: Notification[],
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    this.account = account;
    await this.syncNotifications(allNotifications);
    this.nextTimestamp = now;
  }

  // Factory method to create an instance of AccountNotifications
  public static async createInstance(
    account: string,
    allNotifications: Notification[],
  ): Promise<AccountNotifications> {
    const instance = new AccountNotifications();
    await instance.init(account, allNotifications);

    return instance;
  }

  public getNotifications(from: number, to: number): Notification[] {
    if (from === to || from > to)
      return [];

    return this.notifications.filter(n =>
      n.timestamp > from && n.timestamp <= to,
    );
  }

  public getNotificationsSince(timestamp: number) {
    return this.notifications.filter(n => n.timestamp > timestamp);
  }

  public getNotificationsTo(timestamp: number) {
    return this.notifications.filter(n => n.timestamp <= timestamp);
  }

  public getNextNotifications(limit: number): Notification[] {
    // oldest notification timestamp in this sesion
    const next = this.getNotificationsTo(this.nextTimestamp).slice(0, limit);

    if (next.length === 0) {
      this.nextTimestamp = dateLimit;
      return [];
    }

    // -1 becouse last notification was already loaded
    this.nextTimestamp = next[next.length - 1].timestamp - 1;

    // add timestamps to local storage
    LocalStorage.addNotificationTimestamps(
      this.account,
      next.map((n) => n.timestamp),
    );

    return next;
  }

  public resetNextNotifications() {
    this.nextTimestamp = Math.floor(Date.now() / 1000);
  }

  get unseenNotifications() {
    return this.notifications.filter(n => n.new).length;
  }
}


