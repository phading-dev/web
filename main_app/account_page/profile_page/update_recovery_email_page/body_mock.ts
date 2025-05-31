import { UpdateRecoveryEmailPage } from "./body";
import { AccountAndUser } from "@phading/user_service_interface/web/self/account";

export class UpdateRecoveryEmailPageMock extends UpdateRecoveryEmailPage {
  public constructor(account: AccountAndUser) {
    super(undefined, account);
  }
}
