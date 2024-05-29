import Config from './config';
import { GraphQLClient } from 'graphql-request';
import { RawNotification } from './types/notification';
import * as GraphQueries from './types/graph-queries';

// this simple cache is used to reduce the number of calls to the blockchain
const memCache = {
  projectName: new Map<string, string>(),
  projectLogo: new Map<string, string>(),

  // use projectNest + account as the key
  accountInvolved: new Map<string, boolean>(),
  accountFirstStakeTimestamp: new Map<string, number>(),
};

export default class GraphService {
  static NotificationsClient(): GraphQLClient {
    return new GraphQLClient(Config.getConfig(
      'GRAPH_NOTIFICATIONS_URL',
    ));
  }

  static EarlyStageClient(): GraphQLClient {
    return new GraphQLClient(Config.getConfig(
      'GRAPH_EARLYSTAGE_URL',
    ));
  }

  static StakingV3Client(): GraphQLClient {
    return new GraphQLClient(Config.getConfig(
      'GRAPH_STAKING_V3_URL',
    ));
  }

  // Fetch notifications from the subgraph (dont save them in the cache)
  static async fetchRawNotifications(from: number, to: number): Promise<RawNotification[]> {
    // console.log("Fetching notifications from:", from, "to:", to);

    try {
      const data = await GraphService.NotificationsClient().request<
        GraphQueries.FetchNotificationsResult
      >
      (GraphQueries.FETCH_NOTIFICATIONS_QUERY, {
        from,
        to,
      }) as GraphQueries.FetchNotificationsResult;

      return data.notifications;

    } catch (error) {
      console.warn("Failed to fetch notifications:", error);
      return [];
    }
  }

  // Fetch names from the subgraph
  static async fetchProjectData(projects: string[]): Promise<void> {
    // console.log("Fetching projects names for:", projects.length, "projects");

    if (projects.length === 0) {
      return;
    }

    projects = projects.map((p) => p.toLowerCase());

    const data = await GraphService.EarlyStageClient().request<
      GraphQueries.FetchProjectsDataResult
    >
    (GraphQueries.FETCH_PROJECTS_DATA_QUERY, {
      projects,
    }) as GraphQueries.FetchProjectsDataResult;

    for (const project of data.projects) {
      memCache.projectName.set(project.id, project.name);
      memCache.projectLogo.set(project.id, project.logo);
    }
  }

  static async fetchAccountNests(account: string): Promise<void> {
    account = account.toLowerCase();
    // console.log(`Fetching account ${account} nests`);

    const data = await GraphService.EarlyStageClient().request<
      GraphQueries.FetchAccountNestsResult
    >
    (GraphQueries.FETCH_ACCOUNT_NESTS, {
      account,
    }) as GraphQueries.FetchAccountNestsResult;

    if (!data.account) {
      return;
    }

    // Fill the cache with the account nests
    for (const antAllocation of data.account.antAllocations) {
      const projectNest = antAllocation.project.id;
      const involved = true;

      memCache.accountInvolved.set(projectNest + account, involved);
    }
  }

  static async fetchAccountFirstStakeTimestamp(account: string): Promise<number | null> {
    account = account.toLowerCase();
    // console.log(`Fetching account ${account} first stake timestamp`);


    const data = await GraphService.StakingV3Client().request<
      GraphQueries.FetchAccountFirstStakeTimestampResult
    >
    (GraphQueries.FETCH_ACCOUNT_FIRST_STAKE_TIMESTAMP, {
      account,
    }) as GraphQueries.FetchAccountFirstStakeTimestampResult;

    if (!data.stakeAddedEvents || data.stakeAddedEvents.length === 0) {
      return null;
    }

    // Fill the cache with the account stake timestamp
    memCache.accountFirstStakeTimestamp.set(account, data.stakeAddedEvents[0].createdAt);

    return GraphService.accountFirstStakeTimestamp(account);
  }

  // ---- Cache

  static projectName(projectNest: string): string | null {
    projectNest = projectNest.toLowerCase();
    if (!memCache.projectName.has(projectNest)) {
      return null;
    }

    return memCache.projectName.get(projectNest)!;
  }

  static projectLogo(projectNest: string): string | null {
    projectNest = projectNest.toLowerCase();
    if (!memCache.projectLogo.has(projectNest)) {
      return null;
    }

    return memCache.projectLogo.get(projectNest)!;
  }

  // Checks if the account was involved in ProjectNest by using the maxValue.
  // @returns {boolean} - The function returns true if the maxValue in given Nest is greater than 0
  static isAccountInvolved(projectNest: string, account: string): boolean {
    projectNest = projectNest.toLowerCase();
    account = account.toLowerCase();

    if (memCache.accountInvolved.has(projectNest + account)) {
      return memCache.accountInvolved.get(projectNest + account)!;
    }
    return false;
  }

  // Returns the first stake timestamp for the accountInvolved
  static accountFirstStakeTimestamp(account: string): number | null {
    account = account.toLowerCase();
    if (!memCache.accountFirstStakeTimestamp.has(account)) {
      return null;
    }

    return memCache.accountFirstStakeTimestamp.get(account)!;
  }
}
