import EventEmitter = require("events");
import { AppType } from "./app_type";
import { AuthPage } from "./auth_page/container";
import { BodyState } from "./body_state";
import { ChatPage } from "./chat_page/body";
import { ChooseAppPage } from "./choose_app_page/body";
import { AddBodiesFn } from "./common/add_bodies_fn";
import { SCHEME } from "./common/color_scheme";
import { IconButton, TooltipPosition } from "./common/icon_button";
import { ICON_MENU_BUTTON_STYLE } from "./common/icon_menu_button_styles";
import { createDotGridIcon, createSignOutIcon } from "./common/icons";
import { LOCAL_SESSION_STORAGE } from "./common/local_session_storage";
import { LOCALIZED_TEXT } from "./common/locales/localized_text";
import { PageNavigator } from "./common/page_navigator";
import { USER_SERVICE_CLIENT } from "./common/user_service_client";
import { ShowPage } from "./show_page/body";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";
import { RandomIntegerGenerator, RANDOM_INTEGER_GENERATOR } from "./common/random_integer_generator";

export enum Page {
  AUTH = 1,
  CHOOSE_APP = 2,
  CHAT = 3,
  SHOW = 4,
}

export interface BodyContainer {
  on(event: "newState", listener: (newState: BodyState) => void): this;
}

export class BodyContainer extends EventEmitter {
  // Visible for testing
  public authPage: AuthPage;
  public chooseAppPage: ChooseAppPage;
  public chatPage: ChatPage;
  public showPage: ShowPage;
  public chooseAppButton: IconButton;
  public signOutButton: IconButton;
  private topMenuContainer: HTMLDivElement;
  private leftMenuContainer: HTMLDivElement;
  private pageNavigator: PageNavigator<Page>;
  private state: BodyState;

  public constructor(
    private createAuthPage: (appendBodies: AddBodiesFn) => AuthPage,
    private createChooseAppPage: (
      currentApp: AppType,
      appendBodies: AddBodiesFn
    ) => ChooseAppPage,
    private createChatPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn,
      appendMenuBodies: AddBodiesFn
    ) => ChatPage,
    private createShowPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn,
      appendMenuBodies: AddBodiesFn
    ) => ShowPage,
    private randomIntegerGenerator: RandomIntegerGenerator,
    private localSessionStorage: LocalSessionStorage,
    private userServiceClient: WebServiceClient,
    private body: HTMLElement
  ) {
    super();
    let topMenuContainerRef = new Ref<HTMLDivElement>();
    let chooseAppButtonRef = new Ref<IconButton>();
    let signOutButtonRef = new Ref<IconButton>();
    let leftMenuContainerRef = new Ref<HTMLDivElement>();
    this.body.append(
      E.divRef(topMenuContainerRef,
        {
          class: "top-menu",
          style: `position: fixed; top: 0; right: 0; display: flex; flex-flow: row nowrap; gap: 1rem;`,
        },
        assign(
          chooseAppButtonRef,
          IconButton.create(
            `${ICON_MENU_BUTTON_STYLE}; padding: 1rem;`,
            createDotGridIcon(SCHEME.neutral1),
            TooltipPosition.BOTTOM,
            LOCALIZED_TEXT.chooseAppLabel
          )
        ).body,
        assign(
          signOutButtonRef,
          IconButton.create(
            `${ICON_MENU_BUTTON_STYLE}; padding: 1rem;`,
            createSignOutIcon(SCHEME.neutral1),
            TooltipPosition.BOTTOM,
            LOCALIZED_TEXT.signOutLabel
          )
        ).body
      ),
      E.divRef(leftMenuContainerRef, {
        class: "left-menu",
        style: `position: fixed; top: 0; left: 0; display: flex; flex-flow: column nowrap; gap: 1rem;`,
      })
    );
    this.topMenuContainer = topMenuContainerRef.val;
    this.chooseAppButton = chooseAppButtonRef.val;
    this.signOutButton = signOutButtonRef.val;
    this.leftMenuContainer = leftMenuContainerRef.val;

    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page),
      (page) => this.updatePage(page)
    );

    this.chooseAppButton.on("action", () =>
      this.pageNavigator.goTo(Page.CHOOSE_APP)
    );
    this.signOutButton.on("action", () => this.signOut());
    this.userServiceClient.on("unauthenticated", () => this.signOut());
  }

  public static create(body: HTMLElement): BodyContainer {
    return new BodyContainer(
      AuthPage.create,
      ChooseAppPage.create,
      ChatPage.create,
      ShowPage.create,
      RANDOM_INTEGER_GENERATOR,
      LOCAL_SESSION_STORAGE,
      USER_SERVICE_CLIENT,
      body
    );
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.AUTH:
        this.authPage = this.createAuthPage((...bodies) =>
          this.body.append(...bodies)
        ).on("signedIn", () => this.goToStateAppOrAuth());
        break;
      case Page.CHOOSE_APP:
        this.chooseAppPage = this.createChooseAppPage(
          this.state.app,
          (...bodies) => this.body.append(...bodies)
        )
          .on("back", () => this.goToStateAppOrAuth())
          .on("chosen", (chosenApp) => {
            this.updateState({
              app: chosenApp,
            });
            this.emit("newState", this.state);
          });
        break;
      case Page.CHAT:
        this.chatPage = this.createChatPage(
          (...bodies) => this.body.append(...bodies),
          (...bodies) => this.leftMenuContainer.prepend(...bodies),
          (...bodies) => this.leftMenuContainer.append(...bodies)
        ).on("newState", (newState) => {
          this.state.chat = newState;
          this.emit("newState", this.state);
        });
        this.chatPage.updateState(this.state.chat);
        break;
      case Page.SHOW:
        this.showPage = this.createShowPage(
          (...bodies) => this.body.append(...bodies),
          (...bodies) => this.leftMenuContainer.prepend(...bodies),
          (...bodies) => this.leftMenuContainer.append(...bodies)
        ).on("newState", (newState) => {
          this.state.show = newState;
          this.emit("newState", this.state);
        });
        this.showPage.updateState(this.state.show);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.AUTH:
        this.authPage.remove();
        break;
      case Page.CHOOSE_APP:
        this.chooseAppPage.remove();
        break;
      case Page.CHAT:
        this.chatPage.remove();
        break;
      case Page.SHOW:
        this.showPage.remove();
        break;
    }
  }

  private updatePage(page: Page): void {
    switch (page) {
      case Page.CHAT:
        this.chatPage.updateState(this.state.chat);
        break;
      case Page.SHOW:
        this.showPage.updateState(this.state.show);
        break;
    }
  }

  public updateState(newState?: BodyState): void {
    if (!newState) {
      newState = {};
    }
    if (!newState.app) {
      newState.app = this.randomIntegerGenerator.get(1, 2);
    }
    this.state = newState;
    this.goToStateAppOrAuth();
  }

  private goToStateAppOrAuth(): void {
    if (!this.localSessionStorage.read()) {
      this.pageNavigator.goTo(Page.AUTH);
      return;
    }

    switch (this.state.app) {
      case AppType.Chat:
        this.pageNavigator.goTo(Page.CHAT);
        break;
      case AppType.Show:
        this.pageNavigator.goTo(Page.SHOW);
        break;
    }
  }

  private signOut(): void {
    this.localSessionStorage.clear();
    this.goToStateAppOrAuth();
  }

  public remove(): void {
    this.topMenuContainer.remove();
    this.leftMenuContainer.remove();
    this.pageNavigator.remove();
  }
}
