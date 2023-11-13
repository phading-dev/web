import EventEmitter = require("events");
import { AddBodiesFn } from "../../../../common/add_bodies_fn";
import { PageNavigator } from "../../../../common/page_navigator";
import { SecurityInfoPage } from "./security_info_page/body";
import { Page, SecurityPageState } from "./state";
import { UpdatePasswordPage } from "./update_password_page/body";
import { UpdateRecoveryEmailPage } from "./update_recovery_email_page/body";
import { UpdateUsernamePage } from "./update_username_page/body";

export interface SecurityPage {
  on(event: "newState", listener: (newState: SecurityPageState) => void): this;
}

export class SecurityPage extends EventEmitter {
  public static create(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn
  ): SecurityPage {
    return new SecurityPage(
      SecurityInfoPage.create,
      UpdatePasswordPage.create,
      UpdateRecoveryEmailPage.create,
      UpdateUsernamePage.create,
      appendBodies,
      prependMenuBodies
    );
  }

  private state: SecurityPageState;
  private securityInfoPage_: SecurityInfoPage;
  private updatePasswordPage_: UpdatePasswordPage;
  private updateRecoveryEmailPage_: UpdateRecoveryEmailPage;
  private updateUsernamePage_: UpdateUsernamePage;
  private pageNavigator: PageNavigator<Page>;

  public constructor(
    private createSecurityInfoPagee: () => SecurityInfoPage,
    private createUpdatePasswordPage: () => UpdatePasswordPage,
    private createUpdateRecoveryEmailPage: () => UpdateRecoveryEmailPage,
    private createUpdateUsernamePage: () => UpdateUsernamePage,
    private appendBodies: AddBodiesFn,
    private prependMenuBodies: AddBodiesFn
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page)
    );
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.Info:
        this.securityInfoPage_ = this.createSecurityInfoPagee()
          .on("updatePassword", () => {
            this.updateState({
              page: Page.UpdatePassword,
            });
            this.emit("newState", this.state);
          })
          .on("updateRecoveryEmail", () => {
            this.updateState({
              page: Page.UpdateRecoveryEmail,
            });
            this.emit("newState", this.state);
          })
          .on("updateUsername", () => {
            this.updateState({
              page: Page.UpdateUsername,
            });
            this.emit("newState", this.state);
          });
        this.appendBodies(this.securityInfoPage_.body);
        break;
      case Page.UpdatePassword:
        this.updatePasswordPage_ = this.createUpdatePasswordPage()
          .on("back", () => {
            this.updateState({
              page: Page.Info,
            });
            this.emit("newState", this.state);
          })
          .on("updated", () => {
            this.updateState({
              page: Page.Info,
            });
            this.emit("newState", this.state);
          });
        this.appendBodies(this.updatePasswordPage_.body);
        this.prependMenuBodies(this.updatePasswordPage_.menuBody);
        break;
      case Page.UpdateRecoveryEmail:
        this.updateRecoveryEmailPage_ = this.createUpdateRecoveryEmailPage()
          .on("back", () => {
            this.updateState({
              page: Page.Info,
            });
            this.emit("newState", this.state);
          })
          .on("updated", () => {
            this.updateState({
              page: Page.Info,
            });
            this.emit("newState", this.state);
          });
        this.appendBodies(this.updateRecoveryEmailPage_.body);
        this.prependMenuBodies(this.updateRecoveryEmailPage_.menuBody);
        break;
      case Page.UpdateUsername:
        this.updateUsernamePage_ = this.createUpdateUsernamePage()
          .on("back", () => {
            this.updateState({
              page: Page.Info,
            });
            this.emit("newState", this.state);
          })
          .on("updated", () => {
            this.updateState({
              page: Page.Info,
            });
            this.emit("newState", this.state);
          });
        this.appendBodies(this.updateUsernamePage_.body);
        this.prependMenuBodies(this.updateUsernamePage_.menuBody);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.Info:
        this.securityInfoPage_.remove();
        break;
      case Page.UpdatePassword:
        this.updatePasswordPage_.remove();
        break;
      case Page.UpdateRecoveryEmail:
        this.updateRecoveryEmailPage_.remove();
        break;
      case Page.UpdateUsername:
        this.updateUsernamePage_.remove();
        break;
    }
  }

  public updateState(newState?: SecurityPageState): void {
    if (!newState) {
      newState = {};
    }
    if (!newState.page) {
      newState.page = Page.Info;
    }
    this.state = newState;
    this.pageNavigator.goTo(this.state.page);
  }

  public remove(): void {
    this.pageNavigator.remove();
  }

  // Visible for testing
  public get securityInfoPage() {
    return this.securityInfoPage_;
  }
  public get updatePasswordPage() {
    return this.updatePasswordPage_;
  }
  public get updateRecoveryEmailPage() {
    return this.updateRecoveryEmailPage_;
  }
  public get updateUsernamePage() {
    return this.updateUsernamePage_;
  }
}
