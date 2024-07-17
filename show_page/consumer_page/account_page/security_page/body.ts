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
  public static create(appendBodies: AddBodiesFn): SecurityPage {
    return new SecurityPage(
      SecurityInfoPage.create,
      UpdatePasswordPage.create,
      UpdateRecoveryEmailPage.create,
      UpdateUsernamePage.create,
      appendBodies,
    );
  }

  public securityInfoPage: SecurityInfoPage;
  public updatePasswordPage: UpdatePasswordPage;
  public updateRecoveryEmailPage: UpdateRecoveryEmailPage;
  public updateUsernamePage: UpdateUsernamePage;
  private pageNavigator: PageNavigator<Page>;

  public constructor(
    private createSecurityInfoPagee: () => SecurityInfoPage,
    private createUpdatePasswordPage: () => UpdatePasswordPage,
    private createUpdateRecoveryEmailPage: () => UpdateRecoveryEmailPage,
    private createUpdateUsernamePage: () => UpdateUsernamePage,
    private appendBodies: AddBodiesFn,
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page),
    );
    this.pageNavigator.goTo(Page.INFO);
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.INFO:
        this.securityInfoPage = this.createSecurityInfoPagee()
          .on("updatePassword", () =>
            this.pageNavigator.goTo(Page.UPDATE_PASSWORD),
          )
          .on("updateRecoveryEmail", () =>
            this.pageNavigator.goTo(Page.UPDATE_RECOVERY_EMAIL),
          )
          .on("updateUsername", () =>
            this.pageNavigator.goTo(Page.UPDATE_USERNAME),
          );
        this.appendBodies(this.securityInfoPage.body);
        break;
      case Page.UPDATE_PASSWORD:
        this.updatePasswordPage = this.createUpdatePasswordPage()
          .on("back", () => this.pageNavigator.goTo(Page.INFO))
          .on("updated", () => this.pageNavigator.goTo(Page.INFO));
        this.appendBodies(this.updatePasswordPage.body);
        break;
      case Page.UPDATE_RECOVERY_EMAIL:
        this.updateRecoveryEmailPage = this.createUpdateRecoveryEmailPage()
          .on("back", () => this.pageNavigator.goTo(Page.INFO))
          .on("updated", () => this.pageNavigator.goTo(Page.INFO));
        this.appendBodies(this.updateRecoveryEmailPage.body);
        break;
      case Page.UPDATE_USERNAME:
        this.updateUsernamePage = this.createUpdateUsernamePage()
          .on("back", () => this.pageNavigator.goTo(Page.INFO))
          .on("updated", () => this.pageNavigator.goTo(Page.INFO));
        this.appendBodies(this.updateUsernamePage.body);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.INFO:
        this.securityInfoPage.remove();
        break;
      case Page.UPDATE_PASSWORD:
        this.updatePasswordPage.remove();
        break;
      case Page.UPDATE_RECOVERY_EMAIL:
        this.updateRecoveryEmailPage.remove();
        break;
      case Page.UPDATE_USERNAME:
        this.updateUsernamePage.remove();
        break;
    }
  }

  public remove(): void {
    this.pageNavigator.remove();
  }
}
