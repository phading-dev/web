import { SecurityInfoPage } from "./body";
import { GetAuthSettingsResponse } from "@phading/user_service_interface/interface";
import { WebServiceClient } from "@selfage/web_service_client";

export class SecurityInfoPageMock extends SecurityInfoPage {
  public constructor() {
    super(
      new (class extends WebServiceClient {
        public constructor() {
          super(undefined, undefined);
        }
        public async send(request: any): Promise<any> {
          return {
            authSettings: {
              username: "user1",
              recoveryEmail: "user@gmail.com",
            },
          } as GetAuthSettingsResponse;
        }
      })()
    );
  }
}
