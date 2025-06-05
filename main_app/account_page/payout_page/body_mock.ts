import { PayoutPage } from "./body";
import {
  GET_PAYOUT_PROFILE_INFO,
  GetPayoutProfileInfoResponse,
  LIST_PAYOUTS,
  LinkType,
  ListPayoutsResponse,
} from "@phading/commerce_service_interface/web/payout/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class PayoutPageMock extends PayoutPage {
  public constructor(getNowdate: () => Date) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: any): Promise<any> {
          switch (request.descriptor) {
            case GET_PAYOUT_PROFILE_INFO: {
              let response: GetPayoutProfileInfoResponse = {
                connectedAccountLinkType: LinkType.ONBOARDING,
                connectedAccountUrl: "https://stripe.com/onboarding",
              };
              return response;
            }
            case LIST_PAYOUTS: {
              let response: ListPayoutsResponse = {
                payouts: [],
              };
              return response;
            }
            default:
              throw new Error("Unexpected request");
          }
        }
      })(),
      getNowdate,
    );
  }
}
