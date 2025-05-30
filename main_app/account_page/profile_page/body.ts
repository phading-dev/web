import EventEmitter = require("events");
import { AddBodiesFn } from "../../../common/add_bodies_fn";
import { TabSwitcher } from "../../../common/page_navigator";
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

  private pageSwitcher = new TabSwitcher<Page>();
  public infoPage: InfoPage;
  public updateAvatarPage: UpdateAvatarPage;
  public updateAccountInfoPage: UpdateAccountInfoPage;
  public updatePasswordPage: UpdatePasswordPage;
  public updateRecoveryEmailPage: UpdateRecoveryEmailPage;

  public constructor(
    private createInfoPage: () => InfoPage,
    private createUpdateAvatarPage: (
      accountInfo: AccountAndUser,
    ) => UpdateAvatarPage,
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
    this.pageSwitcher.goTo(
      Page.INFO,
      () => this.addInfoPage(),
      () => this.infoPage.remove(),
    );
  }

  private addInfoPage(): void {
    this.infoPage = this.createInfoPage()
      .on("updateAvatar", (accountInfo) =>
        this.pageSwitcher.goTo(
          Page.UPDATE_AVATAR,
          () => this.addUpdateAvatarPage(accountInfo),
          () => this.updateAvatarPage.remove(),
        ),
      )
      .on("updateAccountInfo", (accountInfo) =>
        this.pageSwitcher.goTo(
          Page.UPDATE_ACCOUNT,
          () => this.addUpdateAccountInfoPage(accountInfo),
          () => this.updateAccountInfoPage.remove(),
        ),
      )
      .on("updatePassword", (accountInfo) =>
        this.pageSwitcher.goTo(
          Page.UPDATE_PASSWORD,
          () => this.addUpdatePasswordPage(accountInfo.username),
          () => this.updatePasswordPage.remove(),
        ),
      )
      .on("updateRecoveryEmail", (accountInfo) =>
        this.pageSwitcher.goTo(
          Page.UPDATE_RECOVERY_EMAIL,
          () => this.addUpdateRecoveryEmailPage(accountInfo.username),
          () => this.updateRecoveryEmailPage.remove(),
        ),
      )
      .on("switchAccount", () => this.emit("switchAccount"))
      .on("signOut", () => this.emit("signOut"));
    this.appendBodies(this.infoPage.body);
  }

  private addUpdateAvatarPage(accountInfo: AccountAndUser): void {
    this.updateAvatarPage = this.createUpdateAvatarPage(accountInfo).on(
      "back",
      () =>
        this.pageSwitcher.goTo(
          Page.INFO,
          () => this.addInfoPage(),
          () => this.infoPage.remove(),
        ),
    );
    this.appendBodies(this.updateAvatarPage.body);
  }

  private addUpdateAccountInfoPage(accountInfo: AccountAndUser): void {
    this.updateAccountInfoPage = this.createUpdateAccountInfoPage(
      accountInfo,
    ).on("back", () =>
      this.pageSwitcher.goTo(
        Page.INFO,
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
    this.appendBodies(this.updateAccountInfoPage.body);
  }

  private addUpdatePasswordPage(username: string): void {
    this.updatePasswordPage = this.createUpdatePasswordPage(username).on(
      "back",
      () =>
        this.pageSwitcher.goTo(
          Page.INFO,
          () => this.addInfoPage(),
          () => this.infoPage.remove(),
        ),
    );
    this.appendBodies(this.updatePasswordPage.body);
  }

  private addUpdateRecoveryEmailPage(username: string): void {
    this.updateRecoveryEmailPage = this.createUpdateRecoveryEmailPage(
      username,
    ).on("back", () =>
      this.pageSwitcher.goTo(
        Page.INFO,
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
    this.appendBodies(this.updateRecoveryEmailPage.body);
  }

  public remove(): void {
    this.pageSwitcher.remove();
  }
}
