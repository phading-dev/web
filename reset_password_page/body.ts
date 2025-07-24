import EventEmitter = require("events");
import { AddBodiesFn } from "../common/add_bodies_fn";
import { TabSwitcher } from "../common/page_navigator";
import { ResetPage } from "./reset_page/body";
import { ResetSuccessPage } from "./reset_success_page/body";
import { ResetTokenExpiredPage } from "./reset_token_expired_page/body";

export interface ResetPasswordPage {
  on(event: "home", listener: () => void): this;
}

export class ResetPasswordPage extends EventEmitter {
  public static create(
    appendBodies: AddBodiesFn,
    tokenId: string,
  ): ResetPasswordPage {
    return new ResetPasswordPage(
      ResetPage.create,
      ResetSuccessPage.create,
      ResetTokenExpiredPage.create,
      appendBodies,
      tokenId,
    );
  }

  private pageSwitcher = new TabSwitcher();
  public resetPage: ResetPage;
  public resetSuccessPage: ResetSuccessPage;
  public resetTokenExpiredPage: ResetTokenExpiredPage;

  public constructor(
    private createResetPage: typeof ResetPage.create,
    private createResetSuccessPage: typeof ResetSuccessPage.create,
    private createResetTokenExpiredPage: typeof ResetTokenExpiredPage.create,
    private appendBodies: AddBodiesFn,
    public tokenId: string,
  ) {
    super();
    this.pageSwitcher.goTo(
      () => this.addResetPage(),
      () => this.resetPage.remove(),
    );
  }

  private addResetPage(): void {
    this.resetPage = this.createResetPage(this.tokenId)
      .on("success", () =>
        this.pageSwitcher.goTo(
          () => this.addResetSuccessPage(),
          () => this.resetSuccessPage.remove(),
        ),
      )
      .on("tokenExpired", () =>
        this.pageSwitcher.goTo(
          () => this.addResetTokenExpiredPage(),
          () => this.resetTokenExpiredPage.remove(),
        ),
      );
    this.appendBodies(this.resetPage.body);
  }

  private addResetSuccessPage(): void {
    this.resetSuccessPage = this.createResetSuccessPage().on("home", () =>
      this.emit("home"),
    );
    this.appendBodies(this.resetSuccessPage.body);
  }

  private addResetTokenExpiredPage(): void {
    this.resetTokenExpiredPage = this.createResetTokenExpiredPage().on(
      "home",
      () => this.emit("home"),
    );
    this.appendBodies(this.resetTokenExpiredPage.body);
  }

  public remove(): void {
    this.pageSwitcher.remove();
    this.removeAllListeners();
  }
}
