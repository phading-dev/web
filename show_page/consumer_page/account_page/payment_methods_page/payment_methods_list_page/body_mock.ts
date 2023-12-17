import { PaymentMethodsListPage } from "./body";
import { CardPaymentCardMock } from "./card_payment_card/body_mock";
import { ListPaymentMethodsResponse } from "@phading/billing_service_interface/interface";
import { CardBrand } from "@phading/billing_service_interface/payment_method_masked";
import { PaymentMethodPriority } from "@phading/billing_service_interface/payment_method_priority";
import { WebServiceClient } from "@selfage/web_service_client";

export class PaymentMethodsListPageMock extends PaymentMethodsListPage {
  public constructor() {
    super(
      undefined,
      (paymentMethod) => new CardPaymentCardMock(paymentMethod),
      new (class extends WebServiceClient {
        public constructor() {
          super(undefined, undefined);
        }
        public async send() {
          return {
            paymentMethods: [
              {
                id: "id1",
                priority: PaymentMethodPriority.PRIMARY,
                card: {
                  brand: CardBrand.AMEX,
                  expMonth: 11,
                  expYear: 2023,
                  lastFourDigits: "1234",
                },
              },
              {
                id: "id2",
                priority: PaymentMethodPriority.BACKUP,
                card: {
                  brand: CardBrand.DINERS,
                  expMonth: 12,
                  expYear: 2023,
                  lastFourDigits: "1111",
                },
              },
              {
                id: "id3",
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
