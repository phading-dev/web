import EventEmitter = require("events");
import LRU = require("lru-cache");
import { AddBodiesFn } from "../common/add_bodies_fn";
import { PageNavigator } from "../common/page_navigator";
import { AccountPage } from "./account_page/body";
import { PlayPage } from "./play_page/body";
import { RecommendationPage } from "./recommendation_page/body";
import { RecommendationPageState } from "./recommendation_page/state";
import { ConsumerPageState, Page } from "./state";

export interface ConsumerPage {
  on(event: "signOut", listener: () => void): this;
  on(event: "switchAccount", listener: () => void): this;
  on(event: "newState", listener: (newState: ConsumerPageState) => void): this;
}

export class ConsumerPage extends EventEmitter {
  public static create(appendBodies: AddBodiesFn): ConsumerPage {
    return new ConsumerPage(
      AccountPage.create,
      PlayPage.create,
      RecommendationPage.create,
      appendBodies,
    );
  }

  public accountPage: AccountPage;
  public playPage: PlayPage;
  public recommendationPage: RecommendationPage;
  private recommendationPageCache = new LRU<string, RecommendationPage>({
    max: 10,
  });
  private pageNavigator: PageNavigator<Page>;
  private state: ConsumerPageState;

  public constructor(
    private createAccountPage: () => AccountPage,
    private createPlayPage: (episodeId: string) => PlayPage,
    private createRecommendationPage: (
      state: RecommendationPageState,
    ) => RecommendationPage,
    private appendBodies: AddBodiesFn,
  ) {
    super();

    this.pageNavigator = new PageNavigator<Page>(
      (page) => this.addPage(page),
      (page) => this.removePage(page),
      (page) => this.updatePage(page),
    );
  }

  private addPage(page: Page): void {
    switch (page) {
      case Page.ACCOUNT:
        this.accountPage = this.createAccountPage()
          .on("home", () => {
            this.updateState({
              page: Page.RECOMMENDATION,
            });
            this.emit("newState", this.state);
          })
          .on("signOut", () => this.emit("signOut"))
          .on("switchAccount", () => this.emit("switchAccount"))
          .on("newState", (accountPageState) => {
            this.state.account = accountPageState;
            this.emit("newState", this.state);
          });
        this.accountPage.updateState(this.state.account);
        this.appendBodies(this.accountPage.body);
        break;
      case Page.PLAY:
        this.createPlayPageAndHandleEvents();
        break;
      case Page.RECOMMENDATION:
        this.createOrFetchRecommendationPageAndHandleEvents();
        break;
    }
  }

  private createPlayPageAndHandleEvents(): void {
    this.playPage = this.createPlayPage(this.state.episodeId)
      .on("play", (episodeId) => {
        this.updateState({
          page: Page.PLAY,
          episodeId,
        });
        this.emit("newState", this.state);
      })
      .on("focusAccount", (accountId) => {
        this.updateState({
          page: Page.RECOMMENDATION,
          recommendation: {
            accountId,
          },
        });
        this.emit("newState", this.state);
      });
    this.appendBodies(this.playPage.body);
  }

  private createOrFetchRecommendationPageAndHandleEvents(): void {
    this.recommendationPage = this.recommendationPageCache.get(
      JSON.stringify(this.state.recommendation),
    );
    if (!this.recommendationPage) {
      this.recommendationPage = this.createRecommendationPage(
        this.state.recommendation,
      )
        .on("play", (episodeId) => {
          this.updateState({
            page: Page.PLAY,
            episodeId,
          });
          this.emit("newState", this.state);
        })
        .on("search", (query) => {
          let recommendation: RecommendationPageState;
          if (query) {
            recommendation = {
              query,
            };
          }
          this.updateState({
            page: Page.RECOMMENDATION,
            recommendation,
          });
          this.emit("newState", this.state);
        })
        .on("focusAccount", (accountId) => {
          this.updateState({
            page: Page.RECOMMENDATION,
            recommendation: {
              accountId,
            },
          });
          this.emit("newState", this.state);
        })
        .on("goToAccount", () => {
          this.updateState({
            page: Page.ACCOUNT,
          });
          this.emit("newState", this.state);
        });
      this.recommendationPageCache.set(
        JSON.stringify(this.state.recommendation),
        this.recommendationPage,
      );
    }
    this.appendBodies(this.recommendationPage.body);
  }

  private updatePage(page: Page): void {
    switch (page) {
      case Page.ACCOUNT:
        this.accountPage.updateState(this.state.account);
        break;
      case Page.PLAY:
        this.playPage.remove();
        this.createPlayPageAndHandleEvents();
        break;
      case Page.RECOMMENDATION:
        this.recommendationPage.remove();
        this.createOrFetchRecommendationPageAndHandleEvents();
        break;
    }
  }

  private removePage(page: Page): void {
    switch (page) {
      case Page.ACCOUNT:
        this.accountPage.remove();
        break;
      case Page.PLAY:
        this.playPage.remove();
        break;
      case Page.RECOMMENDATION:
        this.recommendationPage.remove();
        break;
    }
  }

  public updateState(newState?: ConsumerPageState): void {
    if (!newState) {
      newState = {};
    }
    if (
      !newState.page ||
      (newState.page === Page.PLAY && !newState.episodeId)
    ) {
      newState.page = Page.RECOMMENDATION;
    }
    switch (newState.page) {
      case Page.PLAY:
        if (
          this.state &&
          this.state.page === Page.PLAY &&
          newState.episodeId === this.state.episodeId
        ) {
          return;
        }
        break;
      case Page.RECOMMENDATION:
        if (!newState.recommendation) {
          newState.recommendation = {};
        }
        if (
          this.state &&
          this.state.page === Page.RECOMMENDATION &&
          newState.recommendation.accountId ===
            this.state.recommendation.accountId &&
          newState.recommendation.query === this.state.recommendation.query
        ) {
          return;
        }
        break;
    }
    this.state = newState;
    this.pageNavigator.goTo(this.state.page);
  }

  public remove(): void {
    this.pageNavigator.remove();
    this.recommendationPageCache.clear();
  }
}
