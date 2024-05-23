export enum Network {
  AVALANCHE,
  FUJI
}

export type ConfigValues = {
  NETWORK: Network,
  JSON_RPC_URL: string,
  GRAPH_NOTIFICATIONS_URL: string,
  GRAPH_EARLYSTAGE_URL: string,
  EARLYSTAGE_MANAGER_CONTRACT: string,
}

// Default values are for PROD environment
const defaultConfig: ConfigValues = {
  NETWORK: Network.AVALANCHE,

  JSON_RPC_URL: "https://api.avax.network/ext/bc/C/rpc",
  GRAPH_NOTIFICATIONS_URL: "https://graph.colonylab.io/subgraphs/name/colony/notifications-avalanche-production",
  GRAPH_EARLYSTAGE_URL: "https://graph.colonylab.io/subgraphs/name/colony/earlystage-avalanche-production",

  EARLYSTAGE_MANAGER_CONTRACT: "0x89ab32554e7f8C260dB38448b6572c04Eb424018",
};

// Set default environment
let config = defaultConfig;

// Allows to get default configuration values based
// or to provide and setup custom config for a specific environment
export default class Config {

  // set env, optional overwrite default config values
  public static setupConfig(custom?: ConfigValues) {
    if (custom) {
      config = custom;
    }
  }

  // eslint-disable-next-line
  public static getConfig(name: string): any {
    // @ts-ignore-next-line
    return config[name];
  }

  public static getNetwork(): Network {
    return Config.getConfig('NETWORK') as Network;
  }

  public static getRpcUrl(): string {
    return Config.getConfig('JSON_RPC_URL');
  }

  public static getGraphNotificationsUrl(): string {
    return Config.getConfig('GRAPH_NOTIFICATIONS_URL');
  }

  public static getGraphEarlyStageUrl(): string {
    return Config.getConfig('GRAPH_EARLYSTAGE_URL');
  }

  public static getEarlyStageManagerAddress(): string {
    return Config.getConfig('EARLYSTAGE_MANAGER_CONTRACT');
  }

  // eslint-disable-next-line
  public static getSecret (name: string): any {
    return process.env[name];
  }
}
