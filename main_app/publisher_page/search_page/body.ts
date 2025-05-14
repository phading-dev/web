import EventEmitter = require("events");
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import {
  eArchivedSeasonItem,
  eDraftSeasonItem,
  ePublishedSeasonItem,
  eSeasonItemsPage,
} from "../common/elements";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { newSearchSeasonsRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface SearchPage {
  on(event: "showDetails", listener: (seasonId: string) => void): this;
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
  private scoreCursor: number;
  private createdTimeCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    private seasonState: SeasonState,
    private query: string,
  ) {
    super();
    this.body = eSeasonItemsPage(
      this.getTitle(),
      this.card,
      assign(this.loadingSection, new ScrollLoadingSection()).body,
    );
    this.loadingSection.val.addLoadAction(() => this.load());
    this.loadingSection.val.on("loaded", () => this.emit("loaded"));
    this.loadingSection.val.load();
  }

  private getTitle(): string {
    switch (this.seasonState) {
      case SeasonState.DRAFT:
        return `${LOCALIZED_TEXT.searchDraftSeasonsTitle[0]}${this.query}${LOCALIZED_TEXT.searchDraftSeasonsTitle[1]}`;
      case SeasonState.PUBLISHED:
        return `${LOCALIZED_TEXT.searchPublishedSeasonsTitle[0]}${this.query}${LOCALIZED_TEXT.searchPublishedSeasonsTitle[1]}`;
      case SeasonState.ARCHIVED:
        return `${LOCALIZED_TEXT.searchArchivedSeasonsTitle[0]}${this.query}${LOCALIZED_TEXT.searchArchivedSeasonsTitle[1]}`;
      default:
        throw new Error(
          `Unhandled season state: ${SeasonState[this.seasonState]}`,
        );
    }
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
            this.emit("showDetails", season.seasonId);
          });
          this.loadingSection.val.body.before(item);
        });
        break;
      case SeasonState.PUBLISHED:
        response.seasons.forEach((season) => {
          let item = ePublishedSeasonItem(season, nowDate);
          item.addEventListener("click", () => {
            this.emit("showDetails", season.seasonId);
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
  }
}
