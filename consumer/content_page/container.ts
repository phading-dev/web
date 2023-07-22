import EventEmitter = require("events");
import { MenuItem } from "../common/menu_item/container";
import {
  createAccountMenuItem,
  createHomeMenuItem,
} from "../common/menu_item/factory";
import { PageNavigator } from "../common/page_navigator";
import { AccountPage } from "./account_page/container";
import { HomePage } from "./home_page/container";
import { ContentPageState, Page } from "./state";

export interface ContentPage {
  on(event: "signOut", listener: () => void): this;
  on(event: "newState", listener: (newState: ContentPageState) => void): this;
}

export class ContentPage extends EventEmitter {
  // Visible for testing
  public homeMenuItem: MenuItem;
  public accountMenuItem: MenuItem;
  public homePage: HomePage;
  public accountPage: AccountPage;
  private pageNavigator: PageNavigator<Page>;
  private state: ContentPageState = {};

  public constructor(
    private homePageFactoryFn: (
      appendBodiesFn: (...bodies: Array<HTMLElement>) => void,
      prependMenuBodiesFn: (...bodies: Array<HTMLElement>) => void,
      appendMenuBodiesFn: (...bodies: Array<HTMLElement>) => void,
      appendControllerBodiesFn: (...bodies: Array<HTMLElement>) => void
    ) => HomePage,
    private accountPageFactoryFn: (
      appendBodiesFn: (...bodies: Array<HTMLElement>) => void,
      prependMenuBodiesFn: (...bodies: Array<HTMLElement>) => void
    ) => AccountPage,
    private appendBodiesFn: (...bodies: Array<HTMLElement>) => void,
    private prependMenuBodiesFn: (...bodies: Array<HTMLElement>) => void,
    private appendMenuBodiesFn: (...bodies: Array<HTMLElement>) => void,
    private appendControllerBodiesFn: (...bodies: Array<HTMLElement>) => void
  ) {
    super();
    // Logo SVG
    // E.div(
    //   {
    //     class: "content-menu-logo",
    //     style: `width: 5rem; height: 5rem; border-radius: 5rem; transition: background-color .3s linear;`,
    //   },
    //   E.svg(
    //     {
    //       class: "content-menu-logo-svg",
    //       style: `height: 100%;`,
    //       viewBox: "-10 -10 220 220",
    //     },
    //     E.path({
    //       fill: SCHEME.logoOrange,
    //       d: `M 111.6 20.8 A 30 30 0 0 0 162.7 50.3 A 80 80 0 0 1 174.3 70.5 A 30 30 0 0 0 174.3 129.5 A 80 80 0 0 1 162.7 149.7 A 30 30 0 0 0 111.6 179.2 A 80 80 0 0 1 88.4 179.2 A 30 30 0 0 0 37.3 149.7 A 80 80 0 0 1 25.7 129.5 A 30 30 0 0 0 25.7 70.5 A 80 80 0 0 1 37.3 50.3 A 30 30 0 0 0 88.4 20.8 A 80 80 0 0 1 111.6 20.801 z  M 70 100 A 30 30 0 1 0 70 99.9 z`,
    //     }),
    //     E.path({
    //       fill: SCHEME.logoBlue,
    //       d: `M 80 100 A 20 20 0 1 1 80 100.01 z  M 160 100 A 20 20 0 1 1 160 100.01 z  M 120 169.3 A 20 20 0 1 1 120 169.31 z  M 40 169.3 A 20 20 0 1 1 40 169.31 z  M 0 100 A 20 20 0 1 1 0 100.01 z  M 40 30.7 A 20 20 0 1 1 40 30.71 z`,
    //     })
    //   )
    // ),

    this.homeMenuItem = createHomeMenuItem();
    this.accountMenuItem = createAccountMenuItem();
    this.appendMenuBodiesFn(this.homeMenuItem.body, this.accountMenuItem.body);

    this.pageNavigator = new PageNavigator(
      (page) => this.showPage(page),
      (page) => this.removePage(page),
      (page) => this.updatePage(page)
    );

    this.homeMenuItem.on("action", () =>
      this.updateStateAndBubbleUp({
        page: Page.Home,
      })
    );
    this.accountMenuItem.on("action", () =>
      this.updateStateAndBubbleUp({
        page: Page.Account,
      })
    );
  }

  public static create(
    appendBodiesFn: (...bodies: Array<HTMLElement>) => void,
    prependMenuBodiesFn: (...bodies: Array<HTMLElement>) => void,
    appendMenuBodiesFn: (...bodies: Array<HTMLElement>) => void,
    appendControllerBodiesFn: (...bodies: Array<HTMLElement>) => void
  ): ContentPage {
    return new ContentPage(
      HomePage.create,
      AccountPage.create,
      appendBodiesFn,
      prependMenuBodiesFn,
      appendMenuBodiesFn,
      appendControllerBodiesFn
    );
  }

  private showPage(page: Page): void {
    switch (page) {
      case Page.Home: {
        this.homePage = this.homePageFactoryFn(
          this.appendBodiesFn,
          this.prependMenuBodiesFn,
          this.appendMenuBodiesFn,
          this.appendControllerBodiesFn
        );
        this.homePage.on("newState", (newState) => {
          this.state.home = newState;
          this.emit("newState", this.state);
        });
        this.homePage.updateState(this.state.home);
        break;
      }
      case Page.Account: {
        this.accountPage = this.accountPageFactoryFn(
          this.appendBodiesFn,
          this.prependMenuBodiesFn
        );
        this.accountPage.on("newState", (newState) => {
          this.state.account = newState;
          this.emit("newState", this.state);
        });
        this.accountPage.updateState(this.state.account);
        break;
      }
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.Home:
        this.homePage.remove();
        break;
      case Page.Account:
        this.accountPage.remove();
        break;
    }
  }

  private updatePage(page: Page): void {
    switch (page) {
      case Page.Home:
        this.homePage.updateState(this.state.home);
        break;
      case Page.Account:
        this.accountPage.updateState(this.state.account);
        break;
    }
  }

  private updateStateAndBubbleUp(newState: ContentPageState): void {
    this.updateState(newState);
    this.emit("newState", this.state);
  }

  public updateState(newState?: ContentPageState): void {
    if (!newState) {
      newState = {};
    }
    if (!newState.page) {
      newState.page = Page.Home;
    }
    this.state = newState;
    this.pageNavigator.goTo(this.state.page);
  }

  public remove(): void {
    this.pageNavigator.remove();
    this.homeMenuItem.remove();
    this.accountMenuItem.remove();
  }
}
