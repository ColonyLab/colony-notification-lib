export interface Notification {
  id: string
  timestamp: number
  projectNest: string
  projectName?: string
  eventType: number
  additionalData: string
  content?: { // could be null
    id: string // dataURI
    content: string
  }
  eventMessage?: string // event message
  new?: boolean // true for new notification, false for past notification
}

