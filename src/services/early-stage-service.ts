import BlockchainService from "./blockchain-service";


export default class EarlyStageService {
// TODO create constructor for optimizations, which will configure network, contracts, cache data etc.

  static async projectExist(projectNest: string): Promise<boolean> {
    const EarlyStageManager = BlockchainService.getContract('EarlyStageManager');
    return EarlyStageManager.projectExist(projectNest);
  }

  // Checks if the account was involved in ProjectNest by using the maxAllocation function.
  // maxAllocation is better than allocation, because it is not decreased after the investment.
  //
  // @returns {boolean} - The function returns true if the maxAllocation is greater than 0
  static async isAccountInvolved (projectNest: string, account: string): Promise<boolean> {
    console.log(`projectNest: ${projectNest}`);
    console.log(`account: ${account}`);

    if (!(await EarlyStageService.projectExist(projectNest))) {
      console.warn(`Project ${projectNest} does not exist`);
      return false;
    }

    const ProjectNest = BlockchainService.getContract('ProjectNest', projectNest);
    const maxAllocation = await ProjectNest.maxAllocationValues(account);
    console.log(`maxAllocation: ${maxAllocation}`);

    return maxAllocation > 0n;
  }

  static async accountAllocation (projectNest: string, account: string): Promise<bigint> {
    if (!(await EarlyStageService.projectExist(projectNest))) {
      console.warn(`Project ${projectNest} does not exist`);
      return 0n;
    }

    const ProjectNest = BlockchainService.getContract('ProjectNest', projectNest);
    const allocation = await ProjectNest.allocationBalances(account);

    return allocation;
  }

  static async accountInvestment (projectNest: string, account: string): Promise<bigint> {
    if (!(await EarlyStageService.projectExist(projectNest))) {
      console.warn(`Project ${projectNest} does not exist`);
      return 0n;
    }

    const ProjectNest = BlockchainService.getContract('ProjectNest', projectNest);
    const investment = await ProjectNest.investmentBalances(account);

    return investment;
  }

  static async accountOverinvestment(projectNest: string, account: string): Promise<bigint> {
    if (!(await EarlyStageService.projectExist(projectNest))) {
      console.warn(`Project ${projectNest} does not exist`);
      return 0n;
    }

    const ProjectNest = BlockchainService.getContract('ProjectNest', projectNest);
    const overinvestment = await ProjectNest.checkOverinvestment(account);

    return overinvestment;
  }
}
