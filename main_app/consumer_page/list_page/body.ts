import EventEmitter = require("events");
import { FILLED_BUTTON_STYLE } from "../../../common/button_styles";
import { SCHEME } from "../../../common/color_scheme";
import { IconButton, TooltipPosition } from "../../../common/icon_button";
import {
  createAccountIcon,
  createHistoryIcon,
  createLoadingIcon,
  createSearchIcon,
} from "../../../common/icons";
import { NULLIFIED_INPUT_STYLE } from "../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { FONT_L, FONT_M, ICON_M, ICON_S } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { PublisherContextItem } from "./publisher_context_item";
import { SeasonItem } from "./season_item";
import { recommendSeasons } from "@phading/product_recommendation_service_interface/consumer/frontend/show/client";
import { PublisherDetail } from "@phading/product_recommendation_service_interface/consumer/frontend/show/publisher_detail";
import { SeasonOverview } from "@phading/product_recommendation_service_interface/consumer/frontend/show/season_overview";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface ListPage {
  on(event: "play", listener: (seasonId: string, episodeId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
  on(event: "loadedAll", listener: () => void): this;
  on(event: "goToAccount", listener: () => void): this;
  on(event: "goToHistory", listener: () => void): this;
  on(event: "search", listener: (query: string) => void): this;
}

export class ListPage extends EventEmitter {
  public static create(state: ListPageState): ListPage {
    return new ListPage(
      SERVICE_CLIENT,
      SeasonItem.create,
      PublisherContextItem.create,
      state,
    );
  }

  private static ACCOUNT_ID_QUERY_PREFIX = "accountId=";

  public body: HTMLDivElement;
  private contextContainer = new Ref<HTMLDivElement>();
  private contentContainer = new Ref<HTMLDivElement>();
  private loadingSection = new Ref<HTMLDivElement>();
  public tryReloadButton = new Ref<HTMLDivElement>();
  private loadingIcon = new Ref<HTMLDivElement>();
  public accountButton = new Ref<IconButton>();
  public historyButton = new Ref<IconButton>();
  public searchInput = new Ref<HTMLInputElement>();
  public searchButton = new Ref<IconButton>();
  private loadingObserver: IntersectionObserver;
  public seasonItems = new Set<SeasonItem>();
  private moreContentLoaded: boolean;
  private originalQuery = "";
  private cursor: string;

  public constructor(
    private serviceClient: WebServiceClient,
    private createSeasonItem: (season: SeasonOverview) => SeasonItem,
    private createPublisherContextItem: (
      publisher: PublisherDetail,
    ) => PublisherContextItem,
    state?: ListPageState,
  ) {
    super();
    this.body = E.div(
      {
        class: "recommendation-page",
        style: `width: 100%; height: 100%; box-sizing: border-box; background-color: ${SCHEME.neutral4}; display: flex; flex-flow: column nowrap;`,
      },
      E.divRef(this.contextContainer, {
        class: "recommendation-page-context",
        style: `flex: 0 0 auto; width: 100%;`,
      }),
      E.div(
        {
          class: "recommendation-page-card",
          style: `flex: 1 1 0; min-height: 0; width: 100%; overflow-y: auto;`,
        },
        E.divRef(this.contentContainer, {
          class: "recommendation-page-content-container",
          style: `width: 100%; display: grid; grid-template-columns: repeat(auto-fill, minmax(20.2rem, 30.2rem)); justify-content: center; gap: .1rem;`,
        }),
      ),
      E.div(
        {
          class: "recommendation-page-bottom-action-bar",
          style: `display: flex; flex-flow: row nowrap; justify-content: center; align-items: flex-end; gap: 1rem;`,
        },
        assign(
          this.accountButton,
          IconButton.create(
            ICON_M,
            0.7,
            `flex: 0 0 auto;`,
            createAccountIcon("currentColor"),
            TooltipPosition.TOP,
            LOCALIZED_TEXT.accountLabel,
          ).enable(),
        ).body,
        assign(
          this.historyButton,
          IconButton.create(
            ICON_M,
            0.7,
            `flex: 0 0 auto;`,
            createHistoryIcon("currentColor"),
            TooltipPosition.TOP,
            LOCALIZED_TEXT.historyLabel,
          ).enable(),
        ).body,
        E.inputRef(this.searchInput, {
          class: "recommendation-page-search-input",
          style: `${NULLIFIED_INPUT_STYLE} font-size: ${FONT_L}rem; line-height: 140%; color: ${SCHEME.neutral0}; border-bottom: .1rem solid; flex: 0 1 auto; width: 60rem; margin-bottom: 1rem;`,
        }),
        assign(
          this.searchButton,
          IconButton.create(
            ICON_M,
            0.7,
            `flex: 0 0 auto;`,
            createSearchIcon("currentColor"),
            TooltipPosition.TOP,
            LOCALIZED_TEXT.searchLabel,
          ).enable(),
        ).body,
      ),
    );
    if (state) {
      if (state.query) {
        this.originalQuery = state.query;
      } else if (state.accountId) {
        this.originalQuery = `${ListPage.ACCOUNT_ID_QUERY_PREFIX}${state.accountId}`;
      }
    }
    this.searchInput.val.value = this.originalQuery;

    this.tryReloadButton.val.addEventListener("click", () => this.loadMore());
    this.loadingObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.loadMore();
      }
    });
    this.loadMore();

    this.accountButton.val.on("action", () => this.emit("goToAccount"));
    this.historyButton.val.on("action", () => this.emit("goToHistory"));
    this.searchInput.val.addEventListener("keydown", (event) =>
      this.enterToSearch(event),
    );
    this.searchButton.val.on("action", () => this.trySearch());
  }

  private async loadMore(): Promise<void> {
    this.unobserveLoading();
    this.tryReloadButton.val.style.display = "none";
    this.loadingIcon.val.style.display = "block";
    try {
      await this.loadMoreAndTryRemoveOldContent();
    } catch (e) {
      console.log(e);
    }
    this.tryObserveLoading();
    this.tryReloadButton.val.style.display = "block";
    this.loadingIcon.val.style.display = "none";
  }

  private tryObserveLoading(): void {
    if (this.moreContentLoaded) {
      this.loadingObserver.observe(this.loadingSection.val);
    }
  }

  private unobserveLoading(): void {
    this.loadingObserver.unobserve(this.loadingSection.val);
  }

  public async loadMoreAndTryRemoveOldContent(): Promise<void> {
    let response = await recommendSeasons(this.serviceClient, {
      query: this.originalQuery,
      cursor: this.cursor,
    });
    this.cursor = response.cursor;

    if (response.context && response.context.publisher) {
      this.contextContainer.val.append(
        this.createPublisherContextItem(response.context.publisher).body,
      );
    }

    for (let season of response.seasons) {
      let item = this.createSeasonItem(season)
        .on("play", (episodeId) => this.emit("play", episodeId))
        .on("focusAccount", (accountId) =>
          this.emit("focusAccount", accountId),
        );
      this.contentContainer.val.append(item.body);
      this.seasonItems.add(item);
    }

    let itemsToRemove = new Array<SeasonItem>();
    for (let seasonItem of this.seasonItems) {
      let bottom = seasonItem.body.getBoundingClientRect().bottom;
      if (bottom < 0) {
        itemsToRemove.push(seasonItem);
      } else {
        break;
      }
    }
    for (let item of itemsToRemove) {
      item.remove();
      this.seasonItems.delete(item);
    }

    if (response.seasons.length > 0) {
      this.moreContentLoaded = true;
      this.emit("loaded");
    } else {
      this.moreContentLoaded = false;
      this.emit("loadedAll");
    }
  }

  private enterToSearch(event: KeyboardEvent): void {
    if (event.code === "Enter") {
      this.trySearch();
    }
  }

  private trySearch(): void {
    if (this.searchInput.val.value === this.originalQuery) {
      return;
    }
    this.emit("search", this.searchInput.val.value);
  }

  public remove(): void {
    this.body.remove();
  }
}
