import { CardPaymentItem } from "./body";
import { PaymentMethodMasked } from "@phading/billing_service_interface/web/payment_method_masked";

export class CardPaymentItemMock extends CardPaymentItem {
  public constructor(paymentMethod: PaymentMethodMasked) {
    // 2023-12-02
    super(() => 1701505138000, paymentMethod);
  }
}
