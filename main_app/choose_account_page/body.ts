import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { PageNavigator } from "../../common/page_navigator";
import { CreateAccountPage } from "./create_account_page/body";
import { ListAccountsPage } from "./list_accounts_page/body";

enum Page {
  LIST,
  CREATE_ACCOUNT,
}

interface NavigationArgs {
  listAccountsPreSelectedAccountId?: string;
}

export interface ChooseAccountPage {
  on(event: "chosen", listener: () => void): this;
  on(event: "signOut", listener: () => void): this;
}

export class ChooseAccountPage extends EventEmitter {
  public static create(
    appendBodiesFn: AddBodiesFn,
    preSelectedAccountId?: string,
  ): ChooseAccountPage {
    return new ChooseAccountPage(
      CreateAccountPage.create,
      ListAccountsPage.create,
      appendBodiesFn,
      preSelectedAccountId,
    );
  }

  public listAccountsPage: ListAccountsPage;
  public createAccountPage: CreateAccountPage;
  private pageNavigator: PageNavigator<Page, NavigationArgs>;

  public constructor(
    private createCreateAccountPage: () => CreateAccountPage,
    private createListAccountsPage: (
      preSelectedAccountId?: string,
    ) => ListAccountsPage,
    private appendBodiesFn: AddBodiesFn,
    preSelectedAccountId?: string,
  ) {
    super();
    this.pageNavigator = new PageNavigator<Page>(
      (page, args) => this.addPage(page, args),
      (page) => this.removePage(page),
    );
    this.pageNavigator.goTo(Page.LIST, {
      listAccountsPreSelectedAccountId: preSelectedAccountId,
    });
  }

  private addPage(page: Page, args?: NavigationArgs): void {
    switch (page) {
      case Page.LIST:
        this.listAccountsPage = this.createListAccountsPage(
          args?.listAccountsPreSelectedAccountId,
        )
          .on("chosen", () => this.emit("chosen"))
          .on("createAccount", () =>
            this.pageNavigator.goTo(Page.CREATE_ACCOUNT),
          )
          .on("signOut", () => this.emit("signOut"));
        this.appendBodiesFn(this.listAccountsPage.body);
        break;
      case Page.CREATE_ACCOUNT:
        this.createAccountPage = this.createCreateAccountPage()
          .on("chosen", () => this.emit("chosen"))
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
