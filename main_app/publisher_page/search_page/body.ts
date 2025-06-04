import EventEmitter = require("events");
import { SimpleIconButton } from "../../../common/icon_button";
import { createSearchIcon } from "../../../common/icons";
import { BASIC_INPUT_STYLE } from "../../../common/input_styles";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  OptionPill,
  RadioOptionPillsGroup,
} from "../../../common/option_pills";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { ICON_BUTTON_M, ICON_L } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import {
  eArchivedSeasonItem,
  eDraftSeasonItem,
  ePublishedSeasonItem,
  eSeasonItemsPage,
} from "../common/elements";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { newSearchSeasonsRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface SearchPage {
  on(
    event: "searchSeasons",
    listener: (seasonState: SeasonState, query: string) => void,
  ): this;
  on(event: "showSeason", listener: (seasonId: string) => void): this;
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
  public searchInput = new Ref<HTMLInputElement>();
  public searchActionButton = new Ref<SimpleIconButton>();
  public searchOptionDraft = new Ref<OptionPill<SeasonState>>();
  public searchOptionPublished = new Ref<OptionPill<SeasonState>>();
  public searchOptionArchived = new Ref<OptionPill<SeasonState>>();
  private searchOptionGroup: RadioOptionPillsGroup<SeasonState>;
  private scoreCursor: number;
  private createdTimeCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    public seasonState: SeasonState,
    public query?: string,
  ) {
    super();
    this.body = eSeasonItemsPage(
      this.card,
      E.div(
        {
          class: "search-page-search-input",
          style: `padding-bottom: 1rem; display: flex; flex-flow: column nowrap;`,
        },
        E.div(
          {
            class: "search-page-search-line",
            style: `width: 100%; box-sizing: border-box; display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem;`,
          },
          E.inputRef(this.searchInput, {
            class: "search-page-search-input-field",
            style: `${BASIC_INPUT_STYLE} flex: 1 0 0;`,
            value: query ?? "",
          }),
          assign(
            this.searchActionButton,
            new SimpleIconButton(
              ICON_BUTTON_M,
              ICON_L,
              createSearchIcon("currentColor"),
            ),
          ).body,
        ),
        E.div({
          style: `flex: 0 0 auto; height: 1rem;`,
        }),
        E.div(
          {
            class: "publisher-page-search-bar-state-option",
            style: `display: flex; flex-flow: row nowrap; gap: 1rem; align-items: center;`,
          },
          assign(
            this.searchOptionDraft,
            new OptionPill(
              LOCALIZED_TEXT.seasonStateDraftOptionLabel,
              SeasonState.DRAFT,
            ),
          ).body,
          assign(
            this.searchOptionPublished,
            new OptionPill(
              LOCALIZED_TEXT.seasonStatePublishedOptionLabel,
              SeasonState.PUBLISHED,
            ),
          ).body,
          assign(
            this.searchOptionArchived,
            new OptionPill(
              LOCALIZED_TEXT.seasonStateArchivedOptionLabel,
              SeasonState.ARCHIVED,
            ),
          ).body,
        ),
      ),
      ...(query
        ? [assign(this.loadingSection, new ScrollLoadingSection()).body]
        : []),
    );
    this.searchInput.val.addEventListener("keydown", (event) =>
      this.keydownSearchInput(event),
    );
    this.searchActionButton.val.on("action", () => this.executeSearch());
    this.searchOptionGroup = new RadioOptionPillsGroup([
      this.searchOptionDraft.val,
      this.searchOptionPublished.val,
      this.searchOptionArchived.val,
    ])
      .setValue(seasonState)
      .on("select", () => this.executeSearch());

    this.loadingSection.val
      ?.addLoadAction(() => this.load())
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

    this.scoreCursor = response.scoreCursor;
    this.createdTimeCursor = response.createdTimeCursor;
    return Boolean(response.scoreCursor);
  }

  private keydownSearchInput(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      this.executeSearch();
    }
  }

  private executeSearch(): void {
    let query = this.searchInput.val.value.trim();
    if (!query) {
      return;
    }
    this.emit("searchSeasons", this.searchOptionGroup.value, query);
  }

  public remove(): void {
    this.body.remove();
    this.loadingSection.val?.stopLoading();
  }
}
