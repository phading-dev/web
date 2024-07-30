import { AccountPage } from "./body";
import { PaymentMethodsPageMock } from "./payment_methods_page/body_mock";
import { ProfilePageMock } from "./profile_page/body_mock";
import { UsageReportPageMock } from "./usage_report_page/body_mock";

export class AccountPageMock extends AccountPage {
  public constructor() {
    super(
      (appendBodies) => new PaymentMethodsPageMock(appendBodies),
      (appendBodies) => new ProfilePageMock(appendBodies),
      () => new UsageReportPageMock(),
    );
  }
}
