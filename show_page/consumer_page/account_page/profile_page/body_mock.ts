import { AddBodiesFn } from "../../../../common/add_bodies_fn";
import { BasicInfoPagMock } from "./basic_info_page/body_mock";
import { ProfilePage } from "./body";
import { UpdateAvatarPageMock } from "./update_avatar_page/body_mock";
import { UpdateContactEmailPageMock } from "./update_contact_email_page/body_mock";
import { UpdateDescriptionPageMock } from "./update_description_page/body_mock";
import { UpdateNaturalNamePageMock } from "./update_natural_name/body_mock";

export class ProfilePageMock extends ProfilePage {
  public constructor(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn
  ) {
    super(
      () => new BasicInfoPagMock(),
      () => new UpdateAvatarPageMock(),
      () => new UpdateNaturalNamePageMock(),
      () => new UpdateContactEmailPageMock(),
      () => new UpdateDescriptionPageMock(),
      appendBodies,
      prependMenuBodies
    );
  }
}
