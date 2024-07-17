import { AddBodiesFn } from "../../../../common/add_bodies_fn";
import { SecurityPage } from "./body";
import { SecurityInfoPageMock } from "./security_info_page/body_mock";
import { UpdatePasswordPageMock } from "./update_password_page/body_mock";
import { UpdateRecoveryEmailPageMock } from "./update_recovery_email_page/body_mock";
import { UpdateUsernamePageMock } from "./update_username_page/body_mock";

export class SecurityPageMock extends SecurityPage {
  public constructor(appendBodies: AddBodiesFn) {
    super(
      () => new SecurityInfoPageMock(),
      () => new UpdatePasswordPageMock(),
      () => new UpdateRecoveryEmailPageMock(),
      () => new UpdateUsernamePageMock(),
      appendBodies,
    );
  }
}
