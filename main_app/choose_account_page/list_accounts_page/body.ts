import EventEmitter = require("events");
import { Button, OutlineButton } from "../../../common/button";
import { SCHEME } from "../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { eFullPage } from "../../../common/page_elements";
import {
  FONT_L,
  FONT_M,
  GAP_1X,
  GAP_2X,
  LINE_HEIGHT_L,
  LINE_HEIGHT_M,
} from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { AccountItem, AddAccountItem } from "./account_item";
import { MAX_ACCOUNTS_PER_USER } from "@phading/constants/account";
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
  public signOutButton = new Ref<Button>();
  public errorMessage = new Ref<HTMLDivElement>();

  public constructor(
    private serviceClient: WebServiceClient,
    private error?: string,
  ) {
    super();
    this.body = eFullPage(
      `justify-content: center; align-items: center; padding: ${GAP_2X}rem ${GAP_1X}rem;`,
    );
    this.load();
  }

  private async load(): Promise<void> {
    let response = await this.serviceClient.send(newListAccountsRequest({}));
    this.body.append(
      E.div(
        {
          class: "list-accounts-title",
          style: `font-size: ${FONT_L}rem; line-height: ${LINE_HEIGHT_L}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.chooseAccountTitle),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.div(
        {
          class: "list-accounts-items",
          style: `display: flex; flex-flow: row wrap; justify-content: center; gap: ${GAP_1X}rem;`,
        },
        ...response.accounts.map((account) => this.addAccountItem(account)),
        ...(response.accounts.length < MAX_ACCOUNTS_PER_USER
          ? [assign(this.createAccountButton, new AddAccountItem()).body]
          : []),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      assign(
        this.signOutButton,
        new OutlineButton().append(E.text(LOCALIZED_TEXT.signOutButtonLabel)),
      ).body,
      E.divRef(
        this.errorMessage,
        {
          class: "list-accounts-error-message",
          style: `padding-top: ${GAP_1X}rem; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.bad0}; display: ${this.error ? "block" : "none"};`,
        },
        E.text(this.error ?? "1"),
      ),
    );

    this.createAccountButton.val?.on("create", () => this.emit("create"));
    this.signOutButton.val.addAction(() => this.emit("signOut"));
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
