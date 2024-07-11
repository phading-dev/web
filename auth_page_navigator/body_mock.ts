import { AddBodiesFn } from "../common/add_bodies_fn";
import { AuthPageNavigator } from "./body";
import { SignInPageMock } from "./sign_in_page_mock";
import { SignUpPageMock } from "./sign_up_page_mock";

export class AuthPageNavigatorMock extends AuthPageNavigator {
  public constructor(appendBodies: AddBodiesFn) {
    super(
      () => new SignInPageMock(),
      () => new SignUpPageMock(),
      appendBodies
    );
  }
}
