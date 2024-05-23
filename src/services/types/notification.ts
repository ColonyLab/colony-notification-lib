// Flexible notification interface for both raw and processed notifications
// It could be splited into 2 more strict interfaces
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
  countdownNextPhase?: number
  new?: boolean // true for new notification, false for past notification
}
