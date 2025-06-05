import { PaymentPage } from "./body";
import {
  GET_PAYMENT_PROFILE_INFO,
  GetPaymentProfileInfoResponse,
  LIST_PAYMENTS,
  ListPaymentsResponse,
} from "@phading/commerce_service_interface/web/payment/interface";
import { PaymentProfileState } from "@phading/commerce_service_interface/web/payment/payment_profile_state";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class PaymentPageMock extends PaymentPage {
  public constructor(getNowdate: () => Date) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: any): Promise<any> {
          switch (request.descriptor) {
            case GET_PAYMENT_PROFILE_INFO: {
              let response: GetPaymentProfileInfoResponse = {
                state: PaymentProfileState.HEALTHY,
                paymentAfterMs: 0,
              };
              return response;
            }
            case LIST_PAYMENTS: {
              let response: ListPaymentsResponse = {
                payments: [],
              };
              return response;
            }
            default:
              throw new Error("Unexpected request");
          }
        }
      })(),
      undefined,
      getNowdate,
    );
  }
}
