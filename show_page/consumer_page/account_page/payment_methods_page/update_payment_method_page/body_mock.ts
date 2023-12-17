import { UpdatePaymentMethodPage } from "./body";
import { PaymentMethodMasked } from "@phading/billing_service_interface/payment_method_masked";

export class UpdatePaymentMethodPageMock extends UpdatePaymentMethodPage {
  public constructor(paymentMethod: PaymentMethodMasked) {
    super(undefined, paymentMethod);
  }
}
