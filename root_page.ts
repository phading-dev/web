import EventEmitter = require("events");
import { AuthPage } from "./auth_page/body";
import { ChooseAccountPage } from "./choose_account_page/body";
import { AddBodiesFn } from "./common/add_bodies_fn";
import { LOCAL_SESSION_STORAGE } from "./common/local_session_storage";
import { PageNavigator } from "./common/page_navigator";
import { USER_SESSION_SERVICE_CLIENT } from "./common/web_service_client";
import { ConsumerPage } from "./consumer_page/body";
import { PublisherPage } from "./publisher_page/body";
import { RootPageState } from "./root_page_state";
import { checkCapability } from "@phading/user_session_service_interface/frontend/client";
import { CheckCapabilityResponse } from "@phading/user_session_service_interface/frontend/interface";
import { BlockingLoop, Style } from "@selfage/blocking_loop";
import { HttpError, StatusCode } from "@selfage/http_error";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

interface Capability {
  authenticated?: boolean;
  canConsumeShows?: boolean;
  canPublishShows?: boolean;
}

export enum Page {
  AUTH = 1,
  CHOOSE_ACCOUNT = 2,
  CONSUMER = 3,
  PUBLISHER = 4,
}

export interface RootPage {
  on(event: "newState", listener: (newState: RootPageState) => void): this;
  on(event: "stateUpdated", listener: () => void): this;
  on(event: "switchAccount", listener: () => void): this;
  on(event: "signOut", listener: () => void): this;
}

export class RootPage extends EventEmitter {
  public static create(documentBody: HTMLElement): RootPage {
    return new RootPage(
      LOCAL_SESSION_STORAGE,
      USER_SESSION_SERVICE_CLIENT,
      BlockingLoop.create,
      AuthPage.create,
      ChooseAccountPage.create,
      ConsumerPage.create,
      PublisherPage.create,
      documentBody,
    );
  }

  private static CHECK_AUTH_INTERVAL_MS = 60 * 1000;

  public authPage: AuthPage;
  public chooseAccountPage: ChooseAccountPage;
  public consumerPage: ConsumerPage;
  public publisherPage: PublisherPage;
  private pageNavigator: PageNavigator<Page>;
  private state: RootPageState;
  private updateIndex = 0;
  private blockingLoop: BlockingLoop;

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private webServiceClient: WebServiceClient,
    private createBlockingLoop: (style: Style) => BlockingLoop,
    private createAuthPage: (appendBodies: AddBodiesFn) => AuthPage,
    private createChooseAccountPage: (
      appendBodies: AddBodiesFn,
    ) => ChooseAccountPage,
    private createConsumerPage: (appendBodies: AddBodiesFn) => ConsumerPage,
    private createPublisherPage: (appendBodies: AddBodiesFn) => PublisherPage,
    private documentBody: HTMLElement,
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page),
      (page) => this.updatePage(page),
    );
    // Use ANIMATION_FRAME to stop looping when the tab is not focus.
    this.blockingLoop = this.createBlockingLoop(Style.ANIMATION_FRAME)
      .setAction(() => this.updateState(this.state))
      .setInterval(RootPage.CHECK_AUTH_INTERVAL_MS)
      .start();
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.AUTH:
        this.authPage = this.createAuthPage((...bodies) =>
          this.documentBody.append(...bodies),
        ).on("signedIn", () => this.updateState(this.state));
        break;
      case Page.CHOOSE_ACCOUNT:
        this.chooseAccountPage = this.createChooseAccountPage((...bodies) =>
          this.documentBody.append(...bodies),
        ).on("chosen", () => this.updateState(this.state));
        break;
      case Page.CONSUMER:
        this.consumerPage = this.createConsumerPage((...bodies) =>
          this.documentBody.append(...bodies),
        )
          .on("switchAccount", () =>
            this.pageNavigator.goTo(Page.CHOOSE_ACCOUNT),
          )
          .on("signOut", () => this.signOut())
          .on("newState", (newState) => {
            this.state.consumer = newState;
            this.emit("newState", this.state);
          });
        this.consumerPage.updateState(this.state.consumer);
        break;
      case Page.PUBLISHER:
        this.publisherPage = this.createPublisherPage((...bodies) =>
          this.documentBody.append(...bodies),
        );
        this.publisherPage.on("newState", (newState) => {
          this.state.publisher = newState;
          this.emit("newState", this.state);
        });
        this.publisherPage.updateState(this.state.publisher);
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
      case Page.CONSUMER:
        this.consumerPage.updateState(this.state.consumer);
        break;
      case Page.PUBLISHER:
        this.publisherPage.updateState(this.state.publisher);
        break;
    }
  }

  private signOut(): void {
    this.localSessionStorage.clear();
    this.updateState(this.state);
  }

  public async updateState(newState?: RootPageState): Promise<void> {
    this.updateIndex++;
    if (!newState) {
      newState = {};
    }
    this.state = newState;

    if (!this.localSessionStorage.read()) {
      this.pageNavigator.goTo(Page.AUTH);
      return;
    }

    let updateIndex = this.updateIndex;
    let capability = await this.checkCapability();
    if (updateIndex !== this.updateIndex) {
      // A new update has been issued. Abort the current one.
      return;
    }

    if (!capability.authenticated) {
      this.signOut();
    } else if (capability.canConsumeShows) {
      this.pageNavigator.goTo(Page.CONSUMER);
    } else if (capability.canPublishShows) {
      this.pageNavigator.goTo(Page.PUBLISHER);
    } else {
      this.pageNavigator.goTo(Page.CHOOSE_ACCOUNT);
    }
    this.emit("stateUpdated");
  }

  private async checkCapability(): Promise<Capability> {
    let response: CheckCapabilityResponse;
    try {
      response = await checkCapability(this.webServiceClient, {
        checkCanConsumeShows: true,
        checkCanPublishShows: true,
      });
    } catch (e) {
      if (e instanceof HttpError && e.statusCode === StatusCode.Unauthorized) {
        return {
          authenticated: false,
        };
      }
    }
    return {
      authenticated: true,
      canConsumeShows: response.canConsumeShows,
      canPublishShows: response.canPublishShows,
    };
  }

  public remove(): void {
    this.pageNavigator.remove();
    this.blockingLoop.stop();
  }
}
