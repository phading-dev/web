import { AddBodiesFn } from "../../common/add_bodies_fn";
import { AccountPage } from "./body";
import { PaymentPageMock } from "./payment_page/body_mock";
import { PayoutPageMock } from "./payout_page/body_mock";
import { ProfilePageMock } from "./profile_page/body_mock";

export class AccountPageMock extends AccountPage {
  public constructor(
    getNowDate: () => Date,
    appendBodies: AddBodiesFn,
    canEarn: boolean,
  ) {
    super(
      () => new PaymentPageMock(getNowDate),
      () => new PayoutPageMock(getNowDate),
      (appendBodies) => new ProfilePageMock(appendBodies),
      undefined,
      appendBodies,
      canEarn,
    );
  }
}
