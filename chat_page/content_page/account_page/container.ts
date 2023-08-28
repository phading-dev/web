import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { MenuItem } from "../../common/menu_item/container";
import { createSignOutMenuItem } from "../../common/menu_item/factory";
import { PageNavigator } from "../../common/page_navigator";
import { AccountInfoPage } from "./account_info_page";
import { AccountPageState, Page } from "./state";
import { UpdateAvatarPage } from "./update_avatar_page";
import { UpdatePasswordPage } from "./update_password_page";

export interface AccountPage {
  on(event: "signOut", listener: () => void): this;
  on(event: "newState", listener: (newState: AccountPageState) => void): this;
}

export class AccountPage extends EventEmitter {
  public signOutMenuItem: MenuItem;
  public accountInfoPage: AccountInfoPage;
  public updateAvatarPage: UpdateAvatarPage;
  public updatePasswordPage: UpdatePasswordPage;
  private pageNavigator: PageNavigator<Page>;

  public constructor(
    private createAccountInfoPage: () => AccountInfoPage,
    private createUpdateAvatarPage: () => UpdateAvatarPage,
    private createUpdatePasswordPage: () => UpdatePasswordPage,
    private appendBodies: AddBodiesFn,
    private prependMenuBodies: AddBodiesFn,
    private appendMenuBodies: AddBodiesFn
  ) {
    super();
    this.signOutMenuItem = createSignOutMenuItem();
    this.appendMenuBodies(this.signOutMenuItem.body);

    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page)
    );

    this.signOutMenuItem.on("action", () => this.emit("signOut"));
  }

  public static create(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn
  ): AccountPage {
    return new AccountPage(
      AccountInfoPage.create,
      UpdateAvatarPage.create,
      UpdatePasswordPage.create,
      appendBodies,
      prependMenuBodies,
      appendMenuBodies
    );
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.AccountInfo:
        this.accountInfoPage = this.createAccountInfoPage();
        this.appendBodies(this.accountInfoPage.body);
        this.accountInfoPage.on("updateAvatar", () =>
          this.updateStateAndBubbleUp(Page.UpdateAvatar)
        );
        this.accountInfoPage.on("updatePassword", () =>
          this.updateStateAndBubbleUp(Page.UpdatePassword)
        );
        break;
      case Page.UpdateAvatar:
        this.updateAvatarPage = this.createUpdateAvatarPage();
        this.appendBodies(this.updateAvatarPage.body);
        this.prependMenuBodies(this.updateAvatarPage.backMenuBody);
        this.updateAvatarPage.on("back", () =>
          this.updateStateAndBubbleUp(Page.AccountInfo)
        );
        this.updateAvatarPage.on("updated", () =>
          this.updateStateAndBubbleUp(Page.AccountInfo)
        );
        break;
      case Page.UpdatePassword:
        this.updatePasswordPage = this.createUpdatePasswordPage();
        this.appendBodies(this.updatePasswordPage.body);
        this.prependMenuBodies(this.updatePasswordPage.backMenuBody);
        this.updatePasswordPage.on("back", () =>
          this.updateStateAndBubbleUp(Page.AccountInfo)
        );
        this.updatePasswordPage.on("updated", () =>
          this.updateStateAndBubbleUp(Page.AccountInfo)
        );
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.AccountInfo:
        this.accountInfoPage.remove();
        break;
      case Page.UpdateAvatar:
        this.updateAvatarPage.remove();
        break;
      case Page.UpdatePassword:
        this.updatePasswordPage.remove();
        break;
    }
  }

  private updateStateAndBubbleUp(page: Page): void {
    this.updateState({ page });
    this.emit("newState", { page });
  }

  public updateState(newState?: AccountPageState): void {
    if (!newState) {
      newState = {};
    }
    if (!newState.page) {
      newState.page = Page.AccountInfo;
    }
    this.pageNavigator.goTo(newState.page);
  }

  public remove(): void {
    this.pageNavigator.remove();
    this.signOutMenuItem.remove();
  }
}
