import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { PageNavigator } from "../../common/page_navigator";
import { CreateAccountPage } from "./create_account_page/body";
import { ListAccountsPage } from "./list_accounts_page/body";

enum Page {
  LIST,
  CREATE_ACCOUNT,
}

export interface ChooseAccountPage {
  on(event: "chosen", listener: () => void): this;
}

export class ChooseAccountPage extends EventEmitter {
  public static create(appendBodiesFn: AddBodiesFn): ChooseAccountPage {
    return new ChooseAccountPage(
      CreateAccountPage.create,
      ListAccountsPage.create,
      appendBodiesFn,
    );
  }

  public listAccountsPage: ListAccountsPage;
  public createAccountPage: CreateAccountPage;
  private pageNavigator: PageNavigator<Page>;

  public constructor(
    private createCreateAccountPage: () => CreateAccountPage,
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
          .on("createAccount", () =>
            this.pageNavigator.goTo(Page.CREATE_ACCOUNT),
          );
        this.appendBodiesFn(this.listAccountsPage.body);
        break;
      case Page.CREATE_ACCOUNT:
        this.createAccountPage = this.createCreateAccountPage()
          .on("created", () => this.emit("chosen"))
          .on("back", () => this.pageNavigator.goTo(Page.LIST));
        this.appendBodiesFn(this.createAccountPage.body);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.LIST:
        this.listAccountsPage.remove();
        break;
      case Page.CREATE_ACCOUNT:
        this.createAccountPage.remove();
        break;
    }
  }

  public remove(): void {
    this.pageNavigator.remove();
  }
}
