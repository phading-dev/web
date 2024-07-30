import { AddBodiesFn } from "../../../common/add_bodies_fn";
import { PaymentMethodsPage } from "./body";
import { PaymentMethodsListPageMock } from "./payment_methods_list_page/body_mock";
import { UpdatePaymentMethodPageMock } from "./update_payment_method_page/body_mock";

export class PaymentMethodsPageMock extends PaymentMethodsPage {
  public constructor(appendBodies: AddBodiesFn) {
    super(
      () => new PaymentMethodsListPageMock(),
      (paymentMethod) => new UpdatePaymentMethodPageMock(paymentMethod),
      appendBodies,
    );
  }
}
