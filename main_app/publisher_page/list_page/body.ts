import EventEmitter = require("events");
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  OptionPill,
  RadioOptionPillsGroup,
} from "../../../common/option_pills";
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
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface ListPage {
  on(event: "listSeasons", listener: (value: SeasonState) => void): this;
  on(event: "showSeason", listener: (seasonId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class ListPage extends EventEmitter {
  public static create(seasonState: SeasonState): ListPage {
    return new ListPage(SERVICE_CLIENT, () => new Date(), seasonState);
  }

  private static LIMIT = 10;

  public body: HTMLDivElement;
  private card = new Ref<HTMLDivElement>();
  public draftOption = new Ref<OptionPill<SeasonState>>();
  public publishedOption = new Ref<OptionPill<SeasonState>>();
  public archivedOption = new Ref<OptionPill<SeasonState>>();
  public loadingSection = new Ref<ScrollLoadingSection>();
  private lastChangeTimeCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    public seasonState: SeasonState,
  ) {
    super();
    this.body = eSeasonItemsPage(
      this.card,
      E.div(
        {
          class: "list-page-options",
          style: `display: flex; align-items: center; gap: 1rem; padding-bottom: 1rem;`,
        },
        assign(
          this.draftOption,
          new OptionPill(
            LOCALIZED_TEXT.seasonStateDraftOptionLabel,
            SeasonState.DRAFT,
          ),
        ).body,
        assign(
          this.publishedOption,
          new OptionPill(
            LOCALIZED_TEXT.seasonStatePublishedOptionLabel,
            SeasonState.PUBLISHED,
          ),
        ).body,
        assign(
          this.archivedOption,
          new OptionPill(
            LOCALIZED_TEXT.seasonStateArchivedOptionLabel,
            SeasonState.ARCHIVED,
          ),
        ).body,
      ),
      assign(this.loadingSection, new ScrollLoadingSection()).body,
    );
    new RadioOptionPillsGroup([
      this.draftOption.val,
      this.publishedOption.val,
      this.archivedOption.val,
    ])
      .setValue(this.seasonState)
      .on("select", (value) => this.emit("listSeasons", value));

    this.loadingSection.val.addLoadAction(() => this.load());
    this.loadingSection.val.on("loaded", () => this.emit("loaded"));
    this.loadingSection.val.load();
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
            this.emit("showSeason", season.seasonId);
          });
          this.loadingSection.val.body.before(item);
        });
        break;
      case SeasonState.PUBLISHED:
        response.seasons.forEach((season) => {
          let item = ePublishedSeasonItem(season, nowDate);
          item.addEventListener("click", () => {
            this.emit("showSeason", season.seasonId);
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
