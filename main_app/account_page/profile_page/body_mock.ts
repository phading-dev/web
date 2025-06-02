import userImage = require("./common/test_data/user_image.jpg");
import { AddBodiesFn } from "../../../common/add_bodies_fn";
import { ProfilePage } from "./body";
import { InfoPageMock } from "./info_page/body_mock";

export class ProfilePageMock extends ProfilePage {
  public constructor(appendBodies: AddBodiesFn) {
    super(
      () =>
        new InfoPageMock({
          avatarLargeUrl: userImage,
          contactEmail: "my@gmail.com",
          naturalName: "First Second",
          username: "user1",
          recoveryEmail: "some@gmail.com",
        }),
      undefined,
      undefined,
      undefined,
      undefined,
      appendBodies,
    );
  }
}
