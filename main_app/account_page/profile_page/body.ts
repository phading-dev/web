import EventEmitter = require("events");
import { AddBodiesFn } from "../../../common/add_bodies_fn";
import { TabSwitcher } from "../../../common/page_navigator";
import { InfoPage } from "./info_page/body";
import { UpdateAccountInfoPage } from "./update_account_info_page/body";
import { UpdateAvatarPage } from "./update_avatar_page/body";
import { UpdatePasswordPage } from "./update_password_page/body";
import { UpdateUserEmailPage } from "./update_user_email_page/body";
import { AccountAndUser } from "@phading/user_service_interface/web/self/account";

export interface ProfilePage {
  on(event: "chooseAccount", listener: () => void): this;
  on(event: "signOut", listener: () => void): this;
}

export class ProfilePage extends EventEmitter {
  public static create(appendBodies: AddBodiesFn): ProfilePage {
    return new ProfilePage(
      InfoPage.create,
      UpdateAvatarPage.create,
      UpdateAccountInfoPage.create,
      UpdatePasswordPage.create,
      UpdateUserEmailPage.create,
      appendBodies,
    );
  }

  private pageSwitcher = new TabSwitcher();
  public infoPage: InfoPage;
  public updateAvatarPage: UpdateAvatarPage;
  public updateAccountInfoPage: UpdateAccountInfoPage;
  public updatePasswordPage: UpdatePasswordPage;
  public updateUserEmailPage: UpdateUserEmailPage;

  public constructor(
    private createInfoPage: () => InfoPage,
    private createUpdateAvatarPage: typeof UpdateAvatarPage.create,
    private createUpdateAccountInfoPage: typeof UpdateAccountInfoPage.create,
    private createUpdatePasswordPage: typeof UpdatePasswordPage.create,
    private createUpdateUserEmailPage: typeof UpdateUserEmailPage.create,
    private appendBodies: AddBodiesFn,
  ) {
    super();
    this.pageSwitcher.goTo(
      () => this.addInfoPage(),
      () => this.infoPage.remove(),
    );
  }

  private addInfoPage(): void {
    this.infoPage = this.createInfoPage()
      .on("updateAvatar", (accountInfo) =>
        this.pageSwitcher.goTo(
          () => this.addUpdateAvatarPage(accountInfo),
          () => this.updateAvatarPage.remove(),
        ),
      )
      .on("updateAccountInfo", (accountInfo) =>
        this.pageSwitcher.goTo(
          () => this.addUpdateAccountInfoPage(accountInfo),
          () => this.updateAccountInfoPage.remove(),
        ),
      )
      .on("updatePassword", (accountInfo) =>
        this.pageSwitcher.goTo(
          () => this.addUpdatePasswordPage(accountInfo.userEmail),
          () => this.updatePasswordPage.remove(),
        ),
      )
      .on("updateUserEmail", (accountInfo) =>
        this.pageSwitcher.goTo(
          () => this.addUpdateUserEmailPage(accountInfo),
          () => this.updateUserEmailPage.remove(),
        ),
      )
      .on("chooseAccount", () => this.emit("chooseAccount"))
      .on("signOut", () => this.emit("signOut"));
    this.appendBodies(this.infoPage.body);
  }

  private addUpdateAvatarPage(accountInfo: AccountAndUser): void {
    this.updateAvatarPage = this.createUpdateAvatarPage(accountInfo).on(
      "back",
      () =>
        this.pageSwitcher.goTo(
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
        () => this.addInfoPage(),
        () => this.infoPage.remove(),
      ),
    );
    this.appendBodies(this.updateAccountInfoPage.body);
  }

  private addUpdatePasswordPage(userEmail: string): void {
    this.updatePasswordPage = this.createUpdatePasswordPage(userEmail).on(
      "back",
      () =>
        this.pageSwitcher.goTo(
          () => this.addInfoPage(),
          () => this.infoPage.remove(),
        ),
    );
    this.appendBodies(this.updatePasswordPage.body);
  }

  private addUpdateUserEmailPage(account: AccountAndUser): void {
    this.updateUserEmailPage = this.createUpdateUserEmailPage(account)
      .on("back", () =>
        this.pageSwitcher.goTo(
          () => this.addInfoPage(),
          () => this.infoPage.remove(),
        ),
      )
      .on("signOut", () => this.emit("signOut"));
    this.appendBodies(this.updateUserEmailPage.body);
  }

  public remove(): void {
    this.pageSwitcher.remove();
    this.removeAllListeners();
  }
}
