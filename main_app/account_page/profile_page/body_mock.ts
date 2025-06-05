import { AddBodiesFn } from "../../../common/add_bodies_fn";
import { ProfilePage } from "./body";
import { InfoPageMock } from "./info_page/body_mock";

export class ProfilePageMock extends ProfilePage {
  public constructor(appendBodies: AddBodiesFn) {
    super(
      () => new InfoPageMock(),
      undefined,
      undefined,
      undefined,
      undefined,
      appendBodies,
    );
  }
}
