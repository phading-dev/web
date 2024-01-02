import EventEmitter = require("events");
import { AddBodiesFn } from "../../../../common/add_bodies_fn";
import { PageNavigator } from "../../../../common/page_navigator";
import { SecurityInfoPage } from "./security_info_page/body";
import { UpdatePasswordPage } from "./update_password_page/body";
import { UpdateRecoveryEmailPage } from "./update_recovery_email_page/body";
import { UpdateUsernamePage } from "./update_username_page/body";

enum Page {
  INFO = 1,
  UPDATE_PASSWORD = 2,
  UPDATE_RECOVERY_EMAIL = 3,
  UPDATE_USERNAME = 4,
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
    this.pageNavigator.goTo(Page.INFO);
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.INFO:
        this.securityInfoPage_ = this.createSecurityInfoPagee()
          .on("updatePassword", () =>
            this.pageNavigator.goTo(Page.UPDATE_PASSWORD)
          )
          .on("updateRecoveryEmail", () =>
            this.pageNavigator.goTo(Page.UPDATE_RECOVERY_EMAIL)
          )
          .on("updateUsername", () =>
            this.pageNavigator.goTo(Page.UPDATE_USERNAME)
          );
        this.appendBodies(this.securityInfoPage_.body);
        break;
      case Page.UPDATE_PASSWORD:
        this.updatePasswordPage_ = this.createUpdatePasswordPage()
          .on("back", () => this.pageNavigator.goTo(Page.INFO))
          .on("updated", () => this.pageNavigator.goTo(Page.INFO));
        this.appendBodies(this.updatePasswordPage_.body);
        this.prependMenuBodies(this.updatePasswordPage_.menuBody);
        break;
      case Page.UPDATE_RECOVERY_EMAIL:
        this.updateRecoveryEmailPage_ = this.createUpdateRecoveryEmailPage()
          .on("back", () => this.pageNavigator.goTo(Page.INFO))
          .on("updated", () => this.pageNavigator.goTo(Page.INFO));
        this.appendBodies(this.updateRecoveryEmailPage_.body);
        this.prependMenuBodies(this.updateRecoveryEmailPage_.menuBody);
        break;
      case Page.UPDATE_USERNAME:
        this.updateUsernamePage_ = this.createUpdateUsernamePage()
          .on("back", () => this.pageNavigator.goTo(Page.INFO))
          .on("updated", () => this.pageNavigator.goTo(Page.INFO));
        this.appendBodies(this.updateUsernamePage_.body);
        this.prependMenuBodies(this.updateUsernamePage_.menuBody);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.INFO:
        this.securityInfoPage_.remove();
        break;
      case Page.UPDATE_PASSWORD:
        this.updatePasswordPage_.remove();
        break;
      case Page.UPDATE_RECOVERY_EMAIL:
        this.updateRecoveryEmailPage_.remove();
        break;
      case Page.UPDATE_USERNAME:
        this.updateUsernamePage_.remove();
        break;
    }
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
