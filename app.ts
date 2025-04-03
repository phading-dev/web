import EventEmitter = require("events");
import { AddBodiesFn } from "./common/add_bodies_fn";
import { PageNavigator } from "./common/page_navigator";
import { MainApp } from "./main_app/body";
import { MarketingPage } from "./marketing_page/body";
import { App as AppUrl, Page } from "@phading/web_interface/app";

export interface App {
  on(event: "newUrl", listener: (newUrl: AppUrl) => void): this;
}

export class App extends EventEmitter {
  public static create(documentBody: HTMLElement): App {
    return new App(MainApp.create, MarketingPage.create, documentBody);
  }

  public mainApp: MainApp;
  public marketingPage: MarketingPage;
  private pageNavigator: PageNavigator<Page>;
  private url: AppUrl;

  public constructor(
    private createMainApp: (addBodiesFn: AddBodiesFn) => MainApp,
    private createMarketingPage: () => MarketingPage,
    private documentBody: HTMLElement,
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page),
      (page) => this.updatePage(page),
    );
  }

  public applyUrl(newUrl?: AppUrl): void {
    if (!newUrl) {
      newUrl = {};
    }
    if (!newUrl.main) {
      newUrl.page = Page.MAIN;
    }
    this.url = newUrl;
    this.pageNavigator.goTo(this.url.page);
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.MAIN:
        this.mainApp = this.createMainApp((...bodies) =>
          this.documentBody.append(...bodies),
        ).on("newUrl", (newUrl) => {
          this.url.main = newUrl;
          this.emit("newUrl", this.url);
        });
        break;
      case Page.MARKETING:
        this.marketingPage = this.createMarketingPage().on(
          "signUp",
          (accountType) => {
            let newUrl: AppUrl = {
              page: Page.MAIN,
              main: {
                auth: {
                  initAccountType: accountType,
                },
              },
            };
            this.applyUrl(newUrl);
            this.emit("newUrl", newUrl);
          },
        );
        this.documentBody.append(this.marketingPage.body);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.MAIN:
        this.mainApp.remove();
        break;
      case Page.MARKETING:
        this.marketingPage.remove();
        break;
    }
  }

  private updatePage(page: Page): void {
    switch (page) {
      case Page.MAIN:
        this.mainApp.checkAuthAndApplyUrl(this.url.main);
        break;
      case Page.MARKETING:
        this.marketingPage.applyUrl(this.url.marketing);
        break;
    }
  }

  public remove(): void {
    this.pageNavigator.remove();
  }
}
