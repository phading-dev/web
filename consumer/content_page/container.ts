import EventEmitter = require("events");
import { AccountPage } from "./account_page/container";
import { HomePage } from "./home_page/container";
import { MenuItem } from "./menu_item/container";
import { createAccountMenuItem, createHomeMenuItem } from "./menu_item/factory";
import { CONTENT_PAGE_STATE, ContentPageState, Page } from "./state";
import { E } from "@selfage/element/factory";
import { copyMessage } from "@selfage/message/copier";
import { LazyInstance } from "@selfage/once/lazy_instance";
import { Ref, assign } from "@selfage/ref";

export interface ContentPage {
  on(event: "signOut", listener: () => void): this;
  on(event: "newState", listener: (newState: ContentPageState) => void): this;
}

export class ContentPage extends EventEmitter {
  public menuItemsBody: HTMLDivElement;
  public controllerItemsBody: HTMLDivElement;
  // Visible for testing
  public homeMenuItem: MenuItem;
  public accountMenuItem: MenuItem;
  private lazyHomePage: LazyInstance<HomePage>;
  private lazyAccountPage: LazyInstance<AccountPage>;
  private state: ContentPageState = {};

  public constructor(
    private homePageFactoryFn: (
      appendBodiesFn: (bodies: Array<HTMLElement>) => void,
      prependMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void,
      appendMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void,
      appendControllerBodiesFn: (controllerBodies: Array<HTMLElement>) => void
    ) => HomePage,
    private accountPageFactoryFn: (
      prependMenuBodiesFn: (menuBodies: Array<HTMLElement>) => void
    ) => AccountPage,
    private appendBodiesFn: (bodies: Array<HTMLElement>) => void
  ) {
    super();
    let homeMenuItemRef = new Ref<MenuItem>();
    let accountMenuItemRef = new Ref<MenuItem>();
    this.menuItemsBody = E.div(
      {
        class: "content-menu-items",
        style: `position: fixed; flex-flow: column nowrap; gap: 1rem;`,
      },
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
      assign(homeMenuItemRef, createHomeMenuItem().show()).body,
      assign(accountMenuItemRef, createAccountMenuItem().show()).body
    );
    this.homeMenuItem = homeMenuItemRef.val;
    this.accountMenuItem = accountMenuItemRef.val;

    this.controllerItemsBody = E.div({
      class: "content-controller-items",
      style: `position: fixed; right: 0; bottom: 0; flex-flow: column-reverse nowrap;`,
    });

    this.lazyHomePage = new LazyInstance(() => {
      let page = this.homePageFactoryFn(
        this.appendBodiesFn,
        (menuBodies) => this.menuItemsBody.prepend(...menuBodies),
        (menuBodies) => this.menuItemsBody.append(...menuBodies),
        (controllerBodies) =>
          this.controllerItemsBody.append(...controllerBodies)
      );
      page.on("newState", (newState) => {
        this.state.home = newState;
        this.emit("newState", this.state);
      });
      return page;
    });
    this.lazyAccountPage = new LazyInstance(() => {
      let page = this.accountPageFactoryFn((menuBodies) =>
        this.menuItemsBody.prepend(...menuBodies)
      );
      this.appendBodiesFn([page.body]);
      page.on("newState", (newState) => {
        this.state.account = newState;
        this.emit("newState", this.state);
      });
      return page;
    });

    this.homeMenuItem.on("action", () => this.goToHomePage());
    this.accountMenuItem.on("action", () => this.goToAccountPage());
  }

  public static create(
    appendBodiesFn: (bodies: Array<HTMLElement>) => void
  ): ContentPage {
    return new ContentPage(HomePage.create, AccountPage.create, appendBodiesFn);
  }

  private goToHomePage(): void {
    let newState = copyMessage(this.state, CONTENT_PAGE_STATE);
    newState.page = Page.Home;
    newState.home = undefined;
    this.showFromInternal(newState);
  }

  private goToAccountPage(): void {
    let newState = copyMessage(this.state, CONTENT_PAGE_STATE);
    newState.page = Page.Account;
    newState.account = undefined;
    this.showFromInternal(newState);
  }

  private showFromInternal(newState: ContentPageState): void {
    this.show(newState);
    this.emit("newState", this.state);
  }

  public show(newState?: ContentPageState): this {
    this.menuItemsBody.style.display = "flex";
    this.controllerItemsBody.style.display = "flex";

    if (!newState) {
      newState = {};
    }
    if (!newState.page) {
      newState.page = Page.Home;
    }
    if (newState.page !== this.state.page) {
      this.hidePage();
    }
    switch (newState.page) {
      case Page.Home:
        this.lazyHomePage.get().show(newState.home);
        break;
      case Page.Account:
        this.lazyAccountPage.get().show(newState.account);
        break;
    }
    this.state = newState;
    return this;
  }

  private hidePage(): void {
    switch (this.state.page) {
      case Page.Home:
        this.lazyHomePage.get().hide();
        break;
      case Page.Account:
        this.lazyAccountPage.get().hide();
        break;
    }
  }

  public hide(): this {
    this.hidePage();
    this.menuItemsBody.style.display = "none";
    this.controllerItemsBody.style.display = "none";
    return this;
  }
}
