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
import { newListSeasonsRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface ListPage {
  on(event: "showDetails", listener: (seasonId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class ListPage extends EventEmitter {
  public static create(seasonState: SeasonState): ListPage {
    return new ListPage(SERVICE_CLIENT, () => new Date(), seasonState);
  }

  private static LIMIT = 10;

  public body: HTMLDivElement;
  private card = new Ref<HTMLDivElement>();
  public loadingSection = new Ref<ScrollLoadingSection>();
  private lastChangeTimeCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    private seasonState: SeasonState,
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
        return LOCALIZED_TEXT.draftSeasonsTitle;
      case SeasonState.PUBLISHED:
        return LOCALIZED_TEXT.publishedSeasonsTitle;
      case SeasonState.ARCHIVED:
        return LOCALIZED_TEXT.archivedSeasonsTitle;
      default:
        throw new Error(
          `Unhandled season state: ${SeasonState[this.seasonState]}`,
        );
    }
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
          this.loadingSection.val.body.before(eArchivedSeasonItem(season, nowDate));
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
  }
}
