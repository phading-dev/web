import userImage = require("./test_data/user_image.jpg");
import { BasicInfoPag } from "./body";
import { GetAccountResponse } from "@phading/user_service_interface/self/frontend/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class BasicInfoPagMock extends BasicInfoPag {
  public constructor() {
    super(
      new (class extends WebServiceClientMock {
        public async send(request: any): Promise<any> {
          return {
            account: {
              avatarLargePath: userImage,
              contactEmail: "my@gmail.com",
              naturalName: "First Second",
            },
          } as GetAccountResponse;
        }
      })(),
    );
  }
}
