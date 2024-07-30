import { SettingsCard } from "./body";
import { PlayerSettings } from "@phading/product_service_interface/consumer/frontend/show/player_settings";

export class SettingsCardMock extends SettingsCard {
  public constructor(playerSetings: PlayerSettings) {
    super(playerSetings);
  }
}
