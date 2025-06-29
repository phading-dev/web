import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import { calculateEstimatedShowCreditMoneyAndFormat, calculateEstimatedShowMoneyAndFormat } from "../../../../common/formatter/price";
import { formatSecondsAsHHMMSS } from "../../../../common/formatter/timestamp";
import {
  SimpleIconButton,
  createBackButton,
} from "../../../../common/icon_button";
import { BASIC_INPUT_STYLE } from "../../../../common/input_styles";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import {
  PAGE_MAX_WIDTH_L,
  ePageWithTopDownCard,
} from "../../../../common/page_elements";
import { ScrollLoadingSection } from "../../../../common/scroll_loading_section";
import {
  FONT_M,
  FONT_S,
  ICON_BUTTON_L,
} from "../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import {
  newListDraftEpisodesRequest,
  newListPublishedEpisodesRequest,
} from "@phading/product_service_interface/show/web/publisher/client";
import { SeasonDetails } from "@phading/product_service_interface/show/web/publisher/details";
import { EpisodeSummary } from "@phading/product_service_interface/show/web/publisher/summary";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface EpisodesListPage {
  on(event: "back", listener: () => void): this;
  on(event: "viewEpisode", listener: (episodeId: string) => void): this;
  on(event: "loadedDrafts", listener: () => void): this;
  on(event: "loadedPublishedEpisodes", listener: () => void): this;
}

export class EpisodesListPage extends EventEmitter {
  public static create(
    seasonId: string,
    seasonDetails: SeasonDetails,
  ): EpisodesListPage {
    return new EpisodesListPage(
      SERVICE_CLIENT,
      () => new Date(),
      seasonId,
      seasonDetails,
    );
  }

  private static LIST_PUBLISHED_EPISODES_LIMIT = 10;

