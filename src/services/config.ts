export enum Network {
  AVALANCHE,
  FUJI
}

export enum Environment {
  PROD = "prod",
  STAGE = "stage",
  DEV = "dev",
  LOCAL = "local",
}

export type ConfigValues = {
  NETWORK: Network,
  JSON_RPC_URL: string,
  GRAPH_NOTIFICATIONS_URL: string,
  EARLYSTAGE_MANAGER_CONTRACT: string,
}

const ConfigObject: { [key in Environment]: ConfigValues } = {
  [Environment.PROD]: {
    NETWORK: Network.AVALANCHE,

    JSON_RPC_URL: "https://api.avax.network/ext/bc/C/rpc",
    GRAPH_NOTIFICATIONS_URL: "https://graph.colonylab.io/subgraphs/name/colony/notifications-avalanche",

    EARLYSTAGE_MANAGER_CONTRACT: "0x89ab32554e7f8C260dB38448b6572c04Eb424018",
  },
  [Environment.STAGE]: {
    NETWORK: Network.FUJI,

    JSON_RPC_URL: "https://api.avax-test.network/ext/bc/C/rpc",
    GRAPH_NOTIFICATIONS_URL: "https://graph.colonylab.io/subgraphs/name/colony/notifications-fuji-staging",

    EARLYSTAGE_MANAGER_CONTRACT: "0x89ab32554e7f8C260dB38448b6572c04Eb424018",
  },
  [Environment.DEV]: {
    NETWORK: Network.FUJI,

    JSON_RPC_URL: "https://api.avax-test.network/ext/bc/C/rpc",
    GRAPH_NOTIFICATIONS_URL: "https://graph.colonylab.io/subgraphs/name/colony/notifications-fuji-develop",

    EARLYSTAGE_MANAGER_CONTRACT: "0x425C95aB13d2caae4C38c86575fc3EF5Ad7cED4f",
  },
  [Environment.LOCAL]: {
    NETWORK: Network.FUJI,

    JSON_RPC_URL: "https://api.avax-test.network/ext/bc/C/rpc",
    GRAPH_NOTIFICATIONS_URL: 'http://localhost:8000/subgraphs/name/colony/notifications',

    EARLYSTAGE_MANAGER_CONTRACT: "0x425C95aB13d2caae4C38c86575fc3EF5Ad7cED4f",
  }
}

let environment: Environment;

// Allows to get default configuration values based on the environment
// or provide and setup custom config for a specific environment
export default class Config {

  // set env, optional overwrite default config values
  public static setupConfig (env: Environment, custom?: ConfigValues) {
    environment = env;
    if (custom) {
      ConfigObject[env] = custom;
    }
  }

  public static getConfig (name: string): any {
    // require env to be set
    if (!environment) {
      throw new Error('Environment not set');
    }

    // @ts-ignore-next-line
    return ConfigObject[environment][name];
  }

  public static getNetwork (): Network {
    return Config.getConfig('NETWORK') as Network
  }

  public static getRpcUrl(): string {
    return Config.getConfig('JSON_RPC_URL')
  }

  public static getGraphNotificationsUrl(): string {
    return Config.getConfig('GRAPH_NOTIFICATIONS_URL')
  }

  public static getEarlyStageManagerAddress(): string {
    return Config.getConfig('EARLYSTAGE_MANAGER_CONTRACT')
  }

  public static getSecret (name: string): any {
    return process.env[name]
  }
}
