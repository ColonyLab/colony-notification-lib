import { GraphQLClient, gql } from 'graphql-request';
import Config from './config';
import LocalStorage from './local-storage';
import EarlyStageService from './early-stage-service';
import { graphql } from 'graphql';
import { EventType, mapEventType } from './types/eventType';

export interface Notification {
  id: string
  timestamp: number
  projectNest: string
  projectName?: string
  eventType: number
  additionalData: string
  content?: { // could be null
    id: string // dataURI
    content: string
  }
  eventMessage?: string // event message
  new?: boolean // true for new notification, false for past notification
}

interface getNotificationsResult {
  notifications: Notification[]
}

export default class NotificationService {
  graphClient: GraphQLClient;

  // map account to the oldest last get notification timestamp
  oldestLastNotificationTimestamp: Map<string, number> = new Map();

  // order decresing

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

  constructor() {
    this.graphClient = new GraphQLClient(Config.getConfig(
      'GRAPH_NOTIFICATIONS_URL',
    ));
  }

  // Fetch notifications from the subgraph
  public async getRawNotifications(from: number, to: number): Promise<Notification[]> {
    const fromDate = new Date(from * 1000);
    const toDate = new Date(to * 1000);

    // console.log("Fetching notifications from:", fromDate.toString(), ", to:", toDate.toString());

    const data = await this.graphClient.request<
      getNotificationsResult
    >
    (NotificationService.GRAPH_QUERY, {
      from,
      to
    }) as getNotificationsResult;

    return data.notifications;
  }

  // Fetch notifications from the subgraph since the given timestamp
  public async getRawNotificationsSince (timestamp: number): Promise<Notification[]> {
    const now = Math.floor(Date.now() / 1000);
    return this.getRawNotifications(timestamp, now);
  }

  public async getAccountNewNotifications (account: string): Promise<Notification[]> {
    // clear localStorage for testing
    // LocalStorage.clearNotificationTimestamp(account);

    // get timestamp from local storage
    const timestamp = LocalStorage.getNotificationTimestamp(account);

    const notifications = await NotificationService.filterAccountNotifications(
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
      // use now
      timestamp = Math.floor(Date.now() / 1000);
    }

    const notifications = [] as Notification[];
    const month = 30 * 7 * 24 * 60 * 60; // 1 month in seconds
    const dateLimit = Date.UTC(2024,1,1) / 1000; // 1 Jan 2024

    let i = 0;
    let pastTimestamp = timestamp - month;

    while (notifications.length < limit) {
      const pastNotifications = await NotificationService.filterAccountNotifications(
        account,
        await this.getRawNotifications(pastTimestamp, timestamp),
      );

      if (pastNotifications.length < limit) {
        // if timestamp less tham 1 April 2024, break
        if (pastTimestamp < dateLimit) {
          // add all notifications to the list
          notifications.push(...pastNotifications);
          this.oldestLastNotificationTimestamp.set(account, dateLimit);
          break;
        }

        pastTimestamp -= month * 2**i; // month, 2 months, 4 months, 8 months, ...
        i++;
        continue;
      }

      // add past notifications to the list, only to the limit
      notifications.push(...pastNotifications.slice(0, limit));

      // save the oldest (last) notification timestamp
      this.oldestLastNotificationTimestamp.set(
        account,
        notifications[notifications.length - 1].timestamp
      );
    }
    return notifications;
  }

  public resetAccountLastNotifications (account: string) {
    this.oldestLastNotificationTimestamp.delete(account);
  }

  /// Set notification timestamp to current time which is used to fetch new notifications
  public setNotificationTimestamp (account: string) {
    // set timestamp to local storage
    LocalStorage.setNotificationTimestamp(account);
  }

