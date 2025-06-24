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
import { newListSeasonsRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface ListPage {
  on(event: "listSeasons", listener: (state: SeasonState) => void): this;
  on(
    event: "searchSeasons",
    listener: (state: SeasonState, query: string) => void,
  ): this;
  on(event: "viewSeason", listener: (seasonId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class ListPage extends EventEmitter {
  public static create(seasonState: SeasonState): ListPage {
    return new ListPage(SERVICE_CLIENT, () => new Date(), seasonState);
  }

  private static LIMIT = 10;

  public body: HTMLDivElement;
  private card = new Ref<HTMLDivElement>();
  public searchInput = new Ref<SearchInput>();
  public loadingSection = new Ref<ScrollLoadingSection>();
  private lastChangeTimeCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    public seasonState: SeasonState,
  ) {
    super();
    this.body = ePageWithTopDownCard(
      this.card,
      `max-width: ${PAGE_MAX_WIDTH_L}rem; padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      assign(this.searchInput, new SearchInput(seasonState, "")).body,
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      assign(this.loadingSection, new ScrollLoadingSection()).body,
    );
    this.searchInput.val
      .on("list", (state) => this.emit("listSeasons", state))
      .on("search", (state, query) => this.emit("searchSeasons", state, query));

    this.loadingSection.val
      .addLoadAction(() => this.load())
      .on("loaded", () => this.emit("loaded"))
      .load();
  }

  private async load(): Promise<boolean> {
    let response = await this.serviceClient.send(
      newListSeasonsRequest({
        state: this.seasonState,
        limit: ListPage.LIMIT,
        lastChangeTimeCursor: this.lastChangeTimeCursor,
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

    this.lastChangeTimeCursor = response.lastChangeTimeCursor;
    return Boolean(response.lastChangeTimeCursor);
  }

  public remove(): void {
    this.body.remove();
    this.loadingSection.val.stopLoading();
    this.removeAllListeners();
  }
}
