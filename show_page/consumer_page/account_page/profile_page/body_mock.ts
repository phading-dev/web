import { AddBodiesFn } from "../../../../common/add_bodies_fn";
import { BasicInfoPagMock } from "./basic_info_page/body_mock";
import { ProfilePage } from "./body";
import { UpdateAccountInfoPageMock } from "./update_account_info/body_mock";
import { UpdateAvatarPageMock } from "./update_avatar_page/body_mock";

export class ProfilePageMock extends ProfilePage {
  public constructor(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn
  ) {
    super(
      () => new BasicInfoPagMock(),
      () => new UpdateAvatarPageMock(),
      (accountInfo) => new UpdateAccountInfoPageMock(accountInfo),
      appendBodies,
      prependMenuBodies
    );
  }
}
