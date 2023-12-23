import EventEmitter = require("events");
import { AddBodiesFn } from "../../../../common/add_bodies_fn";
import { PageNavigator } from "../../../../common/page_navigator";
import { BasicInfoPag } from "./basic_info_page/body";
import { Page, ProfilePageState } from "./state";
import { UpdateAvatarPage } from "./update_avatar_page/body";
import { UpdateContactEmailPage } from "./update_contact_email_page/body";
import { UpdateDescriptionPage } from "./update_description_page/body";
import { UpdateNaturalNamePage } from "./update_natural_name/body";

export interface ProfilePage {
  on(event: "newState", listener: (newState: ProfilePageState) => void): this;
}

export class ProfilePage extends EventEmitter {
  public static create(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn
  ): ProfilePage {
    return new ProfilePage(
      BasicInfoPag.create,
      UpdateAvatarPage.create,
      UpdateNaturalNamePage.create,
      UpdateContactEmailPage.create,
      UpdateDescriptionPage.create,
      appendBodies,
      prependMenuBodies
    );
  }

  private state: ProfilePageState;
  private basicInfoPage_: BasicInfoPag;
  private updateAvatarPage_: UpdateAvatarPage;
  private updateNaturalNamePage_: UpdateNaturalNamePage;
  private updateContactEmailPage_: UpdateContactEmailPage;
  private updateDescriptionPage_: UpdateDescriptionPage;
  private pageNavigator: PageNavigator<Page>;

  public constructor(
    private createBasicInfoPage: () => BasicInfoPag,
    private createUpdateAvatarPage: () => UpdateAvatarPage,
    private createUpdateNaturalNamePage: () => UpdateNaturalNamePage,
    private createUpdateContactEmailPage: () => UpdateContactEmailPage,
    private createUpdateDescriptionPage: () => UpdateDescriptionPage,
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
      case Page.BasicInfo:
        this.basicInfoPage_ = this.createBasicInfoPage()
          .on("updateAvatar", () => {
            this.updateState({ page: Page.UpdateAvatar });
            this.emit("newState", this.state);
          })
          .on("updateNaturalName", () => {
            this.updateState({ page: Page.UpdateNaturalName });
            this.emit("newState", this.state);
          })
          .on("updateContactEmail", () => {
            this.updateState({ page: Page.UpdateContactEmail });
            this.emit("newState", this.state);
          })
          .on("updateDescription", () => {
            this.updateState({ page: Page.UpdateDescription });
            this.emit("newState", this.state);
          });
        this.appendBodies(this.basicInfoPage_.body);
        break;
      case Page.UpdateAvatar:
        this.updateAvatarPage_ = this.createUpdateAvatarPage()
          .on("back", () => this.updateStateToBasicInfo())
          .on("updated", () => this.updateStateToBasicInfo());
        this.appendBodies(this.updateAvatarPage_.body);
        this.prependMenuBodies(this.updateAvatarPage_.backMenuBody);
        break;
      case Page.UpdateNaturalName:
        this.updateNaturalNamePage_ = this.createUpdateNaturalNamePage()
          .on("back", () => this.updateStateToBasicInfo())
          .on("updated", () => this.updateStateToBasicInfo());
        this.appendBodies(this.updateNaturalNamePage_.body);
        this.prependMenuBodies(this.updateNaturalNamePage_.menuBody);
        break;
      case Page.UpdateContactEmail:
        this.updateContactEmailPage_ = this.createUpdateContactEmailPage()
          .on("back", () => this.updateStateToBasicInfo())
          .on("updated", () => this.updateStateToBasicInfo());
        this.appendBodies(this.updateContactEmailPage_.body);
        this.prependMenuBodies(this.updateContactEmailPage_.menuBody);
        break;
      case Page.UpdateDescription:
        this.updateDescriptionPage_ = this.createUpdateDescriptionPage()
          .on("back", () => this.updateStateToBasicInfo())
          .on("updated", () => this.updateStateToBasicInfo());
        this.appendBodies(this.updateDescriptionPage_.body);
        this.prependMenuBodies(this.updateDescriptionPage_.menuBody);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.BasicInfo:
        this.basicInfoPage_.remove();
        break;
      case Page.UpdateAvatar:
        this.updateAvatarPage_.remove();
        break;
      case Page.UpdateNaturalName:
        this.updateNaturalNamePage_.remove();
        break;
      case Page.UpdateContactEmail:
        this.updateContactEmailPage_.remove();
        break;
      case Page.UpdateDescription:
        this.updateDescriptionPage_.remove();
        break;
    }
  }

  private updateStateToBasicInfo(): void {
    this.updateState({ page: Page.BasicInfo });
    this.emit("newState", this.state);
  }

  public updateState(newState?: ProfilePageState): this {
    if (!newState) {
      newState = {};
    }
    if (!newState.page) {
      newState.page = Page.BasicInfo;
    }
    this.state = newState;
    this.pageNavigator.goTo(this.state.page);
    return this;
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
  public get updateNaturalNamePage() {
    return this.updateNaturalNamePage_;
  }
  public get updateContactEmailPage() {
    return this.updateContactEmailPage_;
  }
  public get updateDescriptionPage() {
    return this.updateDescriptionPage_;
  }
}
