import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import {
  formatLastChangeTimeLong,
  formatNegativeTimezoneOffset,
} from "../../../../common/formatter/date";
import { formatShowPrice } from "../../../../common/formatter/price";
import { createPlusIcon } from "../../../../common/icons";
import { BASIC_INPUT_STYLE } from "../../../../common/input_styles";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import {
  PAGE_MEDIUM_TOP_DOWN_CARD_STYLE,
  PAGE_TOP_DOWN_CARD_BACKGROUND_STYLE,
} from "../../../../common/page_style";
import { ScrollLoadingSection } from "../../../../common/scroll_loading_section";
import {
  FONT_L,
  FONT_M,
  FONT_S,
  FONT_WEIGHT_600,
  ICON_L,
} from "../../../../common/sizes";
import {
  eColumnBoxWithArrow,
  eLabelAndText,
} from "../../../../common/value_box";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { ENV_VARS } from "../../../../env_vars";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../common/elements";
import { MIN_GRADE_EFFECTIVE_GAP_DAY } from "@phading/constants/show";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import {
  newGetSeasonRequest,
  newListDraftEpisodesRequest,
  newListPublishedEpisodesRequest,
} from "@phading/product_service_interface/show/web/publisher/client";
import { EpisodeSummary } from "@phading/product_service_interface/show/web/publisher/summary";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { TzDate } from "@selfage/tz_date";
import { WebServiceClient } from "@selfage/web_service_client";

export interface InfoPage {
  on(event: "editCoverImage", listener: () => void): this;
  on(event: "editSeasonInfo", listener: () => void): this;
  on(event: "editSeasonPricing", listener: () => void): this;
  on(event: "createDraftEpisode", listener: () => void): this;
  on(event: "editDraftEpisode", listener: (episodeId: string) => void): this;
  on(
    event: "editPublishedEpisode",
    listener: (episodeId: string) => void,
  ): this;
  on(event: "loaded", listener: () => void): this;
  on(event: "loadedPublishedEpisodes", listener: () => void): this;
}

// Assumption:
//  - Archived seasons don't have cover images and don't have any draft/published episodes. All information is not editable.
export class InfoPage extends EventEmitter {
  public static create(seasonId: string): InfoPage {
    return new InfoPage(SERVICE_CLIENT, () => new Date(), seasonId);
  }

  private static LIST_PUBLISHED_EPISODES_LIMIT = 10;

