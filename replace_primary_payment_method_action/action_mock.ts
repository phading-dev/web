import { ReplacePrimaryPaymentMethodAction } from "./action";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class ReplacePrimaryPaymentMethodActionMock extends ReplacePrimaryPaymentMethodAction {
  public constructor(accountId: string) {
    super(
      {
        location: {
          search: "?session_id=mocked_session_id",
        },
      } as any,
      new (class extends WebServiceClientMock {
        public async send(): Promise<any> {
          return {};
        }
      })(),
      accountId,
    );
  }
}
