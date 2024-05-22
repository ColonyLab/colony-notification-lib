import { GraphQLClient, gql } from 'graphql-request';
import Config from './config';
import LocalStorage from './local-storage';
import EarlyStageService from './early-stage-service';
import { graphql } from 'graphql';
import { Notification } from './types/notification';
import { FETCH_NOTIFICATIONS_QUERY, FetchNotificationsResult } from './types/graph-queries';

import { filterAccountNotifications } from './filters/account-notifiactions';
import { filterEventMessage } from './filters/event-message';
import { filterProjectsNames } from './filters/project-name';

const dateLimit = Date.UTC(2024,1,1) / 1000; // 1 Jan 2024

export default class NotificationService {
  graphClient: GraphQLClient;
  earlyStageService: EarlyStageService;

  // notification cache
  notificationCache: Notification[] = [];

  // map account to the oldest last get notification timestamp
  oldestLastNotificationTimestamp: Map<string, number> = new Map();

  private constructor(){
    this.graphClient = new GraphQLClient(Config.getConfig(
      'GRAPH_NOTIFICATIONS_URL',
    ));

    this.earlyStageService = new EarlyStageService();
  }

  private async filterRawNotifications(notifications: Notification[]): Promise<Notification[]> {
    const projects = Array.from(new Set(notifications.map(n => n.projectNest))); // unique projects
    await this.earlyStageService.fetchProjectNames(projects); // fetch project names

    notifications = await filterEventMessage(await notifications);
    notifications = await filterProjectsNames(await notifications);

    return notifications;
  }

  private async init(): Promise<any> {
    const from = dateLimit;
    const to = Math.floor(Date.now() / 1000);
    const raw = await this.fetchRawNotifications(from, to);

    this.notificationCache = await this.filterRawNotifications(raw);
  }

  // Factory method to create an instance of NotificationService
  public static async createInstance(): Promise<NotificationService> {
    const instance = new NotificationService();
    await instance.init();

    return instance;
  }

  // Fetch notifications from the subgraph
  async fetchRawNotifications(from: number, to: number): Promise<Notification[]> {
    console.log("Fetching notifications from:", from, "to:", to);

    const data = await this.graphClient.request<
      FetchNotificationsResult
    >
    (FETCH_NOTIFICATIONS_QUERY, {
      from,
      to
    }) as FetchNotificationsResult;

    console.log("Notifications fetched:", data.notifications.length);

    return data.notifications;
  }

  async fetchNewRawNotifications(): Promise<Notification[]> {
    if (this.notificationCache.length === 0) {
      return [];
    }
    const from = this.notificationCache[0].timestamp // newest saved notification timestamp
    const to = Math.floor(Date.now() / 1000);

    console.log("Fetching new notifications from:", from.toString(), "to:", to.toString());
    return this.fetchRawNotifications(from, to);
  }

  // Get notifications from the memory cache
  public async getRawNotifications(from: number, to: number): Promise<Notification[]> {
    if (from === to || from > to)
      return [];

    const notifications: Notification[] = [];

    for (const notification of this.notificationCache) {
      if (notification.timestamp >= from && notification.timestamp < to) {
        notifications.push(notification);
      }
    }
    const fromDate = new Date(from * 1000);
    const toDate = new Date(to * 1000);

    return notifications;
  }

  // Gets notifications from the memory cache - since the given timestamp
  public async getRawNotificationsSince (timestamp: number): Promise<Notification[]> {
    const now = Math.floor(Date.now() / 1000);
    return this.getRawNotifications(timestamp, now);
  }

  // Gets all notifications from the memory cache
  public async getAllRawNotifications(): Promise<Notification[]> {
    return this.notificationCache;
  }

  public async syncAccountNotifications (account: string): Promise<boolean> {
    const raw = await this.fetchNewRawNotifications();
    if (raw.length === 0) {
      return false;
    }

    const filtered = await this.filterRawNotifications(raw);
    if (raw.length === 0) {
      return false;
    }

    const accountNotifications = await filterAccountNotifications(
      account,
      filtered,
    );

    if (accountNotifications.length === 0) {
      return false;
    }

    // apply new filtered notifications at the beginning of the cache
    this.notificationCache = filtered.concat(this.notificationCache);

    this.resetAccountLastNotifications(account);

    return true;
  }

  // Get the last "youngest" notifications for a given account
  // @dev Saves the oldest notification timestamp for the next call
  public async getAccountLastNotifications (account: string, limit: number): Promise<Notification[]> {
    // get timestamp from memory (oldest notification timestamp in this sesion)
    let timestamp = this.oldestLastNotificationTimestamp.get(account);
    if (!timestamp) {
      timestamp = Math.floor(Date.now() / 1000); // use now
    }

    const notifications = await filterAccountNotifications(
      account,
      await this.getRawNotifications(dateLimit, timestamp),
      limit,
    )

    if (notifications.length === 0) {
      this.oldestLastNotificationTimestamp.set(account, dateLimit);
      return [];
    }

    this.oldestLastNotificationTimestamp.set(
      account,
      notifications[notifications.length - 1].timestamp
    );

    return notifications;
  }

  public resetAccountLastNotifications (account: string) {
    this.oldestLastNotificationTimestamp.delete(account);
  }

  /// Set notification timestamp to current time which is used to fetch new notifications
  public setNotificationTimestamp (account: string) {
    // use current timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // set timestamp to local storage
    LocalStorage.setNotificationTimestamp(account, timestamp);
  }
}
