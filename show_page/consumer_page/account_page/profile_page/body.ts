import EventEmitter = require("events");
import { AddBodiesFn } from "../../../../common/add_bodies_fn";
import { PageNavigator } from "../../../../common/page_navigator";
import { BasicInfoPage } from "./basic_info_page/body";
import { UpdateAccountInfoPage } from "./update_account_info/body";
import { UpdateAvatarPage } from "./update_avatar_page/body";
import { UpdatePasswordPage } from "./update_password_page/body";
import { UpdateRecoveryEmailPage } from "./update_recovery_email_page/body";
import { UpdateUsernamePage } from "./update_username_page/body";
import { AccountAndUser } from "@phading/user_service_interface/self/frontend/account";

enum Page {
  BASIC_INFO = 1,
  UPDATE_AVATAR = 2,
  UPDATE_ACCOUNT = 3,
  UPDATE_PASSWORD = 4,
  UPDATE_RECOVERY_EMAIL = 5,
  UPDATE_USERNAME = 6,
}

export interface ProfilePage {
  on(event: "switchAccount", listener: () => void): this;
  on(event: "signOut", listener: () => void): this;
}

export class ProfilePage extends EventEmitter {
  public static create(appendBodies: AddBodiesFn): ProfilePage {
    return new ProfilePage(
      BasicInfoPage.create,
      UpdateAvatarPage.create,
      UpdateAccountInfoPage.create,
      UpdatePasswordPage.create,
      UpdateRecoveryEmailPage.create,
      UpdateUsernamePage.create,
      appendBodies,
    );
  }

  public basicInfoPage: BasicInfoPage;
  public updateAvatarPage: UpdateAvatarPage;
  public updateAccountInfoPage: UpdateAccountInfoPage;
  public updatePasswordPage: UpdatePasswordPage;
  public updateRecoveryEmailPage: UpdateRecoveryEmailPage;
  public updateUsernamePage: UpdateUsernamePage;
  private pageNavigator: PageNavigator<Page>;
  private accountInfo: AccountAndUser;

  public constructor(
    private createBasicInfoPage: () => BasicInfoPage,
    private createUpdateAvatarPage: () => UpdateAvatarPage,
    private createUpdateAccountInfoPage: (
      accountInfo: AccountAndUser,
    ) => UpdateAccountInfoPage,
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
    this.pageNavigator.goTo(Page.BASIC_INFO);
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.BASIC_INFO:
        this.basicInfoPage = this.createBasicInfoPage()
          .on("updateAvatar", () => this.pageNavigator.goTo(Page.UPDATE_AVATAR))
          .on("updateAccountInfo", (accountInfo) => {
            this.accountInfo = accountInfo;
            this.pageNavigator.goTo(Page.UPDATE_ACCOUNT);
          })
          .on("updatePassword", () =>
            this.pageNavigator.goTo(Page.UPDATE_PASSWORD),
          )
          .on("updateRecoveryEmail", () =>
            this.pageNavigator.goTo(Page.UPDATE_RECOVERY_EMAIL),
          )
          .on("updateUsername", () =>
            this.pageNavigator.goTo(Page.UPDATE_USERNAME),
          )
          .on("switchAccount", () => this.emit("switchAccount"))
          .on("signOut", () => this.emit("signOut"));
        this.appendBodies(this.basicInfoPage.body);
        break;
      case Page.UPDATE_AVATAR:
        this.updateAvatarPage = this.createUpdateAvatarPage()
          .on("back", () => this.pageNavigator.goTo(Page.BASIC_INFO))
          .on("updated", () => this.pageNavigator.goTo(Page.BASIC_INFO));
        this.appendBodies(this.updateAvatarPage.body);
        break;
      case Page.UPDATE_ACCOUNT:
        this.updateAccountInfoPage = this.createUpdateAccountInfoPage(
          this.accountInfo,
        )
          .on("back", () => this.pageNavigator.goTo(Page.BASIC_INFO))
          .on("updated", () => this.pageNavigator.goTo(Page.BASIC_INFO));
        this.appendBodies(this.updateAccountInfoPage.body);
        break;
      case Page.UPDATE_PASSWORD:
        this.updatePasswordPage = this.createUpdatePasswordPage()
          .on("back", () => this.pageNavigator.goTo(Page.BASIC_INFO))
          .on("updated", () => this.pageNavigator.goTo(Page.BASIC_INFO));
        this.appendBodies(this.updatePasswordPage.body);
        break;
      case Page.UPDATE_RECOVERY_EMAIL:
        this.updateRecoveryEmailPage = this.createUpdateRecoveryEmailPage()
          .on("back", () => this.pageNavigator.goTo(Page.BASIC_INFO))
          .on("updated", () => this.pageNavigator.goTo(Page.BASIC_INFO));
        this.appendBodies(this.updateRecoveryEmailPage.body);
        break;
      case Page.UPDATE_USERNAME:
        this.updateUsernamePage = this.createUpdateUsernamePage()
          .on("back", () => this.pageNavigator.goTo(Page.BASIC_INFO))
          .on("updated", () => this.pageNavigator.goTo(Page.BASIC_INFO));
        this.appendBodies(this.updateUsernamePage.body);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.BASIC_INFO:
        this.basicInfoPage.remove();
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
      case Page.UPDATE_USERNAME:
        this.updateUsernamePage.remove();
    }
  }

  public remove(): void {
    this.pageNavigator.remove();
  }
}
