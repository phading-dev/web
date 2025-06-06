import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { TabSwitcher } from "../../common/page_navigator";
import { CreateAccountPage } from "./create_account_page/body";
import { ListAccountsPage } from "./list_accounts_page/body";

export interface ChooseAccountPage {
  on(event: "choose", listener: () => void): this;
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

  private pageSwitcher = new TabSwitcher();
  public listAccountsPage: ListAccountsPage;
  public createAccountPage: CreateAccountPage;

  public constructor(
    private createCreateAccountPage: () => CreateAccountPage,
    private createListAccountsPage: (
      preSelectedAccountId?: string,
    ) => ListAccountsPage,
    private appendBodiesFn: AddBodiesFn,
    public preSelectedAccountId?: string,
  ) {
    super();
    this.pageSwitcher.goTo(
      () => this.addListAccountsPage(preSelectedAccountId),
      () => this.listAccountsPage.remove(),
    );
  }

  private addListAccountsPage(preSelectedAccountId?: string): void {
    this.listAccountsPage = this.createListAccountsPage(preSelectedAccountId)
      .on("choose", () => this.emit("choose"))
      .on("createAccount", () =>
        this.pageSwitcher.goTo(
          () => this.addCreateAccountPage(),
          () => this.createAccountPage.remove(),
        ),
      )
      .on("signOut", () => this.emit("signOut"));
    this.appendBodiesFn(this.listAccountsPage.body);
  }

  private addCreateAccountPage(): void {
    this.createAccountPage = this.createCreateAccountPage()
      .on("choose", () => this.emit("choose"))
      .on("back", () =>
        this.pageSwitcher.goTo(
          () => this.addListAccountsPage(),
          () => this.listAccountsPage.remove(),
        ),
      );
    this.appendBodiesFn(this.createAccountPage.body);
  }

  public remove(): void {
    this.pageSwitcher.remove();
  }
}
