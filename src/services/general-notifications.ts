import GraphService from './graph-service';
import { RawNotification, Notification, fromRawNotifications } from './types/notification';

export const dateLimit = Date.UTC(2024,1,1) / 1000; // 1 Jan 2024

/// Fetches and handles notifications not related to a specific account
export default class GeneralNotifications {
  private notificationsCache: Notification[] = []; // notifications cache
  private lastSyncTimestamp: number = 0;

  private constructor(){}

  private async filterRawNotifications(raw: RawNotification[]): Promise<Notification[]> {
    try {
      // unique projects
      const projects = Array.from(new Set(raw.map(n => n.projectNest)));
      await GraphService.fetchProjectData(projects); // fetch project names and logos

      return fromRawNotifications(raw);
    } catch (error) {
      console.warn("Failed to filter notifications:", error);
      return [];
    }
  }

  private async init(): Promise<void> {
    const from = dateLimit;
    const to = Math.floor(Date.now() / 1000);

      const raw = await GraphService.fetchRawNotifications(from, to);

      this.notificationsCache = await this.filterRawNotifications(raw);
      this.lastSyncTimestamp = to;
  }

  // Factory method to create an instance of GeneralNotifications
  public static async createInstance(): Promise<GeneralNotifications> {
    const instance = new GeneralNotifications();
    await instance.init();

    return instance;
  }

  private async fetchNewRawNotifications(): Promise<RawNotification[]> {
    const to = Math.floor(Date.now() / 1000);

    // console.log("Fetching new notifications from:", this.lastSyncTimestamp, "to:", to.toString());
    return GraphService.fetchRawNotifications(this.lastSyncTimestamp, to);
  }

  // Get notifications from the memory cache
  public getNotifications(from: number, to: number): Notification[] {
    if (from === to || from > to)
      return [];

    return this.notificationsCache.filter(n =>
      n.timestamp > from && n.timestamp <= to,
    );
  }

  // Gets notifications from the memory cache - since the given timestamp
  public getNotificationsSince(since: number): Notification[] {
    const now = Math.floor(Date.now() / 1000);
    return this.getNotifications(since, now);
  }

  // Gets notifications from the memory cache - to the given timestamp
  public getNotificationsTo(to: number): Notification[] {
    return this.getNotifications(dateLimit, to);
  }

  // Gets all notifications from the memory cache
  public getAllNotifications(): Notification[] {
    return this.notificationsCache;
  }

  // true if there are new notifications
  public async syncNotifications(): Promise<boolean> {
    const raw = await this.fetchNewRawNotifications();
    if (raw.length === 0) {
      return false;
    }

    const filtered = await this.filterRawNotifications(raw);
    if (filtered.length === 0) {
      return false;
    }

    // apply new filtered notifications at the beginning of the cache
    this.notificationsCache = filtered.concat(this.notificationsCache);
    this.lastSyncTimestamp = filtered[0].timestamp;

    return true;
  }
}
