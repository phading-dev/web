import EventEmitter = require("events");
import { OUTLINE_BUTTON_STYLE } from "../../../common/button_styles";
import { SCHEME } from "../../../common/color_scheme";
import { LOCAL_SESSION_STORAGE } from "../../../common/local_session_storage";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  PAGE_BACKGROUND_STYLE,
  PAGE_EX_LARGE_CARD_STYLE,
} from "../../../common/page_style";
import { FONT_L, FONT_M } from "../../../common/sizes";
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
  on(event: "chosen", listener: () => void): this;
  on(event: "createAccount", listener: () => void): this;
  on(event: "signOut", listener: () => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class ListAccountsPage extends EventEmitter {
  public static create(preSelectedAccountId?: string): ListAccountsPage {
    return new ListAccountsPage(
      LOCAL_SESSION_STORAGE,
      SERVICE_CLIENT,
      AccountItem.create,
      AddAccountItem.create,
      preSelectedAccountId,
    );
  }

  public body: HTMLDivElement;
  public accountItems: Array<AccountItem>;
  public addAccountItem = new Ref<AddAccountItem>();
  public signOutButton = new Ref<HTMLDivElement>();
  public errorMessage = new Ref<HTMLDivElement>();

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private serviceClient: WebServiceClient,
    private createAccountItem: (
      account: AccountSummary,
      highlight: boolean,
    ) => AccountItem,
    private createAddAccountItem: () => AddAccountItem,
    private preSelectedAccountId?: string,
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
      this.createAccountItem(
        account,
        account.accountId === this.preSelectedAccountId,
      ),
    );
    let accountNotFoundError = this.preSelectedAccountId
      ? !response.accounts.find(
          (account) => account.accountId === this.preSelectedAccountId,
        )
      : false;
    this.body.append(
      E.div(
        {
          class: "list-accounts-tab",
          style: `${PAGE_EX_LARGE_CARD_STYLE} display: flex; flex-flow: column nowrap; align-items: center;`,
        },
        E.div(
          {
            class: "list-accounts-title",
            style: `font-size: ${FONT_L}rem; color: ${SCHEME.neutral0}; padding-bottom: 3rem;`,
          },
          E.text(LOCALIZED_TEXT.chooseAccount),
        ),
        E.div(
          {
            class: "list-accounts-items",
            style: `display: flex; flex-flow: row wrap; justify-content: center; gap: 2rem; padding-bottom: 3rem;`,
          },
          ...this.accountItems.map((accountItem) => accountItem.body),
          assign(this.addAccountItem, this.createAddAccountItem()).body,
        ),
        E.divRef(
          this.signOutButton,
          {
            class: "list-accounts-sign-out",
            style: OUTLINE_BUTTON_STYLE,
          },
          E.text(LOCALIZED_TEXT.signOutButtonLabel),
        ),
        E.divRef(
          this.errorMessage,
          {
            class: "list-accounts-error-message",
            style: `padding-top: 2rem; font-size: ${FONT_M}rem; color: ${SCHEME.error0}; visibility: ${accountNotFoundError ? "visible" : "hidden"};`,
          },
          E.text(
            accountNotFoundError ? LOCALIZED_TEXT.accountNotFoundError : "1",
          ),
        ),
      ),
    );

    this.accountItems.forEach((accountItem) => {
      accountItem.on("choose", (accountId) => this.switchAccount(accountId));
    });
    this.addAccountItem.val.on("create", () => this.emit("createAccount"));
    this.signOutButton.val.addEventListener("click", () =>
      this.emit("signOut"),
    );
    this.emit("loaded");
  }

  private async switchAccount(accountId: string): Promise<void> {
    let response = await this.serviceClient.send(
      newSwitchAccountRequest({
        accountId,
      }),
    );
    this.localSessionStorage.save(response.signedSession);
    this.emit("chosen");
  }

  public remove(): void {
    this.body.remove();
  }
}
