import EventEmitter = require("events");
import { PageNavigator } from "../../common/page_navigator";
import { AccountInfoPage } from "./account_info_page";
import { AccountPageState, Page } from "./state";
import { UpdateAvatarPage } from "./update_avatar_page";
import { UpdatePasswordPage } from "./update_password_page";

export interface AccountPage {
  on(event: "newState", listener: (newState: AccountPageState) => void): this;
}

export class AccountPage extends EventEmitter {
  public accountInfoPage: AccountInfoPage;
  public updateAvatarPage: UpdateAvatarPage;
  public updatePasswordPage: UpdatePasswordPage;
  private pageNavigator: PageNavigator<Page>;

  public constructor(
    private accountInfoPageFactoryFn: () => AccountInfoPage,
    private updateAvatarPageFactoryFn: () => UpdateAvatarPage,
    private updatePasswordPageFactoryFn: () => UpdatePasswordPage,
    private appendBodiesFn: (...bodies: Array<HTMLElement>) => void,
    private prependMenuBodiesFn: (...bodies: Array<HTMLElement>) => void
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page)
    );
  }

  public static create(
    appendBodiesFn: (...bodies: Array<HTMLElement>) => void,
    prependMenuBodiesFn: (...bodies: Array<HTMLElement>) => void
  ): AccountPage {
    return new AccountPage(
      AccountInfoPage.create,
      UpdateAvatarPage.create,
      UpdatePasswordPage.create,
      appendBodiesFn,
      prependMenuBodiesFn
    );
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.AccountInfo:
        this.accountInfoPage = this.accountInfoPageFactoryFn();
        this.appendBodiesFn(this.accountInfoPage.body);
        this.accountInfoPage.on("updateAvatar", () =>
          this.updateStateAndBubbleUp(Page.UpdateAvatar)
        );
        this.accountInfoPage.on("updatePassword", () =>
          this.updateStateAndBubbleUp(Page.UpdatePassword)
        );
        break;
      case Page.UpdateAvatar:
        this.updateAvatarPage = this.updateAvatarPageFactoryFn();
        this.appendBodiesFn(this.updateAvatarPage.body);
        this.prependMenuBodiesFn(this.updateAvatarPage.backMenuBody);
        this.updateAvatarPage.on("back", () =>
          this.updateStateAndBubbleUp(Page.AccountInfo)
        );
        this.updateAvatarPage.on("updated", () =>
          this.updateStateAndBubbleUp(Page.AccountInfo)
        );
        break;
      case Page.UpdatePassword:
        this.updatePasswordPage = this.updatePasswordPageFactoryFn();
        this.appendBodiesFn(this.updatePasswordPage.body);
        this.prependMenuBodiesFn(this.updatePasswordPage.backMenuBody);
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
  }
}
