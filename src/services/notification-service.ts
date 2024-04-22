import { GraphQLClient, gql } from 'graphql-request';
import Config, { Environment } from './config';
import LocalStorage from './local-storage';
import EarlyStageService from './early-stage-service';
import { graphql } from 'graphql';

export enum EventType {
  NewProjectOnDealFlow,
  NestIsOpen,
  MovedToAnalysis,
  MovedToInvestmentCommittee,
  ClaimUsdcExcess,
  AvailableOnPortfolio,
  TgeAvailableNow,
}

interface Notification {
  id: string
  timestamp: number
  projectNest: string
  eventType: number
  eventTypeString: string
  additionalData: string
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
      eventTypeString
      additionalData
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

    // Just for Testing // #TODO: Remove this
    LocalStorage.clearNotificationTimestamp(account);

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
  // by checking investment details in the EarlyStageService,
  public static async filterAccountNotifications (account: string, notifications: Notification[]): Promise<Notification[]> {
    const accountNotifications = [];

    // Helper function to push notification if account is involved
    const pushIfInvolved = async (notification: Notification) => {
      const involved = await EarlyStageService.isAccountInvolved(
        notification.projectNest,
        account,
      );
      if (involved) {
        accountNotifications.push(notification);
      }
    };

    for (const notification of notifications) {
      console.log(
        "Processing notification:", notification.eventTypeString,
        ", for project:", notification.projectNest,
        ", and account:", account
      );

      switch (notification.eventType) {
          case EventType.NewProjectOnDealFlow:
            accountNotifications.push(notification);
            break;

          case EventType.NestIsOpen:
            accountNotifications.push(notification);
            break;

          case EventType.MovedToAnalysis: {
            const allocation = await EarlyStageService.accountAllocation(
              notification.projectNest,
              account,
            );
            if (allocation > 0) {
              accountNotifications.push(notification);
            }
            break;
          }

          case EventType.MovedToInvestmentCommittee:
            await pushIfInvolved(notification);
            break;

          case EventType.ClaimUsdcExcess: {
            const overinvestment = await EarlyStageService.accountOverinvestment(
              notification.projectNest,
              account,
            );
            if (overinvestment > 0) {
              accountNotifications.push(notification);
            }
            break;
          }

          case EventType.AvailableOnPortfolio:
            await pushIfInvolved(notification);
            break;

          case EventType.TgeAvailableNow: {
            await pushIfInvolved(notification);
            break;
          }

          default:
            console.warn(`Unknown event type: ${notification.eventType}, skipping...`);
      }
    }

    return accountNotifications;
  }
}
