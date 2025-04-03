import EventEmitter = require("events");
import { AddBodiesFn } from "../common/add_bodies_fn";
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { PageNavigator } from "../common/page_navigator";
import { SERVICE_CLIENT } from "../common/web_service_client";
import { AccountPage } from "./account_page/body";
import { AuthPage } from "./auth_page/body";
import { ChooseAccountPage } from "./choose_account_page/body";
import { ConsumerPage } from "./consumer_page/body";
import { PublisherPage } from "./publisher_page/body";
import { AccountType } from "@phading/user_service_interface/account_type";
import { newCheckCapabilityRequest } from "@phading/user_session_service_interface/web/client";
import { CheckCapabilityResponse } from "@phading/user_session_service_interface/web/interface";
import {
  MAIN_APP,
  MainApp as MainAppUrl,
} from "@phading/web_interface/main/app";
import { BlockingLoop } from "@selfage/blocking_loop";
import { HttpError, StatusCode } from "@selfage/http_error";
import { copyMessage } from "@selfage/message/copier";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

enum Page {
  AUTH = 1,
  CHOOSE_ACCOUNT = 2,
  ACCOUNT = 3,
  CONSUMER = 4,
  PUBLISHER = 5,
}

export interface MainApp {
  on(event: "newUrl", listener: (newUrl: MainAppUrl) => void): this;
  on(event: "urlApplied", listener: () => void): this;
}

export class MainApp extends EventEmitter {
  public static create(appendBodies: AddBodiesFn): MainApp {
    return new MainApp(
      LOCAL_SESSION_STORAGE,
      SERVICE_CLIENT,
      // Use ANIMATION_FRAME to stop looping when the tab is not focus.
      BlockingLoop.createWithAinmationFrame,
      AuthPage.create,
      ChooseAccountPage.create,
      AccountPage.create,
      ConsumerPage.create,
      PublisherPage.create,
      appendBodies,
    );
  }

  private static CHECK_AUTH_INTERVAL_MS = 60 * 1000;

