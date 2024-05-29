import GraphService from './graph-service';
import GeneralNotifications from './general-notifications';
import AccountNotifications from './account-notifications';
import { Notification } from './types/notification';

/// Notification Service
export default class NotificationService {
  private generalNotifications: GeneralNotifications;
  private accounts: Map<string, AccountNotifications> = new Map();

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

  private async updateAccount(account: string): Promise<AccountNotifications> {
    account = account.toLowerCase(); // normalize account

    let accountNotifications = this.accounts.get(account);
    if (accountNotifications) {
      return accountNotifications;
    }

    // update account info about first stake
    const firstStakeTimestamp = await GraphService.fetchAccountFirstStakeTimestamp(account);

    let notifications: Notification[] = [];
    if (firstStakeTimestamp) { // could be null for new accounts
      notifications = this.generalNotifications.getNotificationsSince(firstStakeTimestamp);
    }

    accountNotifications = await AccountNotifications.createInstance(
      account,
      notifications,
    );

    await this.accounts.set(account, accountNotifications);
    return accountNotifications;
  }

  public async unreadNotificationsNumber(account: string): Promise<number> {
    const accountNotifications = await this.updateAccount(account);
    return accountNotifications.unreadNotificationsNumber;
  }

  public async markAccountNotificationsAsRead(account: string, timestamp: number): Promise<void> {
    const accountNotifications = await this.updateAccount(account);
    accountNotifications.markNotificationsAsRead(timestamp);
  }

  public async markAllAccountNotificationsAsRead(account: string): Promise<void> {
    const accountNotifications = await this.updateAccount(account);
    accountNotifications.markAllNotificationsAsRead();
  }

  public async getAccountNotifications(account: string, limit: number, offset: number): Promise<Notification[]> {
    const accountNotifications = await this.updateAccount(account);
    return accountNotifications.getNotificationsPaginated(limit, offset);
  }

  public async getAccountNotificationsLength(account: string): Promise<number> {
    const accountNotifications = await this.updateAccount(account);
    return accountNotifications.getNotificationsLength();
  }

  public async syncAccountNotifications(account: string): Promise<boolean> {
    const accountNotifications = await this.updateAccount(account);

    const now = Math.floor(Date.now() / 1000);
    const result = await this.generalNotifications.syncNotifications();
    if (result === false) {
      return false;
    }

    // get all notifications from the last general sync
    const notifications = this.generalNotifications.getNotifications(
      accountNotifications.lastSyncTimestamp,
      now,
    );

    return accountNotifications.syncNotifications(notifications);
  }
}
