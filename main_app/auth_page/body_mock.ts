import { AddBodiesFn } from "../../common/add_bodies_fn";
import { AuthPage } from "./body";
import { SignInPage } from "./sign_in_page/body";
import { SignUpPage } from "./sign_up_page/body";
import { AccountType } from "@phading/user_service_interface/account_type";

export class AuthPageMock extends AuthPage {
  public constructor(
    appendBodies: AddBodiesFn,
    signUpInitAccountType?: AccountType,
  ) {
    super(
      undefined,
      undefined,
      undefined,
      undefined,
      () => new SignInPage(undefined),
      (initAccountType) => new SignUpPage(undefined, initAccountType),
      appendBodies,
      signUpInitAccountType,
    );
  }
}
