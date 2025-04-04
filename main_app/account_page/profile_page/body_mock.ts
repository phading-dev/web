import { AddBodiesFn } from "../../../common/add_bodies_fn";
import { ProfilePage } from "./body";
import { InfoPageMock } from "./info_page/body_mock";
import { UpdateAccountInfoPageMock } from "./update_account_info/body_mock";
import { UpdateAvatarPageMock } from "./update_avatar_page/body_mock";
import { UpdatePasswordPageMock } from "./update_password_page/body_mock";
import { UpdateRecoveryEmailPageMock } from "./update_recovery_email_page/body_mock";

export class ProfilePageMock extends ProfilePage {
  public constructor(appendBodies: AddBodiesFn) {
    super(
      () => new InfoPageMock(),
      () => new UpdateAvatarPageMock(),
      (accountInfo) => new UpdateAccountInfoPageMock(accountInfo),
      (username) => new UpdatePasswordPageMock(username),
      (username) => new UpdateRecoveryEmailPageMock(username),
      appendBodies,
    );
  }
}
