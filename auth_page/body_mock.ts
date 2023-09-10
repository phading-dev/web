import { AddBodiesFn } from "../common/add_bodies_fn";
import { AuthPage } from "./body";
import { SignInPageMock } from "./sign_in_page_mock";
import { SignUpPageMock } from "./sign_up_page_mock";

export class AuthPageMock extends AuthPage {
  public constructor(appendBodies: AddBodiesFn) {
    super(
      () => new SignInPageMock(),
      () => new SignUpPageMock(),
      appendBodies
    );
  }
}
