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
import { MAIN_APP_RL, MainAppRl } from "@phading/web_interface/main/app";
import { HttpError, StatusCode } from "@selfage/http_error";
import { copyMessage } from "@selfage/message/copier";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

export interface MainApp {
  on(event: "replaceRl", listener: (rl: MainAppRl) => void): this;
  on(event: "pushRl", listener: (rl: MainAppRl) => void): this;
  on(event: "rlApplied", listener: () => void): this;
  on(event: "chosen", listener: (accountId?: string) => void): this;
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
  private preAuthRl: MainAppRl;
  private rl: MainAppRl;
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
      () => this.applyRl(this.preAuthRl),
      MainApp.CHECK_AUTH_INTERVAL_MS,
    );
  }

  private pushRl(rl: MainAppRl): void {
    this.emit("pushRl", rl);
    this.applyRl(rl);
  }

  private replaceRl(rl: MainAppRl): void {
    this.emit("replaceRl", rl);
    this.applyRl(rl);
  }

  public async applyRl(rl?: MainAppRl): Promise<void> {
    this.applyIndex++;
    let applyIndex = this.applyIndex;

    // If URL changes during auth page, it always tracks the latest URL.
    this.preAuthRl = rl;
    let capabilities = await this.checkAuth();
    if (applyIndex !== this.applyIndex) {
      // A new rl has been applied. Abort the current one.
      return;
    }
    if (!capabilities.authenticated) {
      if (!this.authPage) {
        this.pageSwitcher.goTo(
          () => this.addAuthPage(),
          () => this.removeAuthPage(),
        );
        this.emit("rlApplied");
      }
      return;
    }

    this.rl = this.preAuthRl;
    if (!this.rl) {
      this.rl = {};
    }
    if (!capabilities.canConsume) {
      this.rl.consumer = undefined;
      this.emit("replaceRl", this.rl);
    }
    if (!capabilities.canPublish) {
      this.rl.publisher = undefined;
      this.emit("replaceRl", this.rl);
    }
    if (
      !this.rl.account &&
      !this.rl.chooseAccount &&
      !this.rl.consumer &&
      !this.rl.publisher
    ) {
      if (capabilities.canConsume) {
        this.rl.consumer = {};
      } else if (capabilities.canPublish) {
        this.rl.publisher = {};
      } else {
        // TODO: Assumes that neither is false is because of payment issues. Replace with API calls if there are other reasons.
        this.rl.account = {
          payment: {},
        };
      }
    }

    if (this.rl.chooseAccount) {
      if (
        !this.chooseAccountPage ||
        this.rl.chooseAccount.accountId !==
          this.chooseAccountPage.accountId
      ) {
        this.pageSwitcher.goTo(
          () =>
            this.addChooseAccountPage(
              this.rl.chooseAccount.accountId,
            ),
          () => this.removeChooseAccountPage(),
        );
      }
    } else if (this.rl.account) {
      if (
        !this.accountPage ||
        this.accountPage.canEarn !== capabilities.canEarn
      ) {
        this.pageSwitcher.goTo(
          () => this.addAccountPage(capabilities.canEarn),
          () => this.removeAccountPage(),
        );
      }
      this.accountPage.applyRl(this.rl.account);
    } else if (this.rl.consumer) {
      if (!this.consumerPage) {
        this.pageSwitcher.goTo(
          () => this.addConsumerPage(),
          () => this.removeConsumerPage(),
        );
      }
      this.consumerPage.applyRl(this.rl.consumer);
    } else if (this.rl.publisher) {
      if (!this.publisherPage) {
        this.pageSwitcher.goTo(
          () => this.addPublisherPage(),
          () => this.removePublisherPage(),
        );
      }
      this.publisherPage.applyRl(this.rl.publisher);
    }
    this.emit("rlApplied");
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

  private addAccountPage(canEarn: boolean): void {
    this.accountPage = this.createAccountPage(this.appendBodies, canEarn)
      .on("replaceRl", (rl) => {
        this.rl.account = rl;
        this.emit("replaceRl", this.rl);
      })
      .on("pushRl", (rl) => {
        this.rl.account = rl;
        this.emit("pushRl", this.rl);
      })
      .on("goToHome", () => {
        this.pushRl({});
      })
      .on("chooseAccount", () => {
        this.pushRl({
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
      "auth",
      (signedSession) => {
        this.localSessionStorage.save(signedSession);
        this.applyRl(this.preAuthRl);
      },
    );
  }

  private removeAuthPage(): void {
    this.authPage.remove();
    this.authPage = undefined;
  }

  private addChooseAccountPage(accountId?: string): void {
    this.chooseAccountPage = this.createChooseAccountPage(
      this.appendBodies,
      accountId,
    )
      .on("choose", (signedSession) => {
        this.emit("chosen", accountId);
        this.localSessionStorage.save(signedSession);
        let rl = copyMessage(this.rl, MAIN_APP_RL);
        rl.chooseAccount = undefined;
        this.replaceRl(rl);
      })
      .on("signOut", () => this.signOut());
  }

  private removeChooseAccountPage(): void {
    this.chooseAccountPage.remove();
    this.chooseAccountPage = undefined;
  }

  private addConsumerPage(): void {
    this.consumerPage = this.createConsumerPage(this.appendBodies)
      .on("pushRl", (rl) => {
        this.rl.consumer = rl;
        this.emit("pushRl", this.rl);
      })
      .on("goToAccount", () => {
        this.pushRl({
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
      .on("pushRl", (rl) => {
        this.rl.publisher = rl;
        this.emit("pushRl", this.rl);
      })
      .on("goToAccount", () => {
        this.pushRl({
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
    this.pushRl({});
  }

  public remove(): void {
    this.window.clearInterval(this.checkAuthInterval);
    this.pageSwitcher.remove();
    this.removeAllListeners();
  }
}
