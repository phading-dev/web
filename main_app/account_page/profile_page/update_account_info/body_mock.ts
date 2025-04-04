import { UpdateAccountInfoPage } from "./body";
import { AccountAndUser } from "@phading/user_service_interface/web/self/account";

export class UpdateAccountInfoPageMock extends UpdateAccountInfoPage {
  public constructor(account: AccountAndUser) {
    super(undefined, account);
  }
}
