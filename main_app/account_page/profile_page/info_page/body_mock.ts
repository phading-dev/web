import userImage = require("../common/test_data/user_image.jpg");
import { InfoPage } from "./body";
import { GetAccountAndUserResponse } from "@phading/user_service_interface/web/self/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class InfoPageMock extends InfoPage {
  public constructor() {
    super(
      new (class extends WebServiceClientMock {
        public async send(): Promise<any> {
          let response: GetAccountAndUserResponse = {
            account: {
              avatarLargeUrl: userImage,
              contactEmail: "my@gmail.com",
              naturalName: "First Second",
              username: "user1",
              recoveryEmail: "some@gmail.com",
            },
          };
          return response;
        }
      })(),
    );
  }
}
