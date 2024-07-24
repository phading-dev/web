import EventEmitter = require("events");
import { SCHEME } from "../../common/color_scheme";
import { LOCAL_SESSION_STORAGE } from "../../common/local_session_storage";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import {
  PAGE_BACKGROUND_STYLE,
  PAGE_COMMON_CARD_STYLE,
} from "../../common/page_style";
import { FONT_L } from "../../common/sizes";
import { USER_SERVICE_CLIENT } from "../../common/web_service_client";
import { AccountItem, AddAccountItem } from "./account_item";
import { AccountType } from "@phading/user_service_interface/account_type";
import { AccountSnapshot } from "@phading/user_service_interface/self/frontend/account";
import {
  listAccounts,
  switchAccount,
} from "@phading/user_service_interface/self/frontend/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

export interface ListAccountsPage {
  on(event: "switched", listener: () => void): this;
  on(event: "createConsumer", listener: () => void): this;
  on(event: "createPublisher", listener: () => void): this;
}

export class ListAccountsPage extends EventEmitter {
  public static create(): ListAccountsPage {
    return new ListAccountsPage(
      LOCAL_SESSION_STORAGE,
      USER_SERVICE_CLIENT,
      AccountItem.create,
      AddAccountItem.create,
    );
  }

  public body: HTMLDivElement;
  public consumerItems: Array<AccountItem>;
  public addConsumerItem = new Ref<AddAccountItem>();
  public publisherItems: Array<AccountItem>;
  public addPublisherItem = new Ref<AddAccountItem>();

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private webServiceClient: WebServiceClient,
    private createAccountItem: (account: AccountSnapshot) => AccountItem,
    private createAddAccountItem: () => AddAccountItem,
  ) {
    super();
    this.body = E.div({
      class: "list-accounts-page",
      style: `${PAGE_BACKGROUND_STYLE} gap: 3rem;`,
    });

    this.load();
  }

  private async load(): Promise<void> {
    let response = await listAccounts(this.webServiceClient, {});

    this.consumerItems = response.accounts
      .filter((account) => account.accountType === AccountType.CONSUMER)
      .map((account) => this.createAccountItem(account));
    this.publisherItems = response.accounts
      .filter((account) => account.accountType === AccountType.PUBLISHER)
      .map((account) => this.createAccountItem(account));

    this.body.append(
      E.div(
        {
          class: "list-accounts-consumer-tab",
          style: `${PAGE_COMMON_CARD_STYLE} max-width: 100rem; display: flex; flex-flow: column nowrap; align-items: center; gap: 2rem;`,
        },
        E.div(
          {
            class: "list-accounts-consumer-title",
            style: `font-size: ${FONT_L}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.chooseConsumer),
        ),
        E.div(
          {
            class: "list-accounts-consumer-items",
            style: `display: flex; flex-flow: row wrap; justify-content: center; gap: 2rem;`,
          },
          ...this.consumerItems.map((consumerItem) => consumerItem.body),
          assign(this.addConsumerItem, this.createAddAccountItem()).body,
        ),
      ),
      E.div(
        {
          class: "list-accounts-publisher-tab",
          style: `${PAGE_COMMON_CARD_STYLE} max-width: 100rem; display: flex; flex-flow: column nowrap; align-items: center; gap: 2rem;`,
        },
        E.div(
          {
            class: "list-accounts-publisher-title",
            style: `font-size: ${FONT_L}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.choosePublisher),
        ),
        E.div(
          {
            class: "list-accounts-publisher-items",
            style: `display: flex; flex-flow: row wrap; justify-content: center; gap: 2rem;`,
          },
          ...this.publisherItems.map((publisherItem) => publisherItem.body),
          assign(this.addPublisherItem, this.createAddAccountItem()).body,
        ),
      ),
    );

    this.consumerItems.forEach((consumerItem) => {
      consumerItem.on("choose", (accountId) => this.switchAccount(accountId));
    });
    this.addConsumerItem.val.on("create", () => this.emit("createConsumer"));
    this.publisherItems.forEach((publisherItem) => {
      publisherItem.on("choose", (accountId) => this.switchAccount(accountId));
    });
    this.addPublisherItem.val.on("create", () => this.emit("createPublisher"));
  }

  private async switchAccount(accountId: string): Promise<void> {
    let response = await switchAccount(this.webServiceClient, {
      accountId,
    });
    this.localSessionStorage.save(response.signedSession);
    this.emit("switched");
  }

  public remove(): void {
    this.body.remove();
  }
}
