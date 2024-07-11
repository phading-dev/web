import EventEmitter = require("events");
import { AddBodiesFn } from "../common/add_bodies_fn";
import { PageNavigator } from "../common/page_navigator";
import { CreateAccountPage } from "./create_account_page/body";
import { ListAccountsPage } from "./list_accounts_page/body";
import { AccountType } from "@phading/user_service_interface/account_type";

enum Page {
  LIST,
  CREATE_CONSUMER,
  CREATE_PUBLISHER,
}

export interface ChooseAccountPageNavigator {
  on(event: "chosen", listener: () => void): this;
}

export class ChooseAccountPageNavigator extends EventEmitter {
  public static create(
    appendBodiesFn: AddBodiesFn,
  ): ChooseAccountPageNavigator {
    return new ChooseAccountPageNavigator(
      CreateAccountPage.create,
      ListAccountsPage.create,
      appendBodiesFn,
    );
  }

  public listAccountsPage: ListAccountsPage;
  public createConsumerPage: CreateAccountPage;
  public createPublisherPage: CreateAccountPage;
  private pageNavigator: PageNavigator<Page>;

  public constructor(
    private createCreateAccountPage: (
      accountType: AccountType,
    ) => CreateAccountPage,
    private createListAccountsPage: () => ListAccountsPage,
    private appendBodiesFn: AddBodiesFn,
  ) {
    super();
    this.pageNavigator = new PageNavigator<Page>(
      (page) => this.addPage(page),
      (page) => this.removePage(page),
    );
    this.pageNavigator.goTo(Page.LIST);
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.LIST:
        this.listAccountsPage = this.createListAccountsPage()
          .on("switched", () => this.emit("chosen"))
          .on("createConsumer", () =>
            this.pageNavigator.goTo(Page.CREATE_CONSUMER),
          )
          .on("createPublisher", () =>
            this.pageNavigator.goTo(Page.CREATE_PUBLISHER),
          );
        this.appendBodiesFn(this.listAccountsPage.body);
        break;
      case Page.CREATE_CONSUMER:
        this.createConsumerPage = this.createCreateAccountPage(
          AccountType.CONSUMER,
        )
          .on("created", () => this.emit("chosen"))
          .on("back", () => this.pageNavigator.goTo(Page.LIST));
        this.appendBodiesFn(this.createConsumerPage.body);
        break;
      case Page.CREATE_PUBLISHER:
        this.createPublisherPage = this.createCreateAccountPage(
          AccountType.PUBLISHER,
        )
          .on("created", () => this.emit("chosen"))
          .on("back", () => this.pageNavigator.goTo(Page.LIST));
        this.appendBodiesFn(this.createPublisherPage.body);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.LIST:
        this.listAccountsPage.remove();
        break;
      case Page.CREATE_CONSUMER:
        this.createConsumerPage.remove();
        break;
      case Page.CREATE_PUBLISHER:
        this.createPublisherPage.remove();
        break;
    }
  }

  public remove(): void {
    this.pageNavigator.remove();
  }
}
