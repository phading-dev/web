import { AddBodiesFn } from "../../../../common/add_bodies_fn";
import { BasicInfoPageMock } from "./basic_info_page/body_mock";
import { ProfilePage } from "./body";
import { UpdateAccountInfoPageMock } from "./update_account_info/body_mock";
import { UpdateAvatarPageMock } from "./update_avatar_page/body_mock";
import { UpdatePasswordPageMock } from "./update_password_page/body_mock";
import { UpdateRecoveryEmailPageMock } from "./update_recovery_email_page/body_mock";
import { UpdateUsernamePageMock } from "./update_username_page/body_mock";

export class ProfilePageMock extends ProfilePage {
  public constructor(appendBodies: AddBodiesFn) {
    super(
      () => new BasicInfoPageMock(),
      () => new UpdateAvatarPageMock(),
      (accountInfo) => new UpdateAccountInfoPageMock(accountInfo),
      () => new UpdatePasswordPageMock(),
      () => new UpdateRecoveryEmailPageMock(),
      () => new UpdateUsernamePageMock(),
      appendBodies,
    );
  }
}
