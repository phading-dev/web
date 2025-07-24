import userImage = require("../common/test_data/user_image.jpg");
import { ListAccountsPage } from "./body";
import { AccountType } from "@phading/user_service_interface/account_type";
import { ListAccountsResponse } from "@phading/user_service_interface/web/self/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class ListAccountsPageMock extends ListAccountsPage {
  public constructor(error?: string) {
    super(
      new (class extends WebServiceClientMock {
        public async send(): Promise<any> {
          return {
            accounts: [
              {
                accountId: "consumer 1",
                accountType: AccountType.CONSUMER,
                avatarLargeUrl: userImage,
                name: "First Consumer",
              },
              {
                accountId: "publisher 1",
                accountType: AccountType.PUBLISHER,
                avatarLargeUrl: userImage,
                name: "First Publisher",
              },
            ],
          } as ListAccountsResponse;
        }
      })(),
      error,
    );
  }
}
