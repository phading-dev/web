import { AddBodiesFn } from "../../../common/add_bodies_fn";
import { AccountPage } from "./body";
import { PaymentMethodsPageMock } from "./payment_methods_page/body_mock";
import { ProfilePageMock } from "./profile_page/body_mock";
import { SecurityPageMock } from "./security_page/body_mock";
import { UsageReportsPageMock } from "./usage_reports_page/body_mock";

export class AccountPageMock extends AccountPage {
  public constructor(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn
  ) {
    super(
      (appendBodies, prependMenuBodies) =>
        new ProfilePageMock(appendBodies, prependMenuBodies),
      (appendBodies, prependMenuBodies) =>
        new SecurityPageMock(appendBodies, prependMenuBodies),
      (appendBodies, prependMenuBodies) =>
        new PaymentMethodsPageMock(appendBodies, prependMenuBodies),
      (appendBodies, prependMenuBodies) =>
        new UsageReportsPageMock(appendBodies, prependMenuBodies),
      appendBodies,
      prependMenuBodies,
      appendMenuBodies
    );
  }
}
