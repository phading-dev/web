import userImage = require("./test_data/user_image.jpg");
import { AccountInfoPageMock } from "./account_info_page_mock";
import { AccountPage } from "./container";
import { UpdateAvatarPageMock } from "./update_avartar_page_mock";
import { UpdatePasswordPageMock } from "./update_password_page_mock";

export class AccountPageMock extends AccountPage {
  public constructor(
    appendBodiesFn: (...bodies: Array<HTMLElement>) => void,
    prependMenuBodiesFn: (...bodies: Array<HTMLElement>) => void
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
      appendBodiesFn,
      prependMenuBodiesFn
    );
  }
}
