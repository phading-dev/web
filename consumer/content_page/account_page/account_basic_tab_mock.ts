import { AccountBasicTab } from "./account_basic_tab";
import { GetUserInfoResponse } from "@phading/user_service_interface/interface";
import { WebServiceClient } from "@selfage/web_service_client";

export class AccountBasicTabMock extends AccountBasicTab {
  public constructor(private response: GetUserInfoResponse) {
    super(
      new (class extends WebServiceClient {
        public constructor() {
          super(undefined, undefined);
        }
      })()
    );
    this.webServiceClient.send = (request: any): any => {
      return this.response;
    };
  }
}
