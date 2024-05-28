import Config from './config';
import { GraphQLClient } from 'graphql-request';
import * as GraphQueries from './types/graph-queries';

// this simple cache is used to reduce the number of calls to the blockchain
const memCache = {
  projectName: new Map<string, string>(),
  projectLogo: new Map<string, string>(),

  // use projectNest + account as the key
  accountInvolved: new Map<string, boolean>(),
};

export default class EarlyStageService {
  graphClient: GraphQLClient;

  constructor(){
    this.graphClient = new GraphQLClient(Config.getConfig(
      'GRAPH_EARLYSTAGE_URL',
    ));
  }

  // Fetch names from the subgraph
  async fetchProjectData(projects: string[]): Promise<void> {
    if (projects.length === 0) {
      return;
    }

    projects = projects.map((p) => p.toLowerCase());

    // console.log("Fetching projects names for:", projects.length, "projects");

    const data = await this.graphClient.request<
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

  async fetchAccountNests(account: string): Promise<void> {
    account = account.toLowerCase();
    // console.log(`Fetching account ${account} nests`);

    const data = await this.graphClient.request<
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
}
