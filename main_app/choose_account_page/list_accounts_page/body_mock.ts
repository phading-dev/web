import userImage = require("./test_data/user_image.jpg");
import { AccountItem, AddAccountItem } from "./account_item";
import { ListAccountsPage } from "./body";
import { AccountType } from "@phading/user_service_interface/account_type";
import { ListAccountsResponse } from "@phading/user_service_interface/web/self/interface";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

export class ListAccountsPageMock extends ListAccountsPage {
  public constructor() {
    super(
      undefined,
      new (class extends WebServiceClientMock {
        public async send(): Promise<any> {
          return {
            accounts: [
              {
                accountId: "consumer 1",
                accountType: AccountType.CONSUMER,
                avatarSmallUrl: userImage,
                naturalName: "First Consumer",
              },
              {
                accountId: "publisher 1",
                accountType: AccountType.PUBLISHER,
                avatarSmallUrl: userImage,
                naturalName: "First Publisher",
              },
            ],
          } as ListAccountsResponse;
        }
      })(),
      AccountItem.create,
      AddAccountItem.create,
    );
  }
}
