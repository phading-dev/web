import { SettingsCard } from "./body";
import { PlayerSettings } from "@phading/product_service_interface/consumer/show_app/player_settings";

export class SettingsCardMock extends SettingsCard {
  public constructor(playerSetings: PlayerSettings) {
    super(playerSetings);
  }
}
