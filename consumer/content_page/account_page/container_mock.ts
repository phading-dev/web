import userImage = require("./test_data/user_image.jpg");
import { AccountBasicTabMock } from "./account_basic_tab_mock";
import { ChangeAvatarTabMock } from "./change_avartar_tab_mock";
import { AccountPage } from "./container";

export class AccountPageMock extends AccountPage {
  public constructor(
    prependMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void
  ) {
    super(
      prependMenuBodiesFn,
      () =>
        new AccountBasicTabMock({
          username: "some user name",
          naturalName: "Mr. Your Name",
          email: "xxxxx@gmail.com",
          avatarLargePath: userImage,
        }),
      () => new ChangeAvatarTabMock()
    );
  }
}
