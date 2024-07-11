import { CreateAccountPage } from "./body";
import { AccountType } from "@phading/user_service_interface/account_type";

export class CreateAccountPageMock extends CreateAccountPage {
  public constructor(accountType: AccountType) {
    super(undefined, undefined, accountType);
  }
}