  public body: HTMLDivElement;
  public coverImageButton = new Ref<HTMLDivElement>();
  public seasonInfoButton = new Ref<HTMLDivElement>();
  public seasonPricingButton = new Ref<HTMLDivElement>();
  public createDraftEpisodeButton = new Ref<HTMLDivElement>();
  public draftEpisodeElements = new Array<HTMLDivElement>();
  private listPublishedEpisodesStartFrom = new Ref<HTMLDivElement>();
  public publishedEpisodeElements = new Array<HTMLDivElement>();
  public listPublishedEpisodeIndexCursorInput = new Ref<HTMLInputElement>();
  private scrollLoadingSection = new Ref<ScrollLoadingSection>();
  private listPublishedEpisodeIndexCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    private seasonId: string,
  ) {
    super();
    this.body = E.div({
      class: "season-details-info-page",
      style: PAGE_TOP_DOWN_CARD_BACKGROUND_STYLE,
    });
    this.load();
  }

  private async load(): Promise<void> {
    let [{ seasonDetails }, { episodes: draftEpisodes }] = await Promise.all([
      this.serviceClient.send(
        newGetSeasonRequest({
          seasonId: this.seasonId,
        }),
      ),
      this.serviceClient.send(
        newListDraftEpisodesRequest({
          seasonId: this.seasonId,
        }),
      ),
    ]);
    this.body.append(
      E.div(
        {
          class: "season-details-info-card",
          style: `${PAGE_MEDIUM_TOP_DOWN_CARD_STYLE} padding: 2rem 2rem ${PAGE_NAVIGATION_PADDING_BOTTOM}rem 2rem; display: flex; flex-flow: column nowrap;`,
        },
        ...(seasonDetails.state === SeasonState.ARCHIVED
          ? []
          : [
              assign(
                this.coverImageButton,
                eColumnBoxWithArrow(
                  [
                    seasonDetails.coverImageUrl
                      ? E.image({
                          class: "season-details-cover-image",
                          style: `width: 100%; aspect-ratio: 2/3; object-fit: contain;`,
                          src: seasonDetails.coverImageUrl,
                        })
                      : E.div(
                          {
                            class: "season-details-cover-image",
                            style: `width: 100%; aspect-ratio: 2/3; display: flex; justify-content: center; align-items: center; text-align: center; font-size: ${FONT_L}rem; color: ${SCHEME.neutral1};`,
                          },
                          E.text(LOCALIZED_TEXT.seasonAddCoverImageLabel),
                        ),
                  ],
                  {
                    customeStyle:
                      "margin-bottom: 2rem; align-self: center; width: 100%; max-width: 44rem; box-sizing: border-box;",
                  },
                ),
              ),
            ]),
        assign(
          this.seasonInfoButton,
          eColumnBoxWithArrow(
            [
              eLabelAndText(LOCALIZED_TEXT.seasonNameLabel, seasonDetails.name),
              eLabelAndText(
                LOCALIZED_TEXT.seasonDescriptionLabel,
                seasonDetails.description,
              ),
            ],
            {
              clickable:
                seasonDetails.state === SeasonState.ARCHIVED ? false : true,
            },
          ),
        ),
        E.div({
          style: `flex: 0 0 auto; height: 2rem;`,
        }),
        assign(
          this.seasonPricingButton,
          eColumnBoxWithArrow(
            [
              E.div(
                {
                  class: "season-pricing-title",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.seasonPricingLabel),
              ),
              E.div(
                {
                  class: "season-details-current-rate-label",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(
                  `${LOCALIZED_TEXT.seasonCurrentRateLabel}${formatShowPrice(seasonDetails.grade, this.getNowDate())}`,
                ),
              ),
              ...(seasonDetails.nextGrade
                ? [
                    E.div(
                      {
                        class: "season-details-new-rate-label",
                        style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                      },
                      E.text(
                        `${LOCALIZED_TEXT.seasonNewRateLabel}${formatShowPrice(
                          seasonDetails.nextGrade.grade,
                          this.getNowDate(),
                        )}`,
                      ),
                    ),
                    E.div(
                      {
                        class: "season-details-new-rate-effective-date-label",
                        style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                      },
                      E.text(
                        `${LOCALIZED_TEXT.seasonNewRateEffectiveDateLabel}${TzDate.fromLocalDateString(
                          seasonDetails.nextGrade.effectiveDate,
                          ENV_VARS.timezoneNegativeOffset,
                        ).toLocalDateISOString()} (${formatNegativeTimezoneOffset(ENV_VARS.timezoneNegativeOffset)})`,
                      ),
                    ),
                  ]
                : [
                    E.div(
                      {
                        class: "season-details-new-rate-requirement",
                        style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
                      },
                      E.text(this.getPricingFooterText(seasonDetails.state)),
                    ),
                  ]),
            ],
            {
              clickable:
                seasonDetails.state === SeasonState.ARCHIVED ? false : true,
              linesGap: 1,
            },
          ),
        ),
        E.div({
          style: `flex: 0 0 auto; height: 2rem;`,
        }),
        eColumnBoxWithArrow(
          [
            E.div(
              {
                class: "season-details-state-title",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(LOCALIZED_TEXT.seasonStateLabel),
            ),
            E.div(
              {
                class: "season-details-state",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
              },
              E.text(this.getStateText(seasonDetails.state)),
            ),
            E.div(
              {
                class: "season-details-state-description",
                style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(this.getStateFooterText(seasonDetails.state)),
            ),
          ],
          {
            clickable:
              seasonDetails.state === SeasonState.ARCHIVED ? false : true,
            linesGap: 1,
          },
        ),
        E.div({
          style: `flex: 0 0 auto; height: 2rem;`,
        }),
        E.div(
          {
            class: "season-details-last-change-time",
            style: `align-self: flex-end; font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${LOCALIZED_TEXT.seasonLastChangeTime}${formatLastChangeTimeLong(seasonDetails.lastChangeTimeMs)}`,
          ),
        ),
        E.div({
          style: `flex: 0 0 auto; height: .5rem;`,
        }),
        E.div(
          {
            class: "season-details-created-time",
            style: `align-self: flex-end; font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${LOCALIZED_TEXT.seasonCreatedTime}${formatLastChangeTimeLong(seasonDetails.createdTimeMs)}`,
          ),
        ),
        ...(seasonDetails.state === SeasonState.ARCHIVED
          ? []
          : [
              E.div({
                style: `flex: 0 0 auto; height: 2rem;`,
              }),
              E.div(
                {
                  class: "season-details-draft-episodes-total",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; width: 100%; box-sizing: border-box; padding: 1rem; text-align: center; border-bottom: .1rem solid ${SCHEME.neutral1};`,
                },
                E.text(
                  `${LOCALIZED_TEXT.seasonTotalDraftEpisodes[0]}${draftEpisodes.length}${LOCALIZED_TEXT.seasonTotalDraftEpisodes[1]}`,
                ),
              ),
              E.divRef(
                this.createDraftEpisodeButton,
                {
                  class: "season-details-create-draft-episode",
                  style: `cursor: pointer; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: .5rem; padding: 1rem; border-bottom: .1rem solid ${SCHEME.neutral1};`,
                },
                E.div(
                  {
                    class: "season-details-create-draft-episode-icon",
                    style: `width: ${ICON_L}rem; height: ${ICON_L}rem;`,
                  },
                  createPlusIcon(SCHEME.neutral1),
                ),
                E.div(
                  {
                    class: "season-details-create-draft-episode-label",
                    style: `font-size: ${FONT_L}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonCreateDraftEpisodeLabel),
                ),
              ),
              ...draftEpisodes.map((episode) => this.eDraftEpisode(episode)),
              ...(seasonDetails.totalPublishedEpisodes === 0
                ? []
                : [
                    E.div(
                      {
                        class: "season-details-published-episodes-total",
                        style: `margin-top: 2rem; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; width: 100%; box-sizing: border-box; padding: 1rem; text-align: center; border-bottom: .1rem solid ${SCHEME.neutral1};`,
                      },
                      E.text(
                        `${LOCALIZED_TEXT.seasonTotalPublishedEpisodes[0]}${seasonDetails.totalPublishedEpisodes}${LOCALIZED_TEXT.seasonTotalPublishedEpisodes[1]}`,
                      ),
                    ),
                    E.divRef(
                      this.listPublishedEpisodesStartFrom,
                      {
                        class: "season-details-published-episodes-start-from",
                        style: `display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: .5rem; padding: 1rem; border-bottom: .1rem solid ${SCHEME.neutral1};`,
                      },
                      E.div(
                        {
                          class:
                            "season-details-published-episodes-start-from-label",
                          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                        },
                        E.text(
                          LOCALIZED_TEXT.seasonPublishedEpisodesStartFromLabel,
                        ),
                      ),
                      E.inputRef(this.listPublishedEpisodeIndexCursorInput, {
                        class:
                          "season-details-published-episodes-start-from-input",
                        style: `${BASIC_INPUT_STYLE} width: 5rem; text-align: center;`,
                      }),
                    ),
                    assign(
                      this.scrollLoadingSection,
                      new ScrollLoadingSection(
                        LOCALIZED_TEXT.seasonAllPublishedEpisodesLoaded,
                      ),
                    ).body,
                  ]),
            ]),
      ),
    );

    if (seasonDetails.state !== SeasonState.ARCHIVED) {
      this.coverImageButton.val.addEventListener("click", () =>
        this.emit("editCoverImage"),
      );
      this.seasonInfoButton.val.addEventListener("click", () =>
        this.emit("editSeasonInfo"),
      );
      this.seasonPricingButton.val.addEventListener("click", () =>
        this.emit("editSeasonPricing"),
      );
      this.createDraftEpisodeButton.val.addEventListener("click", () =>
        this.emit("createDraftEpisode"),
      );
      if (seasonDetails.totalPublishedEpisodes > 0) {
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
    }
    this.emit("loaded");
  }

  private getPricingFooterText(state: SeasonState): string {
    switch (state) {
      case SeasonState.PUBLISHED:
        return `${LOCALIZED_TEXT.seasonPublishedPricingFooter[0]}${MIN_GRADE_EFFECTIVE_GAP_DAY}${LOCALIZED_TEXT.seasonPublishedPricingFooter[1]}`;
      case SeasonState.ARCHIVED:
        return LOCALIZED_TEXT.seasonArchivedPricingFooter;
      case SeasonState.DRAFT:
        return LOCALIZED_TEXT.seasonDraftPricingFooter;
    }
  }

  private getStateText(state: SeasonState): string {
    switch (state) {
      case SeasonState.PUBLISHED:
        return LOCALIZED_TEXT.seasonStatePublishedLabel;
      case SeasonState.ARCHIVED:
        return LOCALIZED_TEXT.seasonStateArchivedLabel;
      case SeasonState.DRAFT:
        return LOCALIZED_TEXT.seasonStateDraftLabel;
    }
  }

  private getStateFooterText(state: SeasonState): string {
    switch (state) {
      case SeasonState.PUBLISHED:
        return LOCALIZED_TEXT.seasonStatePublishedFooter;
      case SeasonState.ARCHIVED:
        return LOCALIZED_TEXT.seasonStateArchivedFooter;
      case SeasonState.DRAFT:
        return LOCALIZED_TEXT.seasonStateDraftFooter;
    }
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
      this.emit("editDraftEpisode", episode.episodeId),
    );
    return body;
  }

  private async loadPublishedEpisodes(): Promise<boolean> {
    let response = await this.serviceClient.send(
      newListPublishedEpisodesRequest({
        seasonId: this.seasonId,
        indexCursor: this.listPublishedEpisodeIndexCursor,
        next: true,
        limit: InfoPage.LIST_PUBLISHED_EPISODES_LIMIT,
      }),
    );
    this.scrollLoadingSection.val.body.before(
      ...response.episodes.map((episode) => this.ePublishedEpisode(episode)),
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

  private ePublishedEpisode(episode: EpisodeSummary): HTMLDivElement {
    let body = E.div(
      {
        class: "season-details-published-episode",
        style: `cursor: pointer; display: flex; flex-flow: row nowrap; gap: 1rem; align-items: center; padding: 1rem; border-bottom: .1rem solid ${SCHEME.neutral1};`,
      },
      E.div(
        {
          class: "season-details-published-episode-index",
          style: `font-size: ${FONT_L}rem; color: ${SCHEME.neutral0};`,
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
            class: "season-details-published-episode-version",
            style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${LOCALIZED_TEXT.seasonEpisodeVersion}${episode.videoContainer.version}`,
          ),
        ),
      ),
    );
    body.addEventListener("click", () =>
      this.emit("editPublishedEpisode", episode.episodeId),
    );
    this.publishedEpisodeElements.push(body);
    return body;
  }

  public remove(): void {
    this.body.remove();
  }
}
