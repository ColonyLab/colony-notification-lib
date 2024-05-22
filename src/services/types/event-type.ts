export enum EventType {
  NewProjectOnDealFlow, // 0
  NestIsOpen, // 1
  MovedToAnalysis, // 2
  MovedToInvestmentCommittee, // 3
  ClaimUsdcExcess, // 4
  AvailableOnPortfolio, // 5
  TgeAvailableNow, // 6
  CountdownSet, // 7
  CountdownHidden, // 8
  CustomNotification, // 9
}

/**
 * ceTokenSymbol - ceToken symbol needed only for "available on Portfolio"
 * actionTimestamp - action timestamp needed only for "countdown set"
 * customMessage - custom message needed only for "custom notification"
 */
export type eventTypeOpt = {
  ceTokenSymbol?: string,
  actionTimestamp?: number,
  customMessage?: string,
}

/**
 * Map event type to readable string.
 * @param eventTypeEnum - event type enum
 * @param optional - optional parameters
 */
export function mapEventType(
  eventTypeEnum: EventType,
  optional?: eventTypeOpt,
): string {
  switch (eventTypeEnum) {
    case EventType.NewProjectOnDealFlow:
      return "New project on Deal Flow";
      break;
    case EventType.NestIsOpen:
      return "NEST is now open";
      break;
    case EventType.MovedToAnalysis:
      return "Moved to Analysis";
      break;
    case EventType.MovedToInvestmentCommittee:
      return "Moved to Investment Committee";
      break;
    case EventType.ClaimUsdcExcess:
      return "Claim your USDC excess";
      break;
    case EventType.AvailableOnPortfolio: {
      if (optional === undefined || optional.ceTokenSymbol === undefined) {
        throw new Error("ceTokenSymbol is required for AvailableOnPortfolio");
      }

      return `${optional.ceTokenSymbol} now available on Portfolio`;
      break;
    }
    case EventType.TgeAvailableNow:
      return "TGE available now";
      break;
    case EventType.CountdownSet: {
      if (optional === undefined || optional.actionTimestamp === undefined) {
        throw new Error("actionTimestamp is required for CountdownSet");
      }

      return `Countdown set to ${new Date(optional.actionTimestamp * 1000).toISOString()}`;
      break;
    }
    case EventType.CountdownHidden:
      return "Countdown hidden";
      break;
    case EventType.CustomNotification: {
      if (optional === undefined || optional.customMessage === undefined) {
        throw new Error("customNotification is required for CustomNotification");
      }
      return optional.customMessage;
      break;
    }
    default:
      throw new Error("Invalid event type");
  }
}
