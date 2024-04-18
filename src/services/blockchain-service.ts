import * as EarlyStageManager from "../abis/EarlyStageManager.json";
import * as ProjectNest from "../abis/ProjectNest.json";

import { JsonRpcProvider, InterfaceAbi, Contract } from "ethers";

type ContractArtifacts = {
  abi: InterfaceAbi;
  // bytecode: string;
}

type ArtifactsMap = {
  [key: string]: ContractArtifacts;
}

const contractArtifacts: ArtifactsMap = {
  EarlyStageManager,
  ProjectNest,
};

export default class BlockchainService {
  public static getRpcUrl(): string {
    const network = process.env['REACT_APP_NETWORK']!;
    if(network === 'FUJI') {
      return process.env['REACT_APP_FUJI_TESTNET_RPC_URL']!;
    }
    if(network === 'AVALANCHE') {
      return process.env['REACT_APP_AVALANCHE_RPC_URL']!;
    }
    else{
      throw new Error(`Invalid network ${network}`);
    }
  }

  public static getContractAddress (contractName: string): string {
    if (contractName === 'EarlyStageManager') {
      return process.env['REACT_APP_EARLY_STAGE_MANAGER_ADDRESS']!;
    } else {
      throw new Error(`Invalid contract name ${name}`);
    }
  }

  public static getArtifacts = (contractName: string): ContractArtifacts => {
    const artifacts = contractArtifacts[contractName];
    if (!artifacts) {
      throw new Error(`Missing artifacts for contractName: ${contractName}`);
    }

    return artifacts;
  };

  public static getContract = (contractName: string, address?: string): Contract => {
    if (!address) {
      address = BlockchainService.getContractAddress(contractName);
    }

    const provider = new JsonRpcProvider(BlockchainService.getRpcUrl());
    const artifacts = BlockchainService.getArtifacts(contractName);

    return new Contract(
      address,
      artifacts.abi,
      provider,
    );
  };
}
