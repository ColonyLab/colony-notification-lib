import BlockchainService from "./blockchain-service";

// this simple cache is used to reduce the number of calls to the blockchain
const memCache = {
  projectExist: new Map<string, boolean>(),

  // for account mapping, use projectNest + account as the key
  accountInvolved: new Map<string, boolean>(),
  accountAllocation: new Map<string, bigint>(),
  accountInvestment: new Map<string, bigint>(),
  accountOverinvestment: new Map<string, bigint>(),
};

export default class EarlyStageService {
  static async projectExist(projectNest: string): Promise<boolean> {
    if (memCache.projectExist.has(projectNest)) {
      return memCache.projectExist.get(projectNest)!;
    }

    const EarlyStageManager = BlockchainService.getContract('EarlyStageManager');
    const exist = await EarlyStageManager.projectExist(projectNest);

    memCache.projectExist.set(projectNest, exist);
    return exist;
  }

  // Checks if the account was involved in ProjectNest by using the maxAllocation function.
  // maxAllocation is better than allocation, because it is not decreased after the investment.
  //
  // @returns {boolean} - The function returns true if the maxAllocation is greater than 0
  static async isAccountInvolved (projectNest: string, account: string): Promise<boolean> {
    if (memCache.accountInvolved.has(projectNest + account)) {
      return memCache.accountInvolved.get(projectNest + account)!;
    }

    if (!(await EarlyStageService.projectExist(projectNest))) {
      console.warn(`Project ${projectNest} does not exist`);
      return false;
    }

    const ProjectNest = BlockchainService.getContract('ProjectNest', projectNest);
    const maxAllocation = await ProjectNest.maxAllocationValues(account);
    const involved = maxAllocation > 0n;

    memCache.accountInvolved.set(projectNest + account, involved);
    return involved;
  }

  static async accountAllocation (projectNest: string, account: string): Promise<bigint> {
    if (memCache.accountAllocation.has(projectNest + account)) {
      return memCache.accountAllocation.get(projectNest + account)!;
    }

    if (!(await EarlyStageService.projectExist(projectNest))) {
      console.warn(`Project ${projectNest} does not exist`);
      return 0n;
    }

    const ProjectNest = BlockchainService.getContract('ProjectNest', projectNest);
    const allocation = await ProjectNest.allocationBalances(account);

    memCache.accountAllocation.set(projectNest + account, allocation);
    return allocation;
  }

  static async accountInvestment (projectNest: string, account: string): Promise<bigint> {
    if (memCache.accountInvestment.has(projectNest + account)) {
      return memCache.accountInvestment.get(projectNest + account)!;
    }

    if (!(await EarlyStageService.projectExist(projectNest))) {
      console.warn(`Project ${projectNest} does not exist`);
      return 0n;
    }

    const ProjectNest = BlockchainService.getContract('ProjectNest', projectNest);
    const investment = await ProjectNest.investmentBalances(account);

    memCache.accountInvestment.set(projectNest + account, investment);
    return investment;
  }

  static async accountOverinvestment(projectNest: string, account: string): Promise<bigint> {
    if (memCache.accountOverinvestment.has(projectNest + account)) {
      return memCache.accountOverinvestment.get(projectNest + account)!;
    }

    if (!(await EarlyStageService.projectExist(projectNest))) {
      console.warn(`Project ${projectNest} does not exist`);
      return 0n;
    }

    const ProjectNest = BlockchainService.getContract('ProjectNest', projectNest);
    const overinvestment = await ProjectNest.checkOverinvestment(account);

    memCache.accountOverinvestment.set(projectNest + account, overinvestment);
    return overinvestment;
  }
}
