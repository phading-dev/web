import { SecurityInfoPage } from "./body";
import { GetUserResponse } from "@phading/user_service_interface/self/frontend/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class SecurityInfoPageMock extends SecurityInfoPage {
  public constructor() {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: any): Promise<any> {
          return {
            user: {
              username: "user1",
              recoveryEmail: "user@gmail.com",
            },
          } as GetUserResponse;
        }
      })(),
    );
  }
}
