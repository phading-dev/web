import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { LOCAL_SESSION_STORAGE } from "../../common/local_session_storage";
import { PageNavigator } from "../../common/page_navigator";
import { USER_SERVICE_CLIENT } from "../../common/web_service_client";
import { ConsumerCreationPage } from "./consumer_creation_page/body";
import {
  listOwnedAccounts,
  switchAccount,
} from "@phading/user_service_interface/client_requests";
import { AccountType } from "@phading/user_service_interface/account_type";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

enum Page {
  Create,
}

export interface ConsumerSelectionPage {
  on(event: "selected", listener: () => void): this;
  on(event: "navigated", listener: () => void): this;
}

export class ConsumerSelectionPage extends EventEmitter {
  public static create(appendBodies: AddBodiesFn): ConsumerSelectionPage {
    return new ConsumerSelectionPage(
      ConsumerCreationPage.create,
      LOCAL_SESSION_STORAGE,
      USER_SERVICE_CLIENT,
      appendBodies
    );
  }

  private consumerCreationPage_: ConsumerCreationPage;
  private pageNavigator: PageNavigator<Page>;

  public constructor(
    private createConsumerCreationPage: () => ConsumerCreationPage,
    private localSessionStorage: LocalSessionStorage,
    private userServiceClient: WebServiceClient,
    private appendBodies: AddBodiesFn
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page)
    );

    this.getConsumerOrCreate();
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.Create:
        this.consumerCreationPage_ = this.createConsumerCreationPage().on(
          "created",
          (signedSession) => this.select(signedSession)
        );
        this.appendBodies(this.consumerCreationPage_.body);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.Create:
        this.consumerCreationPage_.remove();
        break;
    }
  }

  private async getConsumerOrCreate(): Promise<void> {
    let listOwnedUsersResponse = await listOwnedAccounts(this.userServiceClient, {
      accountType: AccountType.CONSUMER,
    });
    if (listOwnedUsersResponse.accounts.length > 0) {
      let switchUserResponse = await switchAccount(this.userServiceClient, {
        accountId: listOwnedUsersResponse.accounts[0].accountId,
      });
      this.select(switchUserResponse.signedSession);
    } else {
      this.pageNavigator.goTo(Page.Create);
      this.emit("navigated");
    }
  }

  private select(signedSession: string): void {
    this.localSessionStorage.save(signedSession);
    this.emit("selected");
  }

  public remove(): void {
    this.pageNavigator.remove();
  }

  // Visible for testing
  public get consumerCreationPage() {
    return this.consumerCreationPage_;
  }
}
