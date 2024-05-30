import LocalStorage from './local-storage';
import GeneralNotifications from './general-notifications';
import GraphService from './graph-service';
import { Notification } from './types/notification';
import { filterAccountNotifications } from './filters/account-notifiactions';

/// Limiting number of all notifications for an account
const limitForAccountNotifications = 500;

/// Mark notifications older than 10 days as read
const markAsReadLimit = 10 * 24 * 3600;

const syncInterval = 60; // 1 minute

/// Notifications Stream created for a specific account
export default class NotificationStream {
  // --- state ---

  private generalNotifications: GeneralNotifications;
  private notifications: Notification[];

  private account: string;
  private firstStakeTimestamp: number | null;

  private pageSize: number;
  private loadSize: number; // pageSize * loadMore + new synced notifications

  private notificationsHook: (notifications: Notification[]) => void;
  private lastSyncTimestamp: number; // used for sync
  private syncIntervalId: NodeJS.Timeout | null = null;

  // --- initialization ---

  constructor() {
    this.notifications = [];
    this.lastSyncTimestamp = 0;
  }

  private async setupAccount(account: string): Promise<void> {
    this.account = account.toLowerCase();

    // update account info about first stake in the GraphService
    this.firstStakeTimestamp = await GraphService.fetchAccountFirstStakeTimestamp(
      this.account,
    );
  }

  // main sync method for the initial sync and for the next syncs
  // return new notifications
  private async syncNotifications(): Promise<Notification[]> {
    const now = Math.floor(Date.now() / 1000);

    if (this.lastSyncTimestamp === 0 && this.firstStakeTimestamp) {
      this.lastSyncTimestamp = this.firstStakeTimestamp; // first sync
    }

    const notifications = this.generalNotifications.getNotificationsSince(this.lastSyncTimestamp);

    // update account nests in the GraphService
    await GraphService.fetchAccountNests(this.account);

    const newNotifications = await filterAccountNotifications(
      this.account,
      notifications,
      limitForAccountNotifications,
    );

    // notifications are sorted by timestamp from newest to oldest
    this.notifications = newNotifications
      .concat(this.notifications)
      .slice(0, limitForAccountNotifications);

    // mark old notifications as read
    this.markNotificationsAsReadTo(now - markAsReadLimit);

    const added = newNotifications.length > 0;
    if (added) {
      this.lastSyncTimestamp = now;
    }

    return newNotifications;
  }

  private async init(
    generalNotifications: GeneralNotifications,
    account: string,
    pageSize: number,
    notificationsHook: (notifications: Notification[]) => void,
  ): Promise<void> {
    this.generalNotifications = generalNotifications;
    this.pageSize = pageSize;
    this.notificationsHook = notificationsHook;

    this.reset(pageSize);
    await this.setupAccount(account);
    await this.syncNotifications();

    this.setupSyncInterval();
  }

  // Factory method to create an instance of NotificationStream
  public static async createStream(
    generalNotifications: GeneralNotifications,
    account: string,
    pageSize: number,
    notificationsHook: (notifications: Notification[]) => void,
  ): Promise<NotificationStream> {

    const instance = new NotificationStream();
    await instance.init(
      generalNotifications,
      account,
      pageSize,
      notificationsHook,
    );

    return instance;
  }

  // --- get notifications (by hook) ---

  public loadMore() {
    this.loadSize += this.pageSize;
    this.notificationsHook(this.notifications.slice(0, this.loadSize));
  }

  public reset(pageSize?: number) {
    if (pageSize) {
      this.pageSize = pageSize;
    }
    this.loadSize = 0;
  }

  public getNotificationsLength(): number {
    return this.notifications.length;
  }

  // --- unread notifications ---

  get unreadNotificationsNumber() {
    return this.notifications.filter(n => n.isUnread).length;
  }

  private updateReadStatusAndLocalStorage(timestamps: number[]): void {
    this.notifications.forEach(n => {
      if (timestamps.includes(n.timestamp)) {
        n.isUnread = false;
      }
    });

    LocalStorage.addNotificationTimestamps(this.account, timestamps);
  }

  // timestamp is used to mark isUnread status for a single notification
  public markNotificationAsRead(timestamp: number): void {
    this.updateReadStatusAndLocalStorage([timestamp]);
  }

  public markAllNotificationsAsRead(): void {
    const allTimestamps = this.notifications.map(n => n.timestamp);
    this.updateReadStatusAndLocalStorage(allTimestamps);
  }

  public markNotificationsAsReadTo(timestamp: number): void {
    const timestampsToMark = this.notifications
      .filter(n => n.timestamp <= timestamp)
      .map(n => n.timestamp);
    this.updateReadStatusAndLocalStorage(timestampsToMark);
  }

  // --- syncing ---

  private setupSyncInterval(): void {
    // Set up interval to sync notifications every minute
    this.clearSyncInterval(); // Ensure any existing interval is cleared before setting a new one
    this.syncIntervalId = setInterval(async () => {
      const result = await this.generalNotifications.syncNotifications();
      if (result === false) {
        return; // no new general notifications
      }

      const newNotifications = await this.syncNotifications();
      if (newNotifications.length > 0) {
        this.loadSize += newNotifications.length;
        this.notificationsHook(this.notifications.slice(0, this.loadSize));
      }
    }, syncInterval * 1000); // seconds -> milliseconds
  }

  private clearSyncInterval(): void {
    if (this.syncIntervalId !== null) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  // Call this method when you need to stop the syncing, e.g., when the component unmounts
  public stopSyncing(): void {
    this.clearSyncInterval();
  }
}
