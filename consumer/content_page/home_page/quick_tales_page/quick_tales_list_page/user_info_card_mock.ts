import { UserInfoCard as UserInfoCardData } from "@phading/user_service_interface/user_info_card";
import { UserInfoCard } from "./user_info_card";

export class UserInfoCardMock extends UserInfoCard {
  public constructor(cardData: UserInfoCardData) {
    super(cardData, undefined);
  }
}
