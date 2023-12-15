import { CardPaymentCard } from "./body";
import { PaymentMethodMasked } from "@phading/billing_service_interface/payment_method_masked";

export class CardPaymentCardMock extends CardPaymentCard {
  public constructor(paymentMethod: PaymentMethodMasked) {
    // 2023-12-02
    super(() => 1701505138000, paymentMethod);
  }
}
