import EventEmitter = require("events");
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../common/navigation_bar";
import {
  PAGE_MAX_WIDTH_L,
  ePageWithTopDownCard,
} from "../../../common/page_elements";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import {
  eArchivedSeasonItem,
  eDraftSeasonItem,
  ePublishedSeasonItem,
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
    listener: (state: SeasonState, query: string) => void,
  ): this;
  on(event: "listSeasons", listener: (state: SeasonState) => void): this;
  on(event: "viewSeason", listener: (seasonId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class SearchPage extends EventEmitter {
  public static create(seasonState: SeasonState, query: string): SearchPage {
    return new SearchPage(SERVICE_CLIENT, () => new Date(), seasonState, query);
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
    public seasonState: SeasonState,
    public query: string,
  ) {
    super();
    this.body = ePageWithTopDownCard(
      this.card,
      `max-width: ${PAGE_MAX_WIDTH_L}rem; padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      assign(this.searchInput, new SearchInput(seasonState, query)).body,
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      assign(this.loadingSection, new ScrollLoadingSection()).body,
    );
    this.searchInput.val
      .on("search", (state, query) => this.emit("searchSeasons", state, query))
      .on("list", (state) => this.emit("listSeasons", state));

    this.loadingSection.val
      .addLoadAction(() => this.load())
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
    switch (this.seasonState) {
      case SeasonState.DRAFT:
        response.seasons.forEach((season) => {
          let item = eDraftSeasonItem(season, nowDate);
          item.addEventListener("click", () => {
            this.emit("viewSeason", season.seasonId);
          });
          this.loadingSection.val.body.before(item);
        });
        break;
      case SeasonState.PUBLISHED:
        response.seasons.forEach((season) => {
          let item = ePublishedSeasonItem(season, nowDate);
          item.addEventListener("click", () => {
            this.emit("viewSeason", season.seasonId);
          });
          this.loadingSection.val.body.before(item);
        });
        break;
      case SeasonState.ARCHIVED:
        response.seasons.forEach((season) => {
          this.loadingSection.val.body.before(
            eArchivedSeasonItem(season, nowDate),
          );
        });
        break;
      default:
        throw new Error(
          `Unhandled season state: ${SeasonState[this.seasonState]}`,
        );
    }

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
