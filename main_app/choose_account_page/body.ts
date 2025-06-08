import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { TabSwitcher } from "../../common/page_navigator";
import { CreateAccountPage } from "./create_account_page/body";
import { ListAccountsPage } from "./list_accounts_page/body";
import { SwitchAccountPage } from "./switch_account_page/body";

export interface ChooseAccountPage {
  on(event: "choose", listener: (signedSession: string) => void): this;
  on(event: "signOut", listener: () => void): this;
}

export class ChooseAccountPage extends EventEmitter {
  public static create(
    appendBodiesFn: AddBodiesFn,
    accountId?: string,
  ): ChooseAccountPage {
    return new ChooseAccountPage(
      CreateAccountPage.create,
      ListAccountsPage.create,
      SwitchAccountPage.create,
      appendBodiesFn,
      accountId,
    );
  }

  private pageSwitcher = new TabSwitcher();
  public createAccountPage: CreateAccountPage;
  public listAccountsPage: ListAccountsPage;
  public switchAccountPage: SwitchAccountPage;

  public constructor(
    private createCreateAccountPage: typeof CreateAccountPage.create,
    private createListAccountsPage: typeof ListAccountsPage.create,
    private createSwitchAccountPage: typeof SwitchAccountPage.create,
    private appendBodiesFn: AddBodiesFn,
    public accountId?: string,
  ) {
    super();
    if (accountId) {
      this.pageSwitcher.goTo(
        () => this.addSwitchAccountPage(accountId),
        () => this.switchAccountPage.remove(),
      );
    } else {
      this.pageSwitcher.goTo(
        () => this.addListAccountsPage(),
        () => this.listAccountsPage.remove(),
      );
    }
  }

  private addCreateAccountPage(): void {
    this.createAccountPage = this.createCreateAccountPage()
      .on("choose", (signedSession) => this.emit("choose", signedSession))
      .on("back", () =>
        this.pageSwitcher.goTo(
          () => this.addListAccountsPage(),
          () => this.listAccountsPage.remove(),
        ),
      );
    this.appendBodiesFn(this.createAccountPage.body);
  }

  private addListAccountsPage(accountId?: string): void {
    this.listAccountsPage = this.createListAccountsPage(accountId)
      .on("switch", (accountId) => {
        this.pageSwitcher.goTo(
          () => this.addSwitchAccountPage(accountId),
          () => this.switchAccountPage.remove(),
        );
      })
      .on("create", () =>
        this.pageSwitcher.goTo(
          () => this.addCreateAccountPage(),
          () => this.createAccountPage.remove(),
        ),
      )
      .on("signOut", () => this.emit("signOut"));
    this.appendBodiesFn(this.listAccountsPage.body);
  }

  private addSwitchAccountPage(accountId: string): void {
    this.switchAccountPage = this.createSwitchAccountPage(accountId)
      .on("choose", (signedSession) => this.emit("choose", signedSession))
      .on("error", (error) => {
        this.pageSwitcher.goTo(
          () => this.addListAccountsPage(error),
          () => this.listAccountsPage.remove(),
        );
      });
    this.appendBodiesFn(this.switchAccountPage.body);
  }

  public remove(): void {
    this.pageSwitcher.remove();
    this.removeAllListeners();
  }
}
