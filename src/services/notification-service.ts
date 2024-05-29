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
    let accountNotifications = this.accounts.get(account);
    if (accountNotifications) {
      return accountNotifications;
    }

    accountNotifications = await AccountNotifications.createInstance(
      account,
      this.generalNotifications.getAllNotifications(),
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

  // Simplified pagination
  // @dev Get the next "youngest" notifications. Saves timestamp for the next call
  public async getNextNotifications(account: string, limit: number): Promise<Notification[]> {
    const accountNotifications = await this.updateAccount(account);
    return accountNotifications.getNextNotifications(limit);
  }

  // Reset the next notifications to the beginning
  public async resetNextNotifications(account: string): Promise<void> {
    const accountNotifications = await this.updateAccount(account);
    accountNotifications.resetNextNotifications();
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
