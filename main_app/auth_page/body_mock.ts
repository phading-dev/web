import { AddBodiesFn } from "../../common/add_bodies_fn";
import { AuthPage } from "./body";
import { SignInPage } from "./sign_in_page";
import { SignUpPage } from "./sign_up_page";
import { AccountType } from "@phading/user_service_interface/account_type";

export class AuthPageMock extends AuthPage {
  public constructor(
    appendBodies: AddBodiesFn,
    signUpInitAccountType?: AccountType,
  ) {
    super(
      () => new SignInPage(undefined, undefined),
      (initAccountType) =>
        new SignUpPage(undefined, undefined, initAccountType),
      appendBodies,
      signUpInitAccountType,
    );
  }
}
