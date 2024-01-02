import EventEmitter = require("events");
import { AddBodiesFn } from "../../../../common/add_bodies_fn";
import { PageNavigator } from "../../../../common/page_navigator";
import { BasicInfoPag } from "./basic_info_page/body";
import { UpdateAccountInfoPage } from "./update_account_info/body";
import { UpdateAvatarPage } from "./update_avatar_page/body";
import { Account } from "@phading/user_service_interface/self/web/account";

enum Page {
  BASIC_INFO = 1,
  UPDATE_AVATAR = 2,
  UPDATE_ACCOUNT = 3,
}

export class ProfilePage extends EventEmitter {
  public static create(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn
  ): ProfilePage {
    return new ProfilePage(
      BasicInfoPag.create,
      UpdateAvatarPage.create,
      UpdateAccountInfoPage.create,
      appendBodies,
      prependMenuBodies
    );
  }

  private basicInfoPage_: BasicInfoPag;
  private updateAvatarPage_: UpdateAvatarPage;
  private updateAccountInfoPage_: UpdateAccountInfoPage;
  private pageNavigator: PageNavigator<Page>;
  private accountInfo: Account;

  public constructor(
    private createBasicInfoPage: () => BasicInfoPag,
    private createUpdateAvatarPage: () => UpdateAvatarPage,
    private createUpdateAccountInfoPage: (
      accountInfo: Account
    ) => UpdateAccountInfoPage,
    private appendBodies: AddBodiesFn,
    private prependMenuBodies: AddBodiesFn
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page)
    );
    this.pageNavigator.goTo(Page.BASIC_INFO);
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.BASIC_INFO:
        this.basicInfoPage_ = this.createBasicInfoPage()
          .on("updateAvatar", () => this.pageNavigator.goTo(Page.UPDATE_AVATAR))
          .on("updateAccountInfo", (accountInfo) => {
            this.accountInfo = accountInfo;
            this.pageNavigator.goTo(Page.UPDATE_ACCOUNT);
          });
        this.appendBodies(this.basicInfoPage_.body);
        break;
      case Page.UPDATE_AVATAR:
        this.updateAvatarPage_ = this.createUpdateAvatarPage()
          .on("back", () => this.pageNavigator.goTo(Page.BASIC_INFO))
          .on("updated", () => this.pageNavigator.goTo(Page.BASIC_INFO));
        this.appendBodies(this.updateAvatarPage_.body);
        this.prependMenuBodies(this.updateAvatarPage_.backMenuBody);
        break;
      case Page.UPDATE_ACCOUNT:
        this.updateAccountInfoPage_ = this.createUpdateAccountInfoPage(
          this.accountInfo
        )
          .on("back", () => this.pageNavigator.goTo(Page.BASIC_INFO))
          .on("updated", () => this.pageNavigator.goTo(Page.BASIC_INFO));
        this.appendBodies(this.updateAccountInfoPage_.body);
        this.prependMenuBodies(this.updateAccountInfoPage_.menuBody);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.BASIC_INFO:
        this.basicInfoPage_.remove();
        break;
      case Page.UPDATE_AVATAR:
        this.updateAvatarPage_.remove();
        break;
      case Page.UPDATE_ACCOUNT:
        this.updateAccountInfoPage_.remove();
        break;
    }
  }

  public remove(): void {
    this.pageNavigator.remove();
  }

  // Visible for testing
  public get basicInfoPage() {
    return this.basicInfoPage_;
  }
  public get updateAvatarPage() {
    return this.updateAvatarPage_;
  }
  public get updateAccountInfoPage() {
    return this.updateAccountInfoPage_;
  }
}
