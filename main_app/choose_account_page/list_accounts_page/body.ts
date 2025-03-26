import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import { LOCAL_SESSION_STORAGE } from "../../../common/local_session_storage";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  PAGE_BACKGROUND_STYLE,
  PAGE_COMMON_CARD_STYLE,
} from "../../../common/page_style";
import { FONT_L } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { AccountItem, AddAccountItem } from "./account_item";
import { AccountSummary } from "@phading/user_service_interface/web/self/account";
import {
  newListAccountsRequest,
  newSwitchAccountRequest,
} from "@phading/user_service_interface/web/self/client";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

export interface ListAccountsPage {
  on(event: "switched", listener: () => void): this;
  on(event: "createAccount", listener: () => void): this;
}

export class ListAccountsPage extends EventEmitter {
  public static create(): ListAccountsPage {
    return new ListAccountsPage(
      LOCAL_SESSION_STORAGE,
      SERVICE_CLIENT,
      AccountItem.create,
      AddAccountItem.create,
    );
  }

  public body: HTMLDivElement;
  public accountItems: Array<AccountItem>;
  public addAccountItem = new Ref<AddAccountItem>();

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private serviceClient: WebServiceClient,
    private createAccountItem: (account: AccountSummary) => AccountItem,
    private createAddAccountItem: () => AddAccountItem,
  ) {
    super();
    this.body = E.div({
      class: "list-accounts-page",
      style: PAGE_BACKGROUND_STYLE,
    });

    this.load();
  }

  private async load(): Promise<void> {
    let response = await this.serviceClient.send(newListAccountsRequest({}));

    this.accountItems = response.accounts.map((account) =>
      this.createAccountItem(account),
    );
    this.body.append(
      E.div(
        {
          class: "list-accounts-tab",
          style: `${PAGE_COMMON_CARD_STYLE} max-width: 120rem; display: flex; flex-flow: column nowrap; align-items: center; gap: 2rem;`,
        },
        E.div(
          {
            class: "list-accounts-title",
            style: `font-size: ${FONT_L}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.chooseAccount),
        ),
        E.div(
          {
            class: "list-accounts-items",
            style: `display: flex; flex-flow: row wrap; justify-content: center; gap: 2rem;`,
          },
          ...this.accountItems.map((accountItem) => accountItem.body),
          assign(this.addAccountItem, this.createAddAccountItem()).body,
        ),
      ),
    );

    this.accountItems.forEach((accountItem) => {
      accountItem.on("choose", (accountId) => this.switchAccount(accountId));
    });
    this.addAccountItem.val.on("create", () => this.emit("createAccount"));
  }

  private async switchAccount(accountId: string): Promise<void> {
    let response = await this.serviceClient.send(
      newSwitchAccountRequest({
        accountId,
      }),
    );
    this.localSessionStorage.save(response.signedSession);
    this.emit("switched");
  }

  public remove(): void {
    this.body.remove();
  }
}
