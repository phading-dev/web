import EventEmitter = require("events");
import { IconButton, createBackButton } from "../../../../common/button";
import { SCHEME } from "../../../../common/color_scheme";
import {
  calculateEstimatedShowCreditMoneyAndFormat,
  calculateEstimatedShowMoneyAndFormat,
} from "../../../../common/formatter/price";
import { formatSecondsAsHHMMSS } from "../../../../common/formatter/timestamp";
import { COMMON_BASIC_INPUT_STYLE } from "../../../../common/input_styles";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import {
  OptionPill,
  RadioOptionsGroup,
} from "../../../../common/option_buttons";
import {
  eCenteredTitle,
  ePageWithTopDownCard,
} from "../../../../common/page_elements";
import { ScrollLoadingSection } from "../../../../common/scroll_loading_section";
import {
  FONT_M,
  FONT_S,
  GAP_0_5X,
  GAP_1X,
  GAP_2X,
  LINE_HEIGHT_M,
  LINE_HEIGHT_S,
  PAGE_MAX_WIDTH_L,
} from "../../../../common/sizes";
import { eRowBoxWithArrow } from "../../../../common/value_box";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { newListPublishedEpisodesRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { SeasonDetails } from "@phading/product_service_interface/show/web/publisher/details";
import { EpisodeSummary } from "@phading/product_service_interface/show/web/publisher/summary";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export enum SortByOption {
  NEWEST,
  OLDEST,
}

export interface PublishedEpisodesListPage {
  on(event: "back", listener: () => void): this;
  on(event: "viewEpisode", listener: (episodeId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class PublishedEpisodesListPage extends EventEmitter {
  public static create(
    seasonId: string,
    seasonDetails: SeasonDetails,
  ): PublishedEpisodesListPage {
    return new PublishedEpisodesListPage(
      SERVICE_CLIENT,
      () => new Date(),
      seasonId,
      seasonDetails,
    );
  }

  private static LIST_PUBLISHED_EPISODES_LIMIT = 10;

  public body: HTMLDivElement;
  private card = new Ref<HTMLDivElement>();
  public backButton = new Ref<IconButton>();
  public listPublishedEpisodeIndexCursorInput = new Ref<HTMLInputElement>();
  private sortByOptionsGroup: RadioOptionsGroup<SortByOption>;
  public sortByOptionNewest = new Ref<OptionPill<SortByOption>>();
  public sortByOptionOldest = new Ref<OptionPill<SortByOption>>();
  public publishedEpisodeElements = new Array<HTMLDivElement>();
  private scrollLoadingSection = new Ref<ScrollLoadingSection>();
  private listPublishedEpisodeIndexCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    public seasonId: string,
    public season: SeasonDetails,
  ) {
    super();
    this.body = ePageWithTopDownCard(
      this.card,
      `max-width: ${PAGE_MAX_WIDTH_L}rem; padding: ${GAP_2X}rem ${GAP_1X}rem ${PAGE_NAVIGATION_PADDING_BOTTOM}rem ${GAP_1X}rem; display: flex; flex-flow: column nowrap;`,
      assign(this.backButton, createBackButton()).body,
      eCenteredTitle(
        this.season.state === SeasonState.DRAFT
          ? LOCALIZED_TEXT.seasonReadyEpisodes
          : LOCALIZED_TEXT.seasonPublishedEpisodes,
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.div(
        {
          class: "season-details-published-episodes-controls",
          style: `display: flex; flex-flow: row wrap; align-items: center; justify-content: space-between; gap: ${GAP_1X}rem;`,
        },
        E.div(
          {
            class: "season-details-published-episodes-start-from",
            style: `display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: ${GAP_0_5X}rem;`,
          },
          E.div(
            {
              class: "season-details-published-episodes-start-from-label",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.seasonPublishedEpisodesStartFromLabel),
          ),
          E.inputRef(this.listPublishedEpisodeIndexCursorInput, {
            class: "season-details-published-episodes-start-from-input",
            style: `${COMMON_BASIC_INPUT_STYLE} width: 7rem; text-align: center;`,
          }),
        ),
        E.div(
          {
            class: "season-details-published-episodes-sort-by",
            style: `display: flex; flex-flow: row nowrap; align-items: center; align-self: center; gap: ${GAP_0_5X}rem;`,
          },
          E.div(
            {
              class: "season-details-published-episodes-sort-by-label",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(LOCALIZED_TEXT.seasonPublishedEpisodesSortByLabel),
          ),
          assign(
            this.sortByOptionNewest,
            new OptionPill(
              LOCALIZED_TEXT.seasonPublishedEpisodesSortByNewestOption,
              SortByOption.NEWEST,
            ),
          ).body,
          assign(
            this.sortByOptionOldest,
            new OptionPill(
              LOCALIZED_TEXT.seasonPublishedEpisodesSortByOldestOption,
              SortByOption.OLDEST,
            ),
          ).body,
        ),
      ),
      assign(this.scrollLoadingSection, new ScrollLoadingSection()).body,
    );
    this.backButton.val.addAction(() => this.emit("back"));
    this.scrollLoadingSection.val
      .setLoadAction(() => this.loadPublishedEpisodes())
      .on("loaded", () => this.emit("loaded"));
    this.sortByOptionsGroup = new RadioOptionsGroup([
      this.sortByOptionNewest.val,
      this.sortByOptionOldest.val,
    ])
      .setValue(SortByOption.NEWEST)
      .on("select", () => this.resetAndReloadPublishedEpisodes());
    this.listPublishedEpisodeIndexCursorInput.val.addEventListener(
      "change",
      () => this.resetAndReloadPublishedEpisodes(),
    );
    this.resetAndReloadPublishedEpisodes();
  }

  private async loadPublishedEpisodes(): Promise<boolean> {
    let response = await this.serviceClient.send(
      newListPublishedEpisodesRequest({
        seasonId: this.seasonId,
        indexCursor: this.listPublishedEpisodeIndexCursor,
        next: this.sortByOptionsGroup.value === SortByOption.OLDEST,
        limit: PublishedEpisodesListPage.LIST_PUBLISHED_EPISODES_LIMIT,
      }),
    );
    let nowDate = this.getNowDate();
    this.scrollLoadingSection.val.body.before(
      ...response.episodes.map((episode) =>
        this.ePublishedEpisode(episode, nowDate),
      ),
    );
    this.listPublishedEpisodeIndexCursor = response.indexCursor;
    return Boolean(response.indexCursor);
  }

  private resetAndReloadPublishedEpisodes(): void {
    let cursor = parseInt(this.listPublishedEpisodeIndexCursorInput.val.value);
    if (
      isNaN(cursor) ||
      cursor < 1 ||
      cursor >= this.season.totalPublishedEpisodes
    ) {
      this.listPublishedEpisodeIndexCursorInput.val.value = "";
      this.listPublishedEpisodeIndexCursor = undefined;
    } else {
      this.listPublishedEpisodeIndexCursor =
        this.sortByOptionsGroup.value === SortByOption.NEWEST
          ? cursor + 1
          : cursor - 1; // Adjust cursor because it's exclusive.
    }
    for (let element of this.publishedEpisodeElements) {
      element.remove();
    }
    this.publishedEpisodeElements.length = 0;
    this.scrollLoadingSection.val.load();
  }

  private ePublishedEpisode(
    episode: EpisodeSummary,
    nowDate: Date,
  ): HTMLDivElement {
    let body = eRowBoxWithArrow(
      [
        E.div(
          {
            class: "season-details-published-episode-index",
            style: `flex: 0 0 auto; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral1};`,
          },
          E.text(
            `${LOCALIZED_TEXT.seasonPublishedEpisodeIndex}${episode.index}`,
          ),
        ),
        E.div(
          {
            class: "season-details-published-episode-info-column",
            style: `display: flex; flex-flow: column nowrap;`,
          },
          E.div(
            {
              class: "season-details-published-episode-name",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(episode.name),
          ),
          E.div(
            {
              class: "season-details-published-episode-secondary-info",
              style: `display: flex; flex-flow: row wrap; column-gap: ${GAP_1X}rem;`,
            },
            E.div(
              {
                class: "season-details-published-episode-duration",
                style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
              },
              E.text(
                `${LOCALIZED_TEXT.seasonEpisodeDuration}${formatSecondsAsHHMMSS(episode.videoContainer.durationSec)}`,
              ),
            ),
            E.div(
              {
                class: "season-details-published-episode-earnings",
                style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
              },
              E.text(
                `${LOCALIZED_TEXT.seasonEpisodeEarnings}${calculateEstimatedShowMoneyAndFormat(
                  this.season.grade,
                  episode.videoContainer.durationSec,
                  nowDate,
                )}`,
              ),
            ),
            E.div(
              {
                class: "season-details-published-episode-net-earnings",
                style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
              },
              E.text(
                `${LOCALIZED_TEXT.seasonEpisodeNetEarnings}${calculateEstimatedShowCreditMoneyAndFormat(
                  this.season.grade,
                  episode.videoContainer.durationSec,
                  nowDate,
                )}`,
              ),
            ),
          ),
        ),
      ],
      {
        columnGap: GAP_0_5X,
        customStyle: `margin-top: ${GAP_1X}rem;`,
      },
    );
    body.addEventListener("click", () =>
      this.emit("viewEpisode", episode.episodeId),
    );
    this.publishedEpisodeElements.push(body);
    return body;
  }

  public remove(): void {
    this.body.remove();
    this.scrollLoadingSection.val.stopLoading();
    this.removeAllListeners();
  }
}
