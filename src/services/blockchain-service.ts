import * as EarlyStageManager from "../abis/EarlyStageManager.json";
import * as ProjectNest from "../abis/ProjectNest.json";
import * as IERC20Metadata from "../abis/IERC20Metadata.json";

import { ethers, Contract } from "ethers";
import Config from "./config";

type ContractArtifacts = {
  abi: any; // eslint-disable-line
  // bytecode: string;
}

type ArtifactsMap = {
  [key: string]: ContractArtifacts;
}

const contractArtifacts: ArtifactsMap = {
  EarlyStageManager,
  ProjectNest,
  IERC20Metadata,
};


export default class BlockchainService {
  public static getContractAddress(contractName: string): string {
    if (contractName === 'EarlyStageManager') {
      return Config.getEarlyStageManagerAddress();
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

    const provider = new ethers.providers.JsonRpcProvider(Config.getRpcUrl());
    const artifacts = BlockchainService.getArtifacts(contractName);

    return new Contract(
      address,
      artifacts.abi,
      provider,
    );
  };

  public static getTokenSymbol = async (ceTokenAddress: string): Promise<string> => {
    const provider = new ethers.providers.JsonRpcProvider(Config.getRpcUrl());
    const artifacts = BlockchainService.getArtifacts('IERC20Metadata');

    const Token = new ethers.Contract(
      ceTokenAddress,
      artifacts.abi,
      provider,
    );

    return await Token.symbol();
  };
}
