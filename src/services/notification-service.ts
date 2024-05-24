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

  public async initAccount(account: string): Promise<void> {
    const accountNotifications = this.accounts.get(account);
    if (accountNotifications !== undefined) {
      throw new Error('Account already initialized');
    }

    await this.accounts.set(account, await AccountNotifications.createInstance(
      account,
      this.generalNotifications.getAllNotifications(),
    ));
  }

  public unseenNotifications(account: string): number {
    const accountNotifications = this.accounts.get(account);
    if (!accountNotifications) {
      throw new Error('Account not initialized');
    }

    return accountNotifications.unseenNotifications;
  }

  // Simplified pagination
  // @dev Get the next "youngest" notifications. Saves timestamp for the next call
  public getNextNotifications(account: string, limit: number): Notification[] {
    const accountNotifications = this.accounts.get(account);
    if (!accountNotifications) {
      throw new Error('Account not initialized');
    }

    const next = accountNotifications.getNextNotifications(limit)
      .map((n) => structuredClone(n)); // make a deep copy

    // mark original account notifications as read
    for (const n of accountNotifications.notifications) {
      if (next.map((nn) => nn.id).includes(n.id)) {
        n.new = false;
      }
    }

    return next;
  }

  // Reset the next notifications to the beginning
  public resetNextNotifications(account: string): void {
    const accountNotifications = this.accounts.get(account);
    if (!accountNotifications) {
      throw new Error('Account not initialized');
    }

    accountNotifications.resetNextNotifications();
  }

  public async syncAccountNotifications(account: string): Promise<boolean> {
    const accountNotifications = this.accounts.get(account);
    if (!accountNotifications) {
      throw new Error('Account not initialized');
    }

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
