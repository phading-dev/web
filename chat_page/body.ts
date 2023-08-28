import EventEmitter = require("events");
import { AddBodiesFn } from "../common/add_bodies_fn";
import { PageNavigator } from "../common/page_navigator";
import { USER_SERVICE_CLIENT } from "../common/user_service_client";
import { ConsumerPage } from "./consumer_page/body";
import { ConsumerSelectionPage } from "./consumer_selection_page/body";
import { PublisherPage } from "./publisher_page/body";
import { PublisherSelectionPage } from "./publisher_selection_page/body";
import { ChatPageState, Page } from "./state";
import { AppVariant } from "@phading/user_service_interface/app_variant";
import { getAppVariant } from "@phading/user_service_interface/client_requests";
import { WebServiceClient } from "@selfage/web_service_client";

export class ShowPage extends EventEmitter {
  private state: ChatPageState;
  private consumerPage: ConsumerPage;
  private publisherPage: PublisherPage;
  private consumerSelectionPage: ConsumerSelectionPage;
  private publisherSelectionPage: PublisherSelectionPage;
  private pageNavigator: PageNavigator<Page>;

  public constructor(
    private createConsumerPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn,
      appendMenuBodies: AddBodiesFn,
      appendControllerBodies: AddBodiesFn
    ) => ConsumerPage,
    private createPublisherPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn,
      appendMenuBodies: AddBodiesFn
    ) => PublisherPage,
    private createConsumerSelectionPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn,
      appendMenuBodies: AddBodiesFn
    ) => ConsumerSelectionPage,
    private createPublisherSelectionPage: (
      appendBodies: AddBodiesFn,
      prependMenuBodies: AddBodiesFn,
      appendMenuBodies: AddBodiesFn
    ) => PublisherSelectionPage,
    private userServiceClient: WebServiceClient,
    private appendBodies: AddBodiesFn,
    private prependMenuBodies: AddBodiesFn,
    private appendMenuBodies: AddBodiesFn,
    private appendControllerBodies: AddBodiesFn
  ) {
    super();
    this.pageNavigator = new PageNavigator(
      (page) => this.showPage(page),
      (page) => this.removePage(page),
      (page) => this.updatePage(page)
    );
  }

  public static creaet(
    appendBodies: AddBodiesFn,
    prependMenuBodies: AddBodiesFn,
    appendMenuBodies: AddBodiesFn,
    appendControllerBodies: AddBodiesFn
  ): ShowPage {
    return new ShowPage(
      ConsumerPage.create,
      PublisherPage.create,
      ConsumerSelectionPage.create,
      PublisherSelectionPage.create,
      USER_SERVICE_CLIENT,
      appendBodies,
      prependMenuBodies,
      appendMenuBodies,
      appendControllerBodies
    );
  }

  private showPage(page: Page): void {
    switch (page) {
      case Page.Consumer:
        this.consumerPage = this.createConsumerPage(
          this.appendBodies,
          this.prependMenuBodies,
          this.appendMenuBodies,
          this.appendControllerBodies
        );
        this.consumerPage.on("toPublish", () =>
          this.updateState({
            page: Page.PublisherSelection,
          })
        );
        this.consumerPage.updateState(this.state.consumer);
        break;
      case Page.Publisher:
        this.publisherPage = this.createPublisherPage(
          this.appendBodies,
          this.prependMenuBodies,
          this.appendMenuBodies
        );
        this.publisherPage.on("toConsume", () =>
          this.updateState({
            page: Page.ConsumerSelection,
          })
        );
        this.publisherPage.updateState(this.state.publisher);
        break;
      case Page.ConsumerSelection:
        this.consumerSelectionPage = this.createConsumerSelectionPage(
          this.appendBodies,
          this.prependMenuBodies,
          this.appendMenuBodies
        );
        this.consumerSelectionPage.on("selected", () =>
          this.updateState({
            page: Page.Consumer,
          })
        );
        break;
      case Page.PublisherSelection:
        this.publisherSelectionPage = this.createPublisherSelectionPage(
          this.appendBodies,
          this.prependMenuBodies,
          this.appendMenuBodies
        );
        this.publisherSelectionPage.on("selected", () =>
          this.updateState({
            page: Page.Publisher,
          })
        );
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
      case Page.ConsumerSelection:
        this.consumerSelectionPage.remove();
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

  public async updateState(newState?: ChatPageState): Promise<void> {
    if (!newState) {
      newState = {};
    }

    if (
      newState.page === Page.ConsumerSelection ||
      newState.page === Page.PublisherSelection
    ) {
      this.state = newState;
      this.pageNavigator.goTo(this.state.page);
      return;
    }

    let response = await getAppVariant(this.userServiceClient, {});
    if (response.appVariant === AppVariant.Consumer) {
      if (newState.page !== Page.Consumer) {
        newState = {
          page: Page.Consumer,
        };
      }
    } else if (response.appVariant === AppVariant.Publisher) {
      if (newState.page !== Page.Publisher) {
        newState = {
          page: Page.Publisher,
        };
      }
    }
    this.state = newState;
    this.pageNavigator.goTo(this.state.page);
  }
}
