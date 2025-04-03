import { AddBodiesFn } from "../../common/add_bodies_fn";
import { AuthPage } from "./body";
import { SignInPageMock } from "./sign_in_page_mock";
import { SignUpPageMock } from "./sign_up_page_mock";
import { AccountType } from "@phading/user_service_interface/account_type";

export class AuthPageMock extends AuthPage {
  public constructor(
    appendBodies: AddBodiesFn,
    signUpInitAccountType?: AccountType,
  ) {
    super(
      () => new SignInPageMock(),
      (initAccountType) => new SignUpPageMock(initAccountType),
      appendBodies,
      signUpInitAccountType,
    );
  }
}
