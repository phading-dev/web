import EventEmitter = require("events");
import LRU = require("lru-cache");
import { AuthPage } from "./auth_page/container";
import { AddBodiesFn } from "./common/add_bodies_fn";
import { LOCAL_SESSION_STORAGE } from "./common/local_session_storage";
import { PageNavigator } from "./common/page_navigator";
import { WEB_SERVICE_CLIENT } from "./common/web_service_client";
import { ContentPage } from "./content_page/container";
import { WRITE_TALE_PAGE_CACHE } from "./content_page/home_page/container";
import { QUICK_TALES_LIST_PAGE_CACHE } from "./content_page/home_page/quick_tales_page/container";
import { QuickTalesListPage } from "./content_page/home_page/quick_tales_page/quick_tales_list_page/container";
import { WriteTalePage } from "./content_page/home_page/write_tale_page/container";
import { ContentPageState } from "./content_page/state";
import { E } from "@selfage/element/factory";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

export enum Page {
  CONTENT = 1,
  AUTH = 2,
}

export interface BodyContainer {
  on(event: "newState", listener: (newState: ContentPageState) => void): this;
}

export class BodyContainer extends EventEmitter {
  // Visible for testing
  public authPage: AuthPage;
  public contentPage: ContentPage;
  private menuContainer: HTMLDivElement;
  private controllerContainer: HTMLDivElement;
  private pageNavigator: PageNavigator<Page>;
  private state: ContentPageState;

  public constructor(
    private createAuthPage: (appendBodies: AddBodiesFn) => AuthPage,
    private createContentPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn,
      appendMenuBodies: AddBodiesFn,
      appendControllerBodies: AddBodiesFn
    ) => ContentPage,
    private quickTalesListPageCache: LRU<string, QuickTalesListPage>,
    private writeTalePageCache: LRU<string, WriteTalePage>,
    private localSessionStorage: LocalSessionStorage,
    private webServiceClient: WebServiceClient,
    private body: HTMLElement
  ) {
    super();
    this.menuContainer = E.div({
      class: "menu-items-container",
      style: `position: fixed; top: 0; left: 0; display: flex; flex-flow: column nowrap; gap: 1rem;`,
    });
    this.controllerContainer = E.div({
      class: "controller-items-container",
      style: `position: fixed; bottom: 0; right: 0; display: flex; flex-flow: column-reverse nowrap; gap: 1rem;`,
    });
    this.body.append(this.menuContainer, this.controllerContainer);

    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page),
      (page) => this.updatePage(page)
    );

    this.webServiceClient.on("unauthenticated", () => this.signOut());
  }

  public static create(body: HTMLElement): BodyContainer {
    return new BodyContainer(
      AuthPage.create,
      ContentPage.create,
      QUICK_TALES_LIST_PAGE_CACHE,
      WRITE_TALE_PAGE_CACHE,
      LOCAL_SESSION_STORAGE,
      WEB_SERVICE_CLIENT,
      body
    );
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.AUTH: {
        this.authPage = this.createAuthPage((...bodies) =>
          this.body.append(...bodies)
        );
        this.authPage.on("signedIn", () => this.refresh());
        break;
      }
      case Page.CONTENT: {
        this.contentPage = this.createContentPage(
          (...bodies) => this.body.append(...bodies),
          (...bodies) => this.menuContainer.prepend(...bodies),
          (...bodies) => this.menuContainer.append(...bodies),
          (...bodies) => this.controllerContainer.append(...bodies)
        );
        this.contentPage.on("signOut", () => this.signOut());
        this.contentPage.on("newState", (state) =>
          this.emit("newState", state)
        );
        this.contentPage.updateState(this.state);
        break;
      }
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.AUTH:
        this.authPage.remove();
        break;
      case Page.CONTENT:
        this.contentPage.remove();
        break;
    }
  }

  private signOut(): void {
    this.quickTalesListPageCache.clear();
    this.writeTalePageCache.clear();
    this.localSessionStorage.clear();
    this.refresh();
  }

  private refresh(): void {
    if (this.localSessionStorage.read()) {
      this.pageNavigator.goTo(Page.CONTENT);
    } else {
      this.pageNavigator.goTo(Page.AUTH);
    }
  }

  private updatePage(page: Page): void {
    if (page === Page.CONTENT) {
      this.contentPage.updateState(this.state);
    }
  }

  public updateState(newState?: ContentPageState): void {
    this.state = newState;
    this.refresh();
  }

  public remove(): void {
    this.pageNavigator.remove();
  }
}
