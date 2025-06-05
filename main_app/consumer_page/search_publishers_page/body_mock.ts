import userImage = require("../common/test_data/user_image.jpg");
import { SearchPublishersPage } from "./body";
import { SearchPublishersResponse } from "@phading/user_service_interface/web/third_person/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class SearchPublishersPageMock extends SearchPublishersPage {
  public constructor(query: string) {
    super(
      new (class extends WebServiceClientMock {
        public async send(): Promise<any> {
          let response: SearchPublishersResponse = {
            accounts: [
              {
                accountId: "account1",
                naturalName: "Account 2",
                avatarLargeUrl: userImage,
              },
            ],
          };
          return response;
        }
      })(),
      query,
    );
  }
}