  public body: HTMLDivElement;
  private card = new Ref<HTMLDivElement>();
  public backButton = new Ref<SimpleIconButton>();
  public draftEpisodeElements = new Array<HTMLDivElement>();
  private listPublishedEpisodesStartFrom = new Ref<HTMLDivElement>();
  public publishedEpisodeElements = new Array<HTMLDivElement>();
  public listPublishedEpisodeIndexCursorInput = new Ref<HTMLInputElement>();
  private scrollLoadingSection = new Ref<ScrollLoadingSection>();
  private listPublishedEpisodeIndexCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    public seasonId: string,
    public seasonDetails: SeasonDetails,
  ) {
    super();
    this.body = ePageWithTopDownCard(
      this.card,
      `max-width: ${PAGE_MAX_WIDTH_L}rem; padding: ${ICON_BUTTON_L + 1}rem 2rem ${PAGE_NAVIGATION_PADDING_BOTTOM}rem 2rem; display: flex; flex-flow: column nowrap;`,
    );
    this.loadDrafts();
  }

  private async loadDrafts(): Promise<void> {
    let { episodes: draftEpisodes } = await this.serviceClient.send(
      newListDraftEpisodesRequest({
        seasonId: this.seasonId,
      }),
    );
    this.card.val.append(
      assign(this.backButton, createBackButton()).body,
      E.div(
        {
          class: "season-details-draft-episodes-total",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; width: 100%; box-sizing: border-box; padding-bottom: 1rem; text-align: center; border-bottom: .1rem solid ${SCHEME.neutral1};`,
        },
        E.text(
          `${LOCALIZED_TEXT.seasonTotalDraftEpisodes[0]}${draftEpisodes.length}${LOCALIZED_TEXT.seasonTotalDraftEpisodes[1]}`,
        ),
      ),
      ...draftEpisodes.map((episode) => this.eDraftEpisode(episode)),
      E.div({
        style: `flex: 0 0 auto; height: 3rem;`,
      }),
      E.div(
        {
          class: "season-details-published-episodes-total",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; width: 100%; box-sizing: border-box; padding-bottom: 1rem; text-align: center; border-bottom: .1rem solid ${SCHEME.neutral1};`,
        },
        E.text(
          `${LOCALIZED_TEXT.seasonTotalPublishedEpisodes[0]}${this.seasonDetails.totalPublishedEpisodes}${LOCALIZED_TEXT.seasonTotalPublishedEpisodes[1]}`,
        ),
      ),
      ...(this.seasonDetails.totalPublishedEpisodes === 0
        ? []
        : [
            E.divRef(
              this.listPublishedEpisodesStartFrom,
              {
                class: "season-details-published-episodes-start-from",
                style: `display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: .5rem; padding: .5rem 0 1rem 0; border-bottom: .1rem solid ${SCHEME.neutral1};`,
              },
              E.div(
                {
                  class: "season-details-published-episodes-start-from-label",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.seasonPublishedEpisodesStartFromLabel),
              ),
              E.inputRef(this.listPublishedEpisodeIndexCursorInput, {
                class: "season-details-published-episodes-start-from-input",
                style: `${BASIC_INPUT_STYLE} width: 5rem; text-align: center;`,
              }),
            ),
            assign(this.scrollLoadingSection, new ScrollLoadingSection()).body,
          ]),
    );
    this.backButton.val.on("action", () => this.emit("back"));
    if (this.seasonDetails.totalPublishedEpisodes > 0) {
      this.scrollLoadingSection.val.addLoadAction(() =>
        this.loadPublishedEpisodes(),
      );
      this.scrollLoadingSection.val.on("loaded", () =>
        this.emit("loadedPublishedEpisodes"),
      );
      this.listPublishedEpisodeIndexCursorInput.val.addEventListener(
        "change",
        () => this.setCursorAndReloadPublishedEpisodes(),
      );
      this.setCursorAndReloadPublishedEpisodes();
    }
    this.emit("loadedDrafts");
  }

  private eDraftEpisode(episode: EpisodeSummary): HTMLDivElement {
    let body = E.div(
      {
        class: "season-details-draft-episode",
        style: `cursor: pointer; display: flex; flex-flow: column nowrap; padding: 1.5rem 1rem; border-bottom: .1rem solid ${SCHEME.neutral1}; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
      },
      E.text(episode.name),
    );
    this.draftEpisodeElements.push(body);
    body.addEventListener("click", () =>
      this.emit("viewEpisode", episode.episodeId),
    );
    return body;
  }

  private async loadPublishedEpisodes(): Promise<boolean> {
    let response = await this.serviceClient.send(
      newListPublishedEpisodesRequest({
        seasonId: this.seasonId,
        indexCursor: this.listPublishedEpisodeIndexCursor,
        next: false,
        limit: EpisodesListPage.LIST_PUBLISHED_EPISODES_LIMIT,
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

  private async setCursorAndReloadPublishedEpisodes(): Promise<void> {
    let cursor = parseInt(this.listPublishedEpisodeIndexCursorInput.val.value);
    if (isNaN(cursor) || cursor < 1) {
      this.listPublishedEpisodeIndexCursor = undefined;
    } else {
      this.listPublishedEpisodeIndexCursor = cursor + 1; // + 1 since the cursor is exclusive
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
    let body = E.div(
      {
        class: "season-details-published-episode",
        style: `cursor: pointer; display: flex; flex-flow: row nowrap; gap: 1rem; align-items: center; padding: 1rem; border-bottom: .1rem solid ${SCHEME.neutral1};`,
      },
      E.div(
        {
          class: "season-details-published-episode-index",
          style: `flex: 0 0 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(`${LOCALIZED_TEXT.seasonPublishedEpisodeIndex}${episode.index}`),
      ),
      E.div(
        {
          class: "season-details-published-episode-info-column",
          style: `display: flex; flex-flow: column nowrap; gap: .5rem;`,
        },
        E.div(
          {
            class: "season-details-published-episode-name",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(episode.name),
        ),
        E.div(
          {
            class: "season-details-published-episode-secondary-info",
            style: `display: flex; flex-flow: row wrap; column-gap: 2rem; row-gap: .5rem;`,
          },
          E.div(
            {
              class: "season-details-published-episode-duration",
              style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              `${LOCALIZED_TEXT.seasonEpisodeDuration}${formatSecondsAsHHMMSS(episode.videoContainer.durationSec)}`,
            ),
          ),
          E.div(
            {
              class: "season-details-published-episode-earnings",
              style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              `${LOCALIZED_TEXT.seasonEpisodeEarnings}${calculateEstimatedShowMoneyAndFormat(
                this.seasonDetails.grade,
                episode.videoContainer.durationSec,
                nowDate,
              )}`,
            ),
          ),
          E.div(
            {
              class: "season-details-published-episode-net-earnings",
              style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              `${LOCALIZED_TEXT.seasonEpisodeNetEarnings}${calculateEstimatedShowCreditMoneyAndFormat(
                this.seasonDetails.grade,
                episode.videoContainer.durationSec,
                nowDate,
              )}`,
            ),
          ),
        ),
      ),
    );
    body.addEventListener("click", () =>
      this.emit("viewEpisode", episode.episodeId),
    );
    this.publishedEpisodeElements.push(body);
    return body;
  }

  public remove(): void {
    this.body.remove();
    this.scrollLoadingSection.val?.stopLoading();
    this.removeAllListeners();
  }
}
