import EventEmitter = require("events");
import { OUTLINE_BUTTON_STYLE } from "../../../common/button_styles";
import { SCHEME } from "../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  PAGE_CENTER_CARD_BACKGROUND_STYLE,
  PAGE_EX_LARGE_CENTER_CARD_STYLE,
} from "../../../common/page_style";
import { FONT_L, FONT_M } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { AccountItem, AddAccountItem } from "./account_item";
import { AccountSummary } from "@phading/user_service_interface/web/self/account";
import { newListAccountsRequest } from "@phading/user_service_interface/web/self/client";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface ListAccountsPage {
  on(event: "switch", listener: (accountId: string) => void): this;
  on(event: "create", listener: () => void): this;
  on(event: "signOut", listener: () => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class ListAccountsPage extends EventEmitter {
  public static create(error?: string): ListAccountsPage {
    return new ListAccountsPage(SERVICE_CLIENT, error);
  }

  public body: HTMLDivElement;
  public accountItems = new Array<AccountItem>();
  public createAccountButton = new Ref<AddAccountItem>();
  public signOutButton = new Ref<HTMLDivElement>();
  public errorMessage = new Ref<HTMLDivElement>();

  public constructor(
    private serviceClient: WebServiceClient,
    private error?: string,
  ) {
    super();
    this.body = E.div({
      class: "list-accounts-page",
      style: PAGE_CENTER_CARD_BACKGROUND_STYLE,
    });

    this.load();
  }

  private async load(): Promise<void> {
    let response = await this.serviceClient.send(newListAccountsRequest({}));

    this.body.append(
      E.div(
        {
          class: "list-accounts-tab",
          style: `${PAGE_EX_LARGE_CENTER_CARD_STYLE} display: flex; flex-flow: column nowrap; align-items: center;`,
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
          ...response.accounts.map((account) => this.addAccountItem(account)),
          assign(this.createAccountButton, new AddAccountItem()).body,
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
            style: `padding-top: 2rem; font-size: ${FONT_M}rem; color: ${SCHEME.error0}; visibility: ${this.error ? "visible" : "hidden"};`,
          },
          E.text(this.error ?? "1"),
        ),
      ),
    );

    this.createAccountButton.val.on("create", () => this.emit("create"));
    this.signOutButton.val.addEventListener("click", () =>
      this.emit("signOut"),
    );
    this.emit("loaded");
  }

  private addAccountItem(account: AccountSummary): HTMLDivElement {
    let item = new AccountItem(account).on("choose", (accountId) =>
      this.emit("switch", accountId),
    );
    this.accountItems.push(item);
    return item.body;
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
