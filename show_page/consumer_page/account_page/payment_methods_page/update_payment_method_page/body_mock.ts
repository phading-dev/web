import { UpdatePaymentMethodPage } from "./body";
import { PaymentMethodMasked } from "@phading/commerce_service_interface/consumer/frontend/payment_method_masked";

export class UpdatePaymentMethodPageMock extends UpdatePaymentMethodPage {
  public constructor(paymentMethod: PaymentMethodMasked) {
    super(undefined, paymentMethod);
  }
}
