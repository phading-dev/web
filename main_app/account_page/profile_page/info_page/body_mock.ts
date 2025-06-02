import { InfoPage } from "./body";
import { AccountAndUser } from "@phading/user_service_interface/web/self/account";
import { GetAccountAndUserResponse } from "@phading/user_service_interface/web/self/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class InfoPageMock extends InfoPage {
  public constructor(account: AccountAndUser) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: any): Promise<any> {
          let response: GetAccountAndUserResponse = {
            account,
          };
          return response;
        }
      })(),
    );
  }
}
