import { GraphQLClient, gql } from 'graphql-request';
import Config from './config';
import LocalStorage from './local-storage';
import EarlyStageService from './early-stage-service';
import { graphql } from 'graphql';
import { Notification, getNotificationsResult } from './types/notification';
import { filterAccountNotifications } from './filters/account-notifiactions';
import { filterEventMessage } from './filters/event-message';

const dateLimit = Date.UTC(2024,1,1) / 1000; // 1 Jan 2024

export default class NotificationService {
  graphClient: GraphQLClient;

  // notification cache
  notificationCache: Notification[] = [];

  // map account to the oldest last get notification timestamp
  oldestLastNotificationTimestamp: Map<string, number> = new Map();

  static GRAPH_QUERY = gql`
  query getNotifications($from: Int!, $to: Int!) {
    notifications(orderBy: timestamp, orderDirection: desc, where: {
      timestamp_gte: $from,
      timestamp_lt: $to
    }) {
      id
      timestamp
      projectNest
      eventType
      additionalData
      content {
        id
        content
      }
    }
  }
  `;

  private constructor(){
    this.graphClient = new GraphQLClient(Config.getConfig(
      'GRAPH_NOTIFICATIONS_URL',
    ));
  }

  private async init(): Promise<any> {
    const rawNotifications = await this.fetchRawNotifications();
    const notifications = await filterEventMessage(await rawNotifications);

    this.notificationCache = notifications;
  }

  // Factory method to create an instance of NotificationService
  public static async createInstance(): Promise<NotificationService> {
    const instance = new NotificationService();
    await instance.init();

    return instance;
  }

  // Fetch notifications from the subgraph
  async fetchRawNotifications(): Promise<Notification[]> {
    const from = dateLimit;
    const to = Math.floor(Date.now() / 1000);

    console.log("Fetching notifications from:", from.toString(), "to:", to.toString());

    const data = await this.graphClient.request<
      getNotificationsResult
    >
    (NotificationService.GRAPH_QUERY, {
      from,
      to
    }) as getNotificationsResult;

    console.log("Notifications fetched:", data.notifications.length);

    return data.notifications;
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

  public async getAccountNewNotifications (account: string): Promise<Notification[]> {
    const timestamp = LocalStorage.getNotificationTimestamp(account);

    const notifications = await filterAccountNotifications(
      account,
      await this.getRawNotificationsSince(timestamp),
    );

    return notifications;
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
