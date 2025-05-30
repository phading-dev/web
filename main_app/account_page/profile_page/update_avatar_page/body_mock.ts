import { UpdateAvatarPage } from "./body";
import { AccountAndUser } from "@phading/user_service_interface/web/self/account";

export class UpdateAvatarPageMock extends UpdateAvatarPage {
  public constructor(account: AccountAndUser) {
    super(undefined, account);
  }
}
