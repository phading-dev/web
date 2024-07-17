import { UpdateAccountInfoPage } from "./body";
import { Account } from "@phading/user_service_interface/self/frontend/account";

export class UpdateAccountInfoPageMock extends UpdateAccountInfoPage {
  public constructor(account: Account) {
    super(undefined, account);
  }
}
