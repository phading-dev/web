import EventEmitter = require("events");
import { AddBodiesFn } from "../../../common/add_bodies_fn";
import { PageNavigator } from "../../../common/page_navigator";
import { InfoPage } from "./info_page/body";
import { UpdateAccountInfoPage } from "./update_account_info/body";
import { UpdateAvatarPage } from "./update_avatar_page/body";
import { UpdatePasswordPage } from "./update_password_page/body";
import { UpdateRecoveryEmailPage } from "./update_recovery_email_page/body";
import { AccountAndUser } from "@phading/user_service_interface/web/self/account";

enum Page {
  INFO = 1,
  UPDATE_AVATAR = 2,
  UPDATE_ACCOUNT = 3,
  UPDATE_PASSWORD = 4,
  UPDATE_RECOVERY_EMAIL = 5,
}

interface NavgationArgs {
  updateAccount?: AccountAndUser;
  updatePasswordUsername?: string;
  updateRecoveryEmailUsername?: string;
}

export interface ProfilePage {
  on(event: "switchAccount", listener: () => void): this;
  on(event: "signOut", listener: () => void): this;
}

export class ProfilePage extends EventEmitter {
  public static create(appendBodies: AddBodiesFn): ProfilePage {
    return new ProfilePage(
      InfoPage.create,
      UpdateAvatarPage.create,
      UpdateAccountInfoPage.create,
      UpdatePasswordPage.create,
      UpdateRecoveryEmailPage.create,
      appendBodies,
    );
  }

  public infoPage: InfoPage;
  public updateAvatarPage: UpdateAvatarPage;
  public updateAccountInfoPage: UpdateAccountInfoPage;
  public updatePasswordPage: UpdatePasswordPage;
  public updateRecoveryEmailPage: UpdateRecoveryEmailPage;
  private pageNavigator: PageNavigator<Page, NavgationArgs>;

  public constructor(
    private createInfoPage: () => InfoPage,
    private createUpdateAvatarPage: () => UpdateAvatarPage,
    private createUpdateAccountInfoPage: (
      accountInfo: AccountAndUser,
    ) => UpdateAccountInfoPage,
    private createUpdatePasswordPage: (username: string) => UpdatePasswordPage,
    private createUpdateRecoveryEmailPage: (
      username: string,
    ) => UpdateRecoveryEmailPage,
    private appendBodies: AddBodiesFn,
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page, args) => this.addPage(page, args),
      (page) => this.removePage(page),
    );
    this.pageNavigator.goTo(Page.INFO);
  }

  private addPage(page: Page, args?: NavgationArgs): void {
    switch (page) {
      case Page.INFO:
        this.infoPage = this.createInfoPage()
          .on("updateAvatar", () => this.pageNavigator.goTo(Page.UPDATE_AVATAR))
          .on("updateAccountInfo", (accountInfo) => {
            this.pageNavigator.goTo(Page.UPDATE_ACCOUNT, {
              updateAccount: accountInfo,
            });
          })
          .on("updatePassword", (accountInfo) =>
            this.pageNavigator.goTo(Page.UPDATE_PASSWORD, {
              updatePasswordUsername: accountInfo.username,
            }),
          )
          .on("updateRecoveryEmail", (accountInfo) =>
            this.pageNavigator.goTo(Page.UPDATE_RECOVERY_EMAIL, {
              updateRecoveryEmailUsername: accountInfo.username,
            }),
          )
          .on("switchAccount", () => this.emit("switchAccount"))
          .on("signOut", () => this.emit("signOut"));
        this.appendBodies(this.infoPage.body);
        break;
      case Page.UPDATE_AVATAR:
        this.updateAvatarPage = this.createUpdateAvatarPage()
          .on("back", () => this.pageNavigator.goTo(Page.INFO))
          .on("updated", () => this.pageNavigator.goTo(Page.INFO));
        this.appendBodies(this.updateAvatarPage.body);
        break;
      case Page.UPDATE_ACCOUNT:
        this.updateAccountInfoPage = this.createUpdateAccountInfoPage(
          args?.updateAccount,
        ).on("back", () => this.pageNavigator.goTo(Page.INFO));
        this.appendBodies(this.updateAccountInfoPage.body);
        break;
      case Page.UPDATE_PASSWORD:
        this.updatePasswordPage = this.createUpdatePasswordPage(
          args?.updatePasswordUsername,
        ).on("back", () => this.pageNavigator.goTo(Page.INFO));
        this.appendBodies(this.updatePasswordPage.body);
        break;
      case Page.UPDATE_RECOVERY_EMAIL:
        this.updateRecoveryEmailPage = this.createUpdateRecoveryEmailPage(
          args?.updateRecoveryEmailUsername,
        ).on("back", () => this.pageNavigator.goTo(Page.INFO));
        this.appendBodies(this.updateRecoveryEmailPage.body);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.INFO:
        this.infoPage.remove();
        break;
      case Page.UPDATE_AVATAR:
        this.updateAvatarPage.remove();
        break;
      case Page.UPDATE_ACCOUNT:
        this.updateAccountInfoPage.remove();
        break;
      case Page.UPDATE_PASSWORD:
        this.updatePasswordPage.remove();
        break;
      case Page.UPDATE_RECOVERY_EMAIL:
        this.updateRecoveryEmailPage.remove();
        break;
    }
  }

  public remove(): void {
    this.pageNavigator.remove();
  }
}
