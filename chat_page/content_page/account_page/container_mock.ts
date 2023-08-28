import userImage = require("./test_data/user_image.jpg");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { AccountInfoPageMock } from "./account_info_page_mock";
import { AccountPage } from "./container";
import { UpdateAvatarPageMock } from "./update_avartar_page_mock";
import { UpdatePasswordPageMock } from "./update_password_page_mock";

export class AccountPageMock extends AccountPage {
  public constructor(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn
  ) {
    super(
      () =>
        new AccountInfoPageMock({
          username: "some user name",
          naturalName: "Mr. Your Name",
          email: "xxxxx@gmail.com",
          avatarLargePath: userImage,
        }),
      () => new UpdateAvatarPageMock(),
      () => new UpdatePasswordPageMock(),
      appendBodies,
      prependMenuBodies,
      appendMenuBodies
    );
  }
}
