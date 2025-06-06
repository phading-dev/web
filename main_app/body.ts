import EventEmitter = require("events");
import { AddBodiesFn } from "../common/add_bodies_fn";
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { TabSwitcher } from "../common/page_navigator";
import { SERVICE_CLIENT } from "../common/web_service_client";
import { AccountPage } from "./account_page/body";
import { AuthPage } from "./auth_page/body";
import { ChooseAccountPage } from "./choose_account_page/body";
import { ConsumerPage } from "./consumer_page/body";
import { PublisherPage } from "./publisher_page/body";
import { newCheckCapabilityRequest } from "@phading/user_session_service_interface/web/client";
import { CheckCapabilityResponse } from "@phading/user_session_service_interface/web/interface";
import {
  MAIN_APP,
  MainApp as MainAppUrl,
} from "@phading/web_interface/main/app";
import { HttpError, StatusCode } from "@selfage/http_error";
import { copyMessage } from "@selfage/message/copier";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

export interface MainApp {
  on(event: "replaceUrl", listener: (url: MainAppUrl) => void): this;
  on(event: "newUrl", listener: (url: MainAppUrl) => void): this;
  on(event: "urlApplied", listener: () => void): this;
}

export class MainApp extends EventEmitter {
  public static create(appendBodies: AddBodiesFn): MainApp {
    return new MainApp(
      window,
      LOCAL_SESSION_STORAGE,
      SERVICE_CLIENT,
      AccountPage.create,
      AuthPage.create,
      ChooseAccountPage.create,
      ConsumerPage.create,
      PublisherPage.create,
      appendBodies,
    );
  }

  private static CHECK_AUTH_INTERVAL_MS = 60 * 1000;

  private pageSwitcher = new TabSwitcher();
  public accountPage: AccountPage;
  public authPage: AuthPage;
  public chooseAccountPage: ChooseAccountPage;
  public consumerPage: ConsumerPage;
  public publisherPage: PublisherPage;
  private applyIndex = 0;
  private url: MainAppUrl;
  private checkAuthInterval: number;

  public constructor(
    private window: Window,
    private localSessionStorage: LocalSessionStorage,
    private serviceClient: WebServiceClient,
    private createAccountPage: typeof AccountPage.create,
    private createAuthPage: typeof AuthPage.create,
    private createChooseAccountPage: typeof ChooseAccountPage.create,
    private createConsumerPage: typeof ConsumerPage.create,
    private createPublisherPage: typeof PublisherPage.create,
    private appendBodies: AddBodiesFn,
  ) {
    super();
    this.checkAuthInterval = this.window.setInterval(
      () => this.applyUrl(this.url),
      MainApp.CHECK_AUTH_INTERVAL_MS,
    );
  }

  private newUrl(url: MainAppUrl): void {
    this.emit("newUrl", url);
    this.applyUrl(url);
  }

  public async applyUrl(newUrl?: MainAppUrl): Promise<void> {
    this.applyIndex++;
    let applyIndex = this.applyIndex;

    // If URL changes during auth page, it always tracks the latest URL.
    this.url = newUrl;
    let capabilities = await this.checkAuth();
    if (applyIndex !== this.applyIndex) {
      // A new url has been applied. Abort the current one.
      return;
    }
    if (!capabilities.authenticated) {
      if (!this.authPage) {
        this.pageSwitcher.goTo(
          () => this.addAuthPage(),
          () => this.removeAuthPage(),
        );
        this.emit("urlApplied");
      }
      return;
    }

    if (!this.url) {
      this.url = {};
    }
    if (!capabilities.canConsume) {
      this.url.consumer = undefined;
    }
    if (!capabilities.canPublish) {
      this.url.publisher = undefined;
    }
    if (
      !this.url.account &&
      !this.url.chooseAccount &&
      !this.url.consumer &&
      !this.url.publisher
    ) {
      if (capabilities.canConsume) {
        this.url.consumer = {};
      } else if (capabilities.canPublish) {
        this.url.publisher = {};
      } else {
        // TODO: Assumes that neither is false is because of payment issues. Replace with API calls if there are other reasons.
        this.url.account = {
          payment: {},
        };
      }
    }

    if (this.url.chooseAccount) {
      if (
        !this.chooseAccountPage ||
        this.url.chooseAccount.preSelectedAccountId !==
          this.chooseAccountPage.preSelectedAccountId
      ) {
        this.pageSwitcher.goTo(
          () =>
            this.addChooseAccountPage(
              this.url.chooseAccount.preSelectedAccountId,
            ),
          () => this.removeChooseAccountPage(),
        );
      }
    } else if (this.url.account) {
      if (!this.accountPage) {
        this.pageSwitcher.goTo(
          () => this.addAccountPage(),
          () => this.removeAccountPage(),
        );
      }
      this.accountPage.applyUrl(capabilities.canEarn, this.url.account);
    } else if (this.url.consumer) {
      if (!this.consumerPage) {
        this.pageSwitcher.goTo(
          () => this.addConsumerPage(),
          () => this.removeConsumerPage(),
        );
      }
      this.consumerPage.applyUrl(this.url.consumer);
    } else if (this.url.publisher) {
      if (!this.publisherPage) {
        this.pageSwitcher.goTo(
          () => this.addPublisherPage(),
          () => this.removePublisherPage(),
        );
      }
      this.publisherPage.applyUrl(this.url.publisher);
    }
    this.emit("urlApplied");
  }

