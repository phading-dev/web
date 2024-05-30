import { InfoCard } from "./body";
import { Show } from "@phading/product_service_interface/consumer/show_app/show";

export class InfoCardMock extends InfoCard {
  public constructor(show: Show) {
    super(show);
  }
}
