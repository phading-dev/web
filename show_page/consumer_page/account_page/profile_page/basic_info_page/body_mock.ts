import userImage = require("./test_data/user_image.jpg");
import { BasicInfoPag } from "./body";
import { GetSubjectAccountResponse } from "@phading/user_service_interface/interface";
import { WebServiceClient } from "@selfage/web_service_client";

export class BasicInfoPagMock extends BasicInfoPag {
  public constructor() {
    super(
      new (class extends WebServiceClient {
        public constructor() {
          super(undefined, undefined);
        }
        public async send(request: any): Promise<any> {
          return {
            account: {
              avatarLargePath: userImage,
              contactEmail: "my@gmail.com",
              naturalName: "First Second",
            },
          } as GetSubjectAccountResponse;
        }
      })()
    );
  }
}
