import { gql } from 'graphql-request';
import { Notification } from './notification';

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
  notifications: Notification[]
}

// ------------------------------

export interface ProjectName {
  id: string
  name: string
}

export const FETCH_PROJECTS_NAMES_QUERY = gql`
query fetchProjectNames($projects: [String!]!) {
  projects(where: {id_in: $projects}) {
    id
    name
  }
}`;

export interface FetchProjectsNames {
  projects: ProjectName[]
}
