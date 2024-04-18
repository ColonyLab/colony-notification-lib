import { GraphQLClient, gql } from 'graphql-request';
import LocalStorage from './local-storage';
import EarlyStageService from './early-stage-service';

// TODO configuration
const SUBGRAPH_ENDPOINT = 'http://localhost:8000/subgraphs/name/colony/notifications';

const graphStakingClient = new GraphQLClient(SUBGRAPH_ENDPOINT);

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

const QUERY = gql`
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

// Fetch notifications from the subgraph older than given timestamp
export async function getAllNotifications (timestamp: number): Promise<Notification[]> {
  console.log("Fetching notifications older than:", timestamp);

  const data = await graphStakingClient.request<
    getNotificationsResult
  >
  (QUERY, {
    timestamp,
  }) as getNotificationsResult;

  return data.notifications;
}

// Filter notifications by eventType for a given account
// by checking investment details in the EarlyStageService,
async function filterAccountNotifications (account: string, notifications: Notification[]): Promise<Notification[]> {
  const accountNotifications = [];

  for (const notification of notifications) {
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

        case EventType.MovedToInvestmentCommittee: {
          const involved = await EarlyStageService.isAccountInvolved(
            notification.projectNest,
            account,
          );
          if (involved) {
            accountNotifications.push(notification);
          }
          break;
        }

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

        case EventType.AvailableOnPortfolio: {
          const involved = await EarlyStageService.isAccountInvolved(
            notification.projectNest,
            account,
          );
          if (involved) {
            accountNotifications.push(notification);
          }
          break;
        }

        case EventType.TgeAvailableNow: {
          const involved = await EarlyStageService.isAccountInvolved(
            notification.projectNest,
            account,
          );
          if (involved) {
            accountNotifications.push(notification);
          }
          break;
        }

        default:
          console.warn(`Unknown event type: ${notification.eventType}, skipping...`);
    }
  }

  console.log("Account notifications:", accountNotifications);
  return accountNotifications;
}

export async function getAccountNotifications (account: string): Promise<void> {
  console.log("Fetching notifications for account:", account);

  // Just for Testing // #TODO: Remove this
  LocalStorage.clearNotificationTimestamp(account);

  // get timestamp from local storage
  const timestamp = LocalStorage.getNotificationTimestamp(account);

  const notifications = await filterAccountNotifications(
    account,
    await getAllNotifications(timestamp),
  );
  console.log("Filtered Notifications:", notifications);

  // set timestamp to local storage
  LocalStorage.setNotificationTimestamp(account);

  return;
}
