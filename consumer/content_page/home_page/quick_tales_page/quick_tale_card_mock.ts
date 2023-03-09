import { QuickTaleCard } from "./quick_tale_card";
import { QuickTaleCard as QuickTaleCardData } from "@phading/tale_service_interface/tale_card";

export class QuickTaleCardMock extends QuickTaleCard {
  public constructor(cardData: QuickTaleCardData, pinned: boolean) {
    super(cardData, pinned, undefined);
  }
}
