import { AccountInfoPage } from "./account_info_page";
import { GetUserProfileResponse } from "@phading/user_service_interface/interface";
import { WebServiceClient } from "@selfage/web_service_client";

export class AccountInfoPageMock extends AccountInfoPage {
  public constructor(response: GetUserProfileResponse) {
    super(
      new (class extends WebServiceClient {
        public constructor() {
          super(undefined, undefined);
        }
        public async send(request: any) {
          return response;
        }
      })()
    );
  }
}
