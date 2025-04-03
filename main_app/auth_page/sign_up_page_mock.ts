import { SignUpPage } from "./sign_up_page";
import { AccountType } from "@phading/user_service_interface/account_type";

export class SignUpPageMock extends SignUpPage {
  public constructor(initAccountType?: AccountType) {
    super(undefined, undefined, initAccountType);
  }
}
