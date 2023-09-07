import EventEmitter = require("events");
import { AddBodiesFn } from "../common/add_bodies_fn";
import { PageNavigator } from "../common/page_navigator";
import { USER_SERVICE_CLIENT } from "../common/user_service_client";
import { ConsumerPage } from "./consumer_page/body";
import { PublisherPage } from "./publisher_page/body";
import { Page, ShowPageState } from "./state";
import { AppVariant } from "@phading/user_service_interface/app_variant";
import { getAppVariant } from "@phading/user_service_interface/client_requests";
import { WebServiceClient } from "@selfage/web_service_client";

export interface ShowPage {
  on(event: "newState", listener: (newState: ShowPageState) => void): this;
}

export class ShowPage extends EventEmitter {
  private state: ShowPageState;
  private pendingNewState: ShowPageState;
  private consumerPage: ConsumerPage;
  private publisherPage: PublisherPage;
  private pageNavigator: PageNavigator<Page>;

  public constructor(
    private createConsumerPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn,
      appendMenuBodies: AddBodiesFn
    ) => ConsumerPage,
    private createPublisherPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn,
      appendMenuBodies: AddBodiesFn
    ) => PublisherPage,
    private userServiceClient: WebServiceClient,
    private appendBodies: AddBodiesFn,
    private prependMenuBodies: AddBodiesFn,
    private appendMenuBodies: AddBodiesFn
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page) => this.addPage(page),
      (page) => this.removePage(page),
      (page) => this.updatePage(page)
    );
  }

  public static create(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn
  ): ShowPage {
    return new ShowPage(
      ConsumerPage.create,
      PublisherPage.create,
      USER_SERVICE_CLIENT,
      appendBodies,
      prependMenuBodies,
      appendMenuBodies
    );
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.Consumer:
        this.consumerPage = this.createConsumerPage(
          this.appendBodies,
          this.prependMenuBodies,
          this.appendMenuBodies
        );
        this.consumerPage
          .on("toPublish", () => {
            this.updateState({
              page: Page.Publisher,
            });
            this.emit("newState", this.state);
          })
          .on("newState", (newState) => {
            this.state.consumer = newState;
            this.emit("newState", this.state);
          });
        this.consumerPage.updateState(this.state.consumer);
        break;
      case Page.Publisher:
        this.publisherPage = this.createPublisherPage(
          this.appendBodies,
          this.prependMenuBodies,
          this.appendMenuBodies
        );
        this.publisherPage
          .on("toConsume", () => {
            this.updateState({
              page: Page.Consumer,
            });
            this.emit("newState", this.state);
          })
          .on("newState", (newState) => {
            this.state.publisher = newState;
            this.emit("newState", this.state);
          });
        this.publisherPage.updateState(this.state.publisher);
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.Consumer:
        this.consumerPage.remove();
        break;
      case Page.Publisher:
        this.publisherPage.remove();
        break;
    }
  }

  private updatePage(page: Page): void {
    switch (page) {
      case Page.Consumer:
        this.consumerPage.updateState(this.state.consumer);
        break;
      case Page.Publisher:
        this.publisherPage.updateState(this.state.publisher);
        break;
    }
  }

  public updateState(newState?: ShowPageState): void {
    if (!newState) {
      newState = {};
    }
    this.pendingNewState = newState;
    if (!newState.page) {
      this.normalizeState(newState);
    } else {
      this.state = newState;
      this.pageNavigator.goTo(this.state.page);
    }
  }

  private async normalizeState(newState: ShowPageState): Promise<void> {
    let response = await getAppVariant(this.userServiceClient, {});
    if (this.pendingNewState.page) {
      // A new update has been made before the service call is done and the
      // page is already set.
      return;
    }

    if (response.appVariant === AppVariant.Consumer) {
      newState = {
        page: Page.Consumer,
      };
    } else if (response.appVariant === AppVariant.Publisher) {
      newState = {
        page: Page.Publisher,
      };
    }
    this.state = newState;
    this.pageNavigator.goTo(this.state.page);
  }

  public remove(): void {
    this.pageNavigator.remove();
  }
}
