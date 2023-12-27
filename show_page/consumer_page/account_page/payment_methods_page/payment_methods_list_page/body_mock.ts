import { PaymentMethodsListPage } from "./body";
import { CardPaymentItemMock } from "./card_payment_item/body_mock";
import { ListPaymentMethodsResponse } from "@phading/billing_service_interface/web/interface";
import { CardBrand } from "@phading/billing_service_interface/web/payment_method_masked";
import { PaymentMethodPriority } from "@phading/billing_service_interface/web/payment_method_priority";
import { WebServiceClient } from "@selfage/web_service_client";

export class PaymentMethodsListPageMock extends PaymentMethodsListPage {
  public constructor() {
    super(
      undefined,
      (paymentMethod) => new CardPaymentItemMock(paymentMethod),
      new (class extends WebServiceClient {
        public constructor() {
          super(undefined, undefined);
        }
        public async send() {
          return {
            paymentMethods: [
              {
                paymentMethodId: "id1",
                priority: PaymentMethodPriority.PRIMARY,
                card: {
                  brand: CardBrand.AMEX,
                  expMonth: 11,
                  expYear: 2023,
                  lastFourDigits: "1234",
                },
              },
              {
                paymentMethodId: "id2",
                priority: PaymentMethodPriority.BACKUP,
                card: {
                  brand: CardBrand.DINERS,
                  expMonth: 12,
                  expYear: 2023,
                  lastFourDigits: "1111",
                },
              },
              {
                paymentMethodId: "id3",
                priority: PaymentMethodPriority.NORMAL,
                card: {
                  brand: CardBrand.DISCOVER,
                  expMonth: 1,
                  expYear: 2024,
                  lastFourDigits: "0000",
                },
              },
            ],
          } as ListPaymentMethodsResponse;
        }
      })()
    );
  }
}
