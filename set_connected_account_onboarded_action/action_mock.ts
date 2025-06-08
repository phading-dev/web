import { SetConnectedAccountOnboardedAction } from "./action";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class SetConnectedAccountOnboardedActionMock extends SetConnectedAccountOnboardedAction {
  public constructor(accountId: string) {
    super(
      new (class extends WebServiceClientMock {
        public async send(): Promise<any> {
          return {};
        }
      })(),
      accountId,
    );
  }
}
