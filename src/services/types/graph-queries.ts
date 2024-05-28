import { gql } from 'graphql-request';
import { RawNotification } from './notification';

export const FETCH_NOTIFICATIONS_QUERY = gql`
query fetchNotifications($from: Int!, $to: Int!) {
  notifications(orderBy: timestamp, orderDirection: desc, where: {
    timestamp_gt: $from,
    timestamp_lte: $to
  }) {
    id
    timestamp
    projectNest
    eventType
    additionalData
    content {
      id
      content
    }
  }
}`;

export interface FetchNotificationsResult {
  notifications: RawNotification[]
}

// ------------------------------

export interface AntAllocation {
  project: {
    id: string
  }
}

// maxVelue is better than allocation
// because it is not decreased after the investment.
export const FETCH_ACCOUNT_NESTS = gql`
query fetchAccountNests($account: String) {
  account(id: $account) {
    antAllocations(where: {maxValue_gt: "0"}) {
     project {
        id
      }
    }
  }
}`;

export interface FetchAccountNestsResult {
  account: {
    antAllocations: AntAllocation[]
  }
}

// ------------------------------

export interface ProjectData {
  id: string
  name: string
  logo: string
}

export const FETCH_PROJECTS_DATA_QUERY = gql`
query fetchProjectNames($projects: [String!]!) {
  projects(where: {id_in: $projects}) {
    id
    name
    logo
  }
}`;

export interface FetchProjectsDataResult {
  projects: ProjectData[]
}
