import EventEmitter = require("events");
import { AddBodiesFn } from "../common/add_bodies_fn";
import { PageNavigator } from "../common/page_navigator";
import { USER_SERVICE_CLIENT } from "../common/user_service_client";
import { ConsumerPage } from "./consumer_page/body";
import { ConsumerSelectionPage } from "./consumer_selection_page/body";
import { PublisherPage } from "./publisher_page/body";
import { PublisherSelectionPage } from "./publisher_selection_page/body";
import { Page as StatePage, ShowPageState } from "./state";
import { getUserType } from "@phading/user_service_interface/client_requests";
import { UserType } from "@phading/user_service_interface/user_type";
import { WebServiceClient } from "@selfage/web_service_client";

enum Page {
  Consumer = 1,
  ConsumerSelection = 2,
  Publisher = 3,
  PublisherSelection = 4,
}

export interface ShowPage {
  on(event: "newState", listener: (newState: ShowPageState) => void): this;
  on(event: "stateUpdated", listener: () => void): this;
}

export class ShowPage extends EventEmitter {
  private state: ShowPageState;
  private pendingNewState: ShowPageState;
  private consumerPage: ConsumerPage;
  private consumerSelectionPage: ConsumerSelectionPage;
  private publisherPage: PublisherPage;
  private publisherSelectionPage: PublisherSelectionPage;
  private pageNavigator: PageNavigator<Page>;

  public constructor(
    private createConsumerPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn,
      appendMenuBodies: AddBodiesFn
    ) => ConsumerPage,
    private createConsumerSelectionPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn,
      appendMenuBodies: AddBodiesFn
    ) => ConsumerSelectionPage,
    private createPublisherPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn,
      appendMenuBodies: AddBodiesFn
    ) => PublisherPage,
    private createPublisherSelectionPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn,
      appendMenuBodies: AddBodiesFn
    ) => PublisherSelectionPage,
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
      ConsumerSelectionPage.create,
      PublisherPage.create,
      PublisherSelectionPage.create,
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
              page: StatePage.Publisher,
            });
            this.emit("newState", this.state);
          })
          .on("newState", (newState) => {
            this.state.consumer = newState;
            this.emit("newState", this.state);
          });
        this.consumerPage.updateState(this.state.consumer);
        break;
      case Page.ConsumerSelection:
        this.consumerSelectionPage = this.createConsumerSelectionPage(
          this.appendBodies,
          this.prependMenuBodies,
          this.appendMenuBodies
        ).on("selected", () => this.updateState(this.state));
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
              page: StatePage.Consumer,
            });
            this.emit("newState", this.state);
          })
          .on("newState", (newState) => {
            this.state.publisher = newState;
            this.emit("newState", this.state);
          });
        this.publisherPage.updateState(this.state.publisher);
        break;
      case Page.PublisherSelection:
        this.publisherSelectionPage = this.createPublisherSelectionPage(
          this.appendBodies,
          this.prependMenuBodies,
          this.appendMenuBodies
        ).on("selected", () => this.updateState(this.state));
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.Consumer:
        this.consumerPage.remove();
        break;
      case Page.ConsumerSelection:
        this.consumerSelectionPage.remove();
        break;
      case Page.Publisher:
        this.publisherPage.remove();
        break;
      case Page.PublisherSelection:
        this.publisherSelectionPage.remove();
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

  public async updateState(newState?: ShowPageState): Promise<void> {
    if (!newState) {
      newState = {};
    }
    this.pendingNewState = newState;
    let response = await getUserType(this.userServiceClient, {});
    if (!this.pendingNewState.page) {
      if (response.userType === UserType.CONSUMER) {
        this.pendingNewState = {
          page: StatePage.Consumer,
        };
      } else if (response.userType === UserType.PUBLISHER) {
        this.pendingNewState = {
          page: StatePage.Publisher,
        };
      }
    }

    this.state = this.pendingNewState;
    if (this.pendingNewState.page === StatePage.Consumer) {
      if (response.userType !== UserType.CONSUMER) {
        this.pageNavigator.goTo(Page.ConsumerSelection);
      } else {
        this.pageNavigator.goTo(Page.Consumer);
      }
    } else if (this.pendingNewState.page === StatePage.Publisher) {
      if (response.userType !== UserType.PUBLISHER) {
        this.pageNavigator.goTo(Page.PublisherSelection);
      } else {
        this.pageNavigator.goTo(Page.Publisher);
      }
    }
    this.emit("stateUpdated");
  }

  public remove(): void {
    this.pageNavigator.remove();
  }
}
