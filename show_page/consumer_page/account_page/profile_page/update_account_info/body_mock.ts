import { UpdateAccountInfoPage } from "./body";
import { Account } from "@phading/user_service_interface/self/web/account";
import { WebServiceClient } from "@selfage/web_service_client";

export class UpdateAccountInfoPageMock extends UpdateAccountInfoPage {
  public constructor(account: Account) {
    super(
      new (class extends WebServiceClient {
        public constructor() {
          super(undefined, undefined);
        }
        public async send(request: any): Promise<any> {
          return {};
        }
      })(),
      account
    );
  }
}
