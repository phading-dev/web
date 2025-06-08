import { SwitchAccountPage } from "./body";
import { SwitchAccountResponse } from "@phading/user_service_interface/web/self/interface";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class SwitchAccountPageMock extends SwitchAccountPage {
  public constructor(accountId: string) {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: ClientRequestInterface<any>): Promise<any> {
          let response: SwitchAccountResponse = {
            signedSession: "session1",
          };
          return response;
        }
      })(),
      accountId,
      false,
    );
  }
}
