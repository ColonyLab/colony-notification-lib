import { mapProjectPhase, Phase } from "./project-phase";

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
  countdownNextPhase?: Phase,
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

  const requireOptional = (
    key: string,
    eventType: EventType,
  ): void => {
    // @ts-ignore-next-line
    if (optional === undefined || optional[key] === undefined) {
      throw new Error(`${key} is required for ${eventType}`);
    }
  };

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
      requireOptional("ceTokenSymbol", EventType.AvailableOnPortfolio);

      return `${optional!.ceTokenSymbol} now available on Portfolio`;
      break;
    }
    case EventType.TgeAvailableNow:
      return "TGE available now";
      break;
    case EventType.CountdownSet: {
      requireOptional("actionTimestamp", EventType.CountdownSet);
      requireOptional("countdownNextPhase", EventType.CountdownSet);

      const phase = mapProjectPhase(optional!.countdownNextPhase!);

      const date = new Date(optional!.actionTimestamp! * 1000).toISOString();

      return `${phase} countdown set to ${date}`;
      break;
    }
    case EventType.CountdownHidden:
      return "Countdown hidden";
      break;
    case EventType.CustomNotification: {
      requireOptional("customMessage", EventType.CustomNotification);

      return optional!.customMessage!;
      break;
    }
    default:
      throw new Error("Invalid event type");
  }
}