  // Filter notifications by eventType for a given account
  public static async filterAccountNotifications (
    account: string,
    notifications: Notification[]
  ): Promise<Notification[]> {
    const accountNotifications = [];

    // Helper function to check if account is involved
    const involved = async (notification: Notification): Promise<boolean> => {
      return EarlyStageService.isAccountInvolved(
        notification.projectNest,
        account,
      );
    };

    // Helper function to check if account has allocation
    const hasAllocation = async (notification: Notification): Promise<boolean> => {
      const allocation = await EarlyStageService.accountAllocation(
        notification.projectNest,
        account,
      );
      return allocation > 0
    };

    // Helper function to check if account has overinvestment
    const hasOverinvestment = async (notification: Notification): Promise<boolean> => {
      const overinvestment = await EarlyStageService.accountOverinvestment(
        notification.projectNest,
        account,
      );
      return overinvestment > 0
    };

    // Helper function to push custom notification
    const pushCustomNotification = async (notification: Notification) => {
      // dbg
      // console.log("Processing custom notification:", notification.content?.content);

      // update eventString based on IFPS content, if available
      if (!notification.content) {
        return // skip notification with null content
      }

      notification.eventMessage = mapEventType(notification.eventType, {
        customMessage: notification.content.content,
      });

      // if projectNest is zero address, it is a global notification
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      if (notification.projectNest === zeroAddress) {
        accountNotifications.push(notification);
        return;
      }

      const exist = await EarlyStageService.projectExist(notification.projectNest);
      if (!exist) {
        return // skip if project does not exist
      }

      if (await involved(notification)) {
        accountNotifications.push(notification);
      }
    };

    for (const notification of notifications) {
      // dbg
      // console.log(
      //   "Processing notification:", notification.eventType,
      //   ", for project:", notification.projectNest,
      //   ", and account:", account
      // );

      switch (notification.eventType) {
          case EventType.NewProjectOnDealFlow:
            notification.eventMessage = mapEventType(notification.eventType);
            accountNotifications.push(notification);
            break;

          case EventType.NestIsOpen:
            notification.eventMessage = mapEventType(notification.eventType);
            accountNotifications.push(notification);
            break;

          // additional check if account has any allocation in the project
          case EventType.MovedToAnalysis: {
            if (await hasAllocation(notification)) {
              notification.eventMessage = mapEventType(notification.eventType);
              accountNotifications.push(notification);
            }
            break;
          }

          // additional check if account was involved in the project
          case EventType.MovedToInvestmentCommittee:
            if (await involved(notification)) {
              notification.eventMessage = mapEventType(notification.eventType);
              accountNotifications.push(notification);
            }
            break;

          // additional check if account has overinvestment to claim in the project
          case EventType.ClaimUsdcExcess: {
            if (await hasOverinvestment(notification)) {
              notification.eventMessage = mapEventType(notification.eventType);
              accountNotifications.push(notification);
            }
            break;
          }

          // additional check if account was involved in the project
          // add token symbol to the event message from additionalData
          case EventType.AvailableOnPortfolio:
            if (await involved(notification)) {
              notification.eventMessage = mapEventType(notification.eventType, {
                ceTokenSymbol: JSON.parse(notification.additionalData).ceToken.symbol,
              });
              accountNotifications.push(notification);
            }
            break;

          // additional check if account was involved in the project
          case EventType.TgeAvailableNow:
            if (await involved(notification)) {
              notification.eventMessage = mapEventType(notification.eventType);
              accountNotifications.push(notification);
            }
            break;

          // additional check if account was involved in the project
          // add action timestamp to the event message
          case EventType.CountdownSet:
            if (await involved(notification)) {
              notification.eventMessage = mapEventType(notification.eventType, {
                actionTimestamp: notification.timestamp,
              });
              accountNotifications.push(notification);
            }
            break;

          case EventType.CountdownHidden:
            break; // skip

          // custom notification require more logic
          case EventType.CustomNotification: {
            await pushCustomNotification(notification);
            break;
          }

          default:
            console.warn(`Unknown event type: ${notification.eventType}, skipping...`);
      }
    }

    // remove not needed content field
    for (const notification of accountNotifications) {
      delete notification.content;
    }

    // determine "new" notifications
    const timestamp = LocalStorage.getNotificationTimestamp(account);
    for (const notification of accountNotifications) {
      notification.new = notification.timestamp > timestamp;
    }

    return accountNotifications;
  }
}
