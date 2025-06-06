import { AddBodiesFn } from "../../common/add_bodies_fn";
import { AccountPage } from "./body";
import { PaymentPageMock } from "./payment_page/body_mock";
import { ProfilePageMock } from "./profile_page/body_mock";

export class AccountPageMock extends AccountPage {
  public constructor(getNowDate: () => Date, appendBodies: AddBodiesFn) {
    super(
      () => new PaymentPageMock(getNowDate),
      undefined,
      (appendBodies) => new ProfilePageMock(appendBodies),
      undefined,
      appendBodies,
    );
  }
}
