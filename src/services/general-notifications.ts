import { GraphQLClient } from 'graphql-request';
import Config from './config';
import EarlyStageService from './early-stage-service';
import { Notification } from './types/notification';
import { FETCH_NOTIFICATIONS_QUERY, FetchNotificationsResult } from './types/graph-queries';

import { filterEventMessage } from './filters/event-message';
import { filterProjectsNames } from './filters/project-name';

export const dateLimit = Date.UTC(2024,1,1) / 1000; // 1 Jan 2024

/// Fetches and handles notifications not related to a specific account
export default class GeneralNotifications {
  private graphClient: GraphQLClient;
  private earlyStageService: EarlyStageService;

  // notifications cache
  private notificationsCache: Notification[] = [];
  private lastSyncTimestamp: number = 0;

  private constructor(){
    this.graphClient = new GraphQLClient(Config.getConfig(
      'GRAPH_NOTIFICATIONS_URL',
    ));

    this.earlyStageService = new EarlyStageService();
  }

  private async filterRawNotifications(notifications: Notification[]): Promise<Notification[]> {
    try {
      // unique projects
      const projects = Array.from(new Set(notifications.map(n => n.projectNest)));
      await this.earlyStageService.fetchProjectNames(projects); // fetch project names

      notifications = await filterEventMessage(await notifications);
      notifications = await filterProjectsNames(await notifications);

      return notifications;
    } catch (error) {
      console.warn("Failed to filter notifications:", error);
      return [];
    }
  }

  private async init(): Promise<void> {
    const from = dateLimit;
    const to = Math.floor(Date.now() / 1000);

      const raw = await this.fetchRawNotifications(from, to);

      this.notificationsCache = await this.filterRawNotifications(raw);
      this.lastSyncTimestamp = to;
  }

  // Factory method to create an instance of GeneralNotifications
  public static async createInstance(): Promise<GeneralNotifications> {
    const instance = new GeneralNotifications();
    await instance.init();

    return instance;
  }

  // Fetch notifications from the subgraph
  private async fetchRawNotifications(from: number, to: number): Promise<Notification[]> {
    // console.log("Fetching notifications from:", from, "to:", to);

    try {
      const data = await this.graphClient.request<
        FetchNotificationsResult
      >
      (FETCH_NOTIFICATIONS_QUERY, {
        from,
        to,
      }) as FetchNotificationsResult;

      return data.notifications;

    } catch (error) {
      console.warn("Failed to fetch notifications:", error);
      return [];
    }
  }

  private async fetchNewRawNotifications(): Promise<Notification[]> {
    const to = Math.floor(Date.now() / 1000);

    // console.log("Fetching new notifications from:", this.lastSyncTimestamp, "to:", to.toString());
    return this.fetchRawNotifications(this.lastSyncTimestamp, to);
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