  private async checkAuth(): Promise<{
    authenticated?: boolean;
    canConsume?: boolean;
    canPublish?: boolean;
    canEarn?: boolean;
  }> {
    if (!this.localSessionStorage.read()) {
      return {
        authenticated: false,
      };
    }

    let response: CheckCapabilityResponse;
    try {
      response = await this.serviceClient.send(
        newCheckCapabilityRequest({
          capabilitiesMask: {
            checkCanConsume: true,
            checkCanPublish: true,
            checkCanEarn: true,
          },
        }),
      );
    } catch (e) {
      if (e instanceof HttpError && e.statusCode === StatusCode.Unauthorized) {
        return {
          authenticated: false,
        };
      } else {
        throw e;
      }
    }
    return {
      authenticated: true,
      canConsume: response.capabilities.canConsume,
      canPublish: response.capabilities.canPublish,
      canEarn: response.capabilities.canEarn,
    };
  }

  private addAccountPage(): void {
    this.accountPage = this.createAccountPage(this.appendBodies)
      .on("replaceUrl", (url) => {
        this.url.account = url;
        this.emit("replaceUrl", this.url);
      })
      .on("newUrl", (url) => {
        this.url.account = url;
        this.emit("newUrl", this.url);
      })
      .on("goToHome", () => {
        this.newUrl({});
      })
      .on("chooseAccount", () => {
        this.newUrl({
          chooseAccount: {},
        });
      })
      .on("signOut", () => this.signOut());
  }

  private removeAccountPage(): void {
    this.accountPage.remove();
    this.accountPage = undefined;
  }

  private addAuthPage(): void {
    this.authPage = this.createAuthPage(this.appendBodies).on(
      "signedIn",
      () => {
        this.applyUrl(this.url);
      },
    );
  }

  private removeAuthPage(): void {
    this.authPage.remove();
    this.authPage = undefined;
  }

  private addChooseAccountPage(preSelectedAccountId?: string): void {
    this.chooseAccountPage = this.createChooseAccountPage(
      this.appendBodies,
      preSelectedAccountId,
    )
      .on("choose", () => {
        let newUrl = copyMessage(this.url, MAIN_APP);
        newUrl.chooseAccount = undefined;
        this.newUrl(newUrl);
      })
      .on("signOut", () => this.signOut());
  }

  private removeChooseAccountPage(): void {
    this.chooseAccountPage.remove();
    this.chooseAccountPage = undefined;
  }

  private addConsumerPage(): void {
    this.consumerPage = this.createConsumerPage(this.appendBodies)
      .on("newUrl", (url) => {
        this.url.consumer = url;
        this.emit("newUrl", this.url);
      })
      .on("goToAccount", () => {
        this.newUrl({
          account: {},
        });
      });
  }

  private removeConsumerPage(): void {
    this.consumerPage.remove();
    this.consumerPage = undefined;
  }

  private addPublisherPage(): void {
    this.publisherPage = this.createPublisherPage(this.appendBodies)
      .on("newUrl", (url) => {
        this.url.publisher = url;
        this.emit("newUrl", this.url);
      })
      .on("goToAccount", () => {
        this.newUrl({
          account: {},
        });
      });
  }

  private removePublisherPage(): void {
    this.publisherPage.remove();
    this.publisherPage = undefined;
  }

  private signOut(): void {
    this.localSessionStorage.clear();
    this.newUrl({});
  }

  public remove(): void {
    this.window.clearInterval(this.checkAuthInterval);
    this.pageSwitcher.remove();
  }
}
