import { UpdateAccountInfoPage } from "./body";
import { AccountAndUser } from "@phading/user_service_interface/self/frontend/account";

export class UpdateAccountInfoPageMock extends UpdateAccountInfoPage {
  public constructor(account: AccountAndUser) {
    super(undefined, account);
  }
}
