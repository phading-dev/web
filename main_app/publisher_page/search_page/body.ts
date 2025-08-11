import EventEmitter = require("events");
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../common/navigation_bar";
import { ePageWithTopDownCard } from "../../../common/page_elements";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { GAP_1X, PAGE_MAX_WIDTH_L } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import {
  eArchivedSeasonItem,
  eDraftSeasonItem,
  ePublishedSeasonItem,
  eTakenDownSeasonItem,
} from "../common/elements";
import { SearchInput } from "../common/search_input";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { newSearchSeasonsRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface SearchPage {
  on(
    event: "searchSeasons",
    listener: (query: string, state?: SeasonState) => void,
  ): this;
  on(event: "listSeasons", listener: (state: SeasonState) => void): this;
  on(event: "viewSeason", listener: (seasonId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class SearchPage extends EventEmitter {
  public static create(query: string, seasonState?: SeasonState): SearchPage {
    return new SearchPage(SERVICE_CLIENT, () => new Date(), query, seasonState);
  }

  private static LIMIT = 10;

  public body: HTMLDivElement;
  private card = new Ref<HTMLDivElement>();
  public loadingSection = new Ref<ScrollLoadingSection>();
  public searchInput = new Ref<SearchInput>();
  private scoreCursor: number;
  private createdTimeCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    public query: string,
    public seasonState?: SeasonState,
  ) {
    super();
    this.body = ePageWithTopDownCard(
      this.card,
      `max-width: ${PAGE_MAX_WIDTH_L}rem; padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      assign(this.searchInput, new SearchInput(query, seasonState)).body,
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      assign(this.loadingSection, new ScrollLoadingSection()).body,
    );
    this.searchInput.val
      .on("search", (query, state) => this.emit("searchSeasons", query, state))
      .on("list", (state) => this.emit("listSeasons", state));

    this.loadingSection.val
      .setLoadAction(() => this.load())
      .on("loaded", () => this.emit("loaded"))
      .load();
  }

  private async load(): Promise<boolean> {
    let response = await this.serviceClient.send(
      newSearchSeasonsRequest({
        state: this.seasonState,
        query: this.query,
        limit: SearchPage.LIMIT,
        scoreCursor: this.scoreCursor,
        createdTimeCursor: this.createdTimeCursor,
      }),
    );
    let nowDate = this.getNowDate();
    response.seasons.forEach((season) => {
      let item: HTMLDivElement;
      switch (season.state) {
        case SeasonState.DRAFT: {
          item = eDraftSeasonItem(season, nowDate);
          break;
        }
        case SeasonState.PUBLISHED: {
          item = ePublishedSeasonItem(season, nowDate);
          break;
        }
        case SeasonState.ARCHIVED: {
          item = eArchivedSeasonItem(season, nowDate);
          break;
        }
        case SeasonState.TAKEN_DOWN: {
          item = eTakenDownSeasonItem(season, nowDate);
          break;
        }
        default:
          throw new Error(
            `Unhandled season state: ${SeasonState[this.seasonState]}`,
          );
      }
      item.addEventListener("click", () => {
        this.emit("viewSeason", season.seasonId);
      });
      this.loadingSection.val.body.before(item);
    });
    this.scoreCursor = response.scoreCursor;
    this.createdTimeCursor = response.createdTimeCursor;
    return Boolean(response.scoreCursor);
  }

  public remove(): void {
    this.body.remove();
    this.loadingSection.val.stopLoading();
    this.removeAllListeners();
  }
}