  public authPage: AuthPage;
  public chooseAccountPage: ChooseAccountPage;
  public accountPage: AccountPage;
  public consumerPage: ConsumerPage;
  public publisherPage: PublisherPage;
  private pageNavigator: PageNavigator<Page>;
  private url: MainAppUrl;
  private applyIndex = 0;
  private blockingLoop: BlockingLoop;

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private serviceClient: WebServiceClient,
    private createBlockingLoop: () => BlockingLoop,
    private createAuthPage: (
      appendBodies: AddBodiesFn,
      signUpInitAccountType?: AccountType,
    ) => AuthPage,
    private createChooseAccountPage: (
      appendBodies: AddBodiesFn,
      preSelectedAccountId?: string,
    ) => ChooseAccountPage,
    private createAccountPage: (appendBodies: AddBodiesFn) => AccountPage,
    private createConsumerPage: (appendBodies: AddBodiesFn) => ConsumerPage,
    private createPublisherPage: (appendBodies: AddBodiesFn) => PublisherPage,
    private appendBodies: AddBodiesFn,
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page),
      (page) => this.updatePage(page),
    );
    this.blockingLoop = this.createBlockingLoop()
      .setAction(() => this.checkAuthAndApplyUrl(this.url))
      .setInterval(MainApp.CHECK_AUTH_INTERVAL_MS)
      .start();
  }

  private async checkAuth(): Promise<{
    authenticated?: boolean;
    canConsume?: boolean;
    canPublish?: boolean;
  }> {
    let response: CheckCapabilityResponse;
    try {
      response = await this.serviceClient.send(
        newCheckCapabilityRequest({
          capabilitiesMask: {
            checkCanConsume: true,
            checkCanPublish: true,
          },
        }),
      );
    } catch (e) {
      if (e instanceof HttpError && e.statusCode === StatusCode.Unauthorized) {
        return {
          authenticated: false,
        };
      }
    }
    return {
      authenticated: true,
      canConsume: response.capabilities.canConsume,
      canPublish: response.capabilities.canPublish,
    };
  }

  public async checkAuthAndApplyUrl(newUrl?: MainAppUrl): Promise<void> {
    this.applyIndex++;
    if (!newUrl) {
      newUrl = {};
    }
    this.url = newUrl;

    if (!this.localSessionStorage.read()) {
      this.pageNavigator.goTo(Page.AUTH);
      return;
    }

    let applyIndex = this.applyIndex;
    let capabilities = await this.checkAuth();
    if (applyIndex !== this.applyIndex) {
      // A new url has been applied. Abort the current one.
      return;
    }
    if (!capabilities.authenticated) {
      this.pageNavigator.goTo(Page.AUTH);
      this.emit("urlApplied");
      return;
    }

    if (this.url.chooseAccount) {
      this.pageNavigator.goTo(Page.CHOOSE_ACCOUNT);
    } else if (this.url.account) {
      this.pageNavigator.goTo(Page.ACCOUNT);
    } else if (capabilities.canConsume) {
      this.pageNavigator.goTo(Page.CONSUMER);
    } else if (capabilities.canPublish) {
      this.pageNavigator.goTo(Page.PUBLISHER);
    } else {
      throw new Error("Unhandled case.");
    }
    this.emit("urlApplied");
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.AUTH:
        this.authPage = this.createAuthPage(
          this.appendBodies,
          this.url.auth?.initAccountType,
        ).on("signedIn", () => {
          let newUrl = copyMessage(this.url, MAIN_APP);
          newUrl.auth = undefined;
          this.checkAuthAndApplyUrl(newUrl);
        });
        break;
      case Page.CHOOSE_ACCOUNT:
        this.chooseAccountPage = this.createChooseAccountPage(
          this.appendBodies,
          this.url.chooseAccount?.preSelectedAccountId,
        )
          .on("chosen", () => {
            let newUrl = copyMessage(this.url, MAIN_APP);
            newUrl.chooseAccount = undefined;
            this.checkAuthAndApplyUrl(newUrl);
            this.emit("newUrl", this.url);
          })
          .on("signOut", () => this.signOut());
        break;
      case Page.ACCOUNT:
        this.accountPage = this.createAccountPage(this.appendBodies)
          .on("newUrl", (newUrl) => {
            this.url.account = newUrl;
            this.emit("newUrl", this.url);
          })
          .on("switchAccount", () => {
            let newUrl: MainAppUrl = {
              chooseAccount: {},
            };
            this.checkAuthAndApplyUrl(newUrl);
          })
          .on("goToHome", () => {
            let newUrl: MainAppUrl = {};
            this.checkAuthAndApplyUrl(newUrl);
            this.emit("newUrl", newUrl);
          })
          .on("signOut", () => this.signOut());
        break;
      case Page.CONSUMER:
        this.consumerPage = this.createConsumerPage(this.appendBodies)
          .on("newUrl", (newUrl) => {
            this.url.consumer = newUrl;
            this.emit("newUrl", this.url);
          })
          .on("goToAccount", () => {
            let newUrl: MainAppUrl = {
              account: {},
            };
            this.checkAuthAndApplyUrl(newUrl);
            this.emit("newUrl", this.url);
          });
        break;
      case Page.PUBLISHER:
        this.publisherPage = this.createPublisherPage(this.appendBodies)
          .on("newUrl", (newUrl) => {
            this.url.publisher = newUrl;
            this.emit("newUrl", this.url);
          })
          .on("goToAccount", () => {
            let newUrl: MainAppUrl = {
              account: {},
            };
            this.checkAuthAndApplyUrl(newUrl);
            this.emit("newUrl", this.url);
          });
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.AUTH:
        this.authPage.remove();
        break;
      case Page.CHOOSE_ACCOUNT:
        this.chooseAccountPage.remove();
        break;
      case Page.ACCOUNT:
        this.accountPage.remove();
        break;
      case Page.CONSUMER:
        this.consumerPage.remove();
        break;
      case Page.PUBLISHER:
        this.publisherPage.remove();
        break;
    }
  }

  private updatePage(page: Page): void {
    switch (page) {
      case Page.ACCOUNT:
        this.accountPage.applyUrl(this.url.account);
        break;
      case Page.CONSUMER:
        this.consumerPage.applyUrl(this.url.consumer);
        break;
      case Page.PUBLISHER:
        this.publisherPage.applyUrl(this.url.publisher);
        break;
    }
  }

  private signOut(): void {
    this.localSessionStorage.clear();
    this.checkAuthAndApplyUrl(this.url);
  }

  public remove(): void {
    this.pageNavigator.remove();
    this.blockingLoop.stop();
  }
}
