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
  eventType: number
  additionalData: string
  content?: { // could be null
    id: string // dataURI
    content: string
  }
  eventMessage?: string // event message
}

interface getNotificationsResult {
  notifications: Notification[]
}

export default class NotificationService {
  graphClient: GraphQLClient;

  static GRAPH_QUERY = gql`
  query getNotifications($timestamp: Int!) {
    notifications(orderBy: timestamp, where: { timestamp_gte: $timestamp }) {
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

  // Fetch notifications from the subgraph older than given timestamp
  public async getAllNotifications (timestamp: number): Promise<Notification[]> {
    const date = new Date(timestamp * 1000);
    console.log("Fetching notifications older than:", date.toString(), ", timestamp:", timestamp);

    const data = await this.graphClient.request<
      getNotificationsResult
    >
    (NotificationService.GRAPH_QUERY, {
      timestamp,
    }) as getNotificationsResult;

    return data.notifications;
  }

  public async getAccountNotifications (account: string): Promise<Notification[]> {
    console.log("Fetching notifications for account:", account);

    // clear localStorage for testing
    // LocalStorage.clearNotificationTimestamp(account);

    // get timestamp from local storage
    const timestamp = LocalStorage.getNotificationTimestamp(account);

    const notifications = await NotificationService.filterAccountNotifications(
      account,
      await this.getAllNotifications(timestamp),
    );

    // set timestamp to local storage
    LocalStorage.setNotificationTimestamp(account);

    return notifications;
  }

  // Filter notifications by eventType for a given account
  public static async filterAccountNotifications (account: string, notifications: Notification[]): Promise<Notification[]> {
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
      console.log("Processing custom notification:", notification.content?.content);

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
      console.log(
        "Processing notification:", notification.eventType,
        ", for project:", notification.projectNest,
        ", and account:", account
      );

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

    return accountNotifications;
  }
}
