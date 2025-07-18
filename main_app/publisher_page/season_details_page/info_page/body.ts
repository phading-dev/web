import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import {
  formatLastChangeTimeLong,
  formatNegativeTimezoneOffset,
} from "../../../../common/formatter/date";
import {
  formatShowCreditPrice,
  formatShowPrice,
} from "../../../../common/formatter/price";
import {
  SimpleIconButton,
  createBackButton,
} from "../../../../common/icon_button";
import { createPlusIcon } from "../../../../common/icons";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import {
  PAGE_MAX_WIDTH_L,
  ePageWithTopDownCard,
} from "../../../../common/page_elements";
import { eCoverImage } from "../../../../common/season_cover_image";
import {
  FONT_M,
  FONT_S,
  FONT_WEIGHT_600,
  ICON_BUTTON_L,
  ICON_L,
} from "../../../../common/sizes";
import {
  eBox,
  eColumnBoxWithArrow,
  eLabelAndText,
} from "../../../../common/value_box";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { ENV_VARS } from "../../../../env_vars";
import { MIN_GRADE_EFFECTIVE_GAP_DAY } from "@phading/constants/show";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import {
  newGetSeasonRequest,
  newListDraftEpisodesRequest,
} from "@phading/product_service_interface/show/web/publisher/client";
import { SeasonDetails } from "@phading/product_service_interface/show/web/publisher/details";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { TzDate } from "@selfage/tz_date";
import { WebServiceClient } from "@selfage/web_service_client";

export interface InfoPage {
  on(event: "back", listener: () => void): this;
  on(event: "editCoverImage", listener: (season: SeasonDetails) => void): this;
  on(event: "editSeasonInfo", listener: (season: SeasonDetails) => void): this;
  on(
    event: "editSeasonDraftPricing",
    listener: (season: SeasonDetails) => void,
  ): this;
  on(
    event: "editSeasonPublishedPricing",
    listener: (season: SeasonDetails) => void,
  ): this;
  on(event: "deleteSeason", listener: (season: SeasonDetails) => void): this;
  on(event: "archiveSeason", listener: (season: SeasonDetails) => void): this;
  on(event: "createDraftEpisode", listener: () => void): this;
  on(event: "viewEpisodes", listener: (season: SeasonDetails) => void): this;
  on(event: "loaded", listener: () => void): this;
}

// Assumption:
//  - Archived seasons don't have cover images and don't have any draft/published episodes. All information is not editable.
export class InfoPage extends EventEmitter {
  public static create(seasonId: string): InfoPage {
    return new InfoPage(SERVICE_CLIENT, () => new Date(), seasonId);
  }

  public body: HTMLDivElement;
  private card = new Ref<HTMLDivElement>();
  public backButton = new Ref<SimpleIconButton>();
  public coverImageButton = new Ref<HTMLDivElement>();
  public seasonInfoButton = new Ref<HTMLDivElement>();
  public seasonPricingButton = new Ref<HTMLDivElement>();
  public createDraftEpisodeButton = new Ref<HTMLDivElement>();
  public episodesListButton = new Ref<HTMLDivElement>();
  public seasonStateButton = new Ref<HTMLDivElement>();
  private season: SeasonDetails;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    public seasonId: string,
  ) {
    super();
    this.body = ePageWithTopDownCard(
      this.card,
      `max-width: ${PAGE_MAX_WIDTH_L}rem; padding: ${ICON_BUTTON_L + 1}rem 2rem ${PAGE_NAVIGATION_PADDING_BOTTOM}rem 2rem; display: flex; flex-flow: column nowrap;`,
    );
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
    this.season = seasonDetails;
    let nowDate = this.getNowDate();
    this.card.val.append(
      assign(this.backButton, createBackButton()).body,
      ...(seasonDetails.state === SeasonState.ARCHIVED
        ? []
        : [
            assign(
              this.coverImageButton,
              eColumnBoxWithArrow(
                [eCoverImage(`100%`, seasonDetails.coverImageUrl)],
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
                class: "season-details-current-rate-line",
                style: `display: flex; flex-flow: row wrap; column-gap: 2rem; row-gap: 1rem;`,
              },
              E.div(
                {
                  class: "season-details-current-rate",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.seasonCurrentRateLabel),
                E.div(
                  {
                    style: `display: inline; font-weight: ${FONT_WEIGHT_600};`,
                  },
                  E.text(formatShowPrice(seasonDetails.grade, nowDate)),
                ),
              ),
              E.div(
                {
                  class: "season-details-current-net-rate",
                  style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                },
                E.text(LOCALIZED_TEXT.seasonNetRateLabel),
                E.div(
                  {
                    style: `display: inline; font-weight: ${FONT_WEIGHT_600};`,
                  },
                  E.text(formatShowCreditPrice(seasonDetails.grade, nowDate)),
                ),
              ),
            ),
            ...(seasonDetails.nextGrade
              ? [
                  E.div(
                    {
                      class: "season-details-new-rate-line",
                      style: `display: flex; flex-flow: row wrap; column-gap: 2rem; row-gap: 1rem;`,
                    },
                    E.div(
                      {
                        class: "season-details-new-rate",
                        style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                      },
                      E.text(LOCALIZED_TEXT.seasonNewRateLabel),
                      E.div(
                        {
                          style: `display: inline; font-weight: ${FONT_WEIGHT_600};`,
                        },
                        E.text(
                          formatShowPrice(
                            seasonDetails.nextGrade.grade,
                            nowDate,
                          ),
                        ),
                      ),
                    ),
                    E.div(
                      {
                        class: "season-details-new-net-rate-label",
                        style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                      },
                      E.text(LOCALIZED_TEXT.seasonNewNetRateLabel),
                      E.div(
                        {
                          style: `display: inline; font-weight: ${FONT_WEIGHT_600};`,
                        },
                        E.text(
                          formatShowCreditPrice(
                            seasonDetails.nextGrade.grade,
                            nowDate,
                          ),
                        ),
                      ),
                    ),
                  ),
                  E.div(
                    {
                      class: "season-details-new-rate-effective-date-label",
                      style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                    },
                    E.text(LOCALIZED_TEXT.seasonNewRateEffectiveDateLabel),
                    E.div(
                      {
                        style: `display: inline; font-weight: ${FONT_WEIGHT_600};`,
                      },
                      E.text(
                        TzDate.fromLocalDateString(
                          seasonDetails.nextGrade.effectiveDate,
                          ENV_VARS.timezoneNegativeOffset,
                        ).toLocalDateISOString(),
                      ),
                    ),
                    E.text(
                      ` (${formatNegativeTimezoneOffset(ENV_VARS.timezoneNegativeOffset)})`,
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
      ...(seasonDetails.state === SeasonState.ARCHIVED
        ? []
        : [
            E.div({
              style: `flex: 0 0 auto; height: 2rem;`,
            }),
            assign(
              this.createDraftEpisodeButton,
              eBox(
                [
                  E.div(
                    {
                      class: "episode-details-upload-button-icon",
                      style: `width: ${ICON_L}rem; height: ${ICON_L}rem;`,
                    },
                    createPlusIcon(SCHEME.neutral1),
                  ),
                  E.div(
                    {
                      class: "episode-details-upload-button-text",
                      style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                    },
                    E.text(LOCALIZED_TEXT.seasonCreateDraftEpisodeLabel),
                  ),
                ],
                {
                  customeStyle: `display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: 1rem;`,
                },
              ),
            ),
            E.div({
              style: `flex: 0 0 auto; height: 2rem;`,
            }),
            assign(
              this.episodesListButton,
              eColumnBoxWithArrow(
                [
                  E.div(
                    {
                      class: "season-details-draft-episodes",
                      style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                    },
                    E.text(`${LOCALIZED_TEXT.seasonTotalDraftEpisodes[0]}`),
                    E.div(
                      {
                        style: `display: inline; font-weight: ${FONT_WEIGHT_600};`,
                      },
                      E.text(`${draftEpisodes.length}`),
                    ),
                    E.text(`${LOCALIZED_TEXT.seasonTotalDraftEpisodes[1]}`),
                  ),
                  E.div(
                    {
                      class: "season-details-published-episodes",
                      style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                    },
                    E.text(`${LOCALIZED_TEXT.seasonTotalPublishedEpisodes[0]}`),
                    E.div(
                      {
                        style: `display: inline; font-weight: ${FONT_WEIGHT_600};`,
                      },
                      E.text(`${seasonDetails.totalPublishedEpisodes}`),
                    ),
                    E.text(`${LOCALIZED_TEXT.seasonTotalPublishedEpisodes[1]}`),
                  ),
                ],
                {
                  linesGap: 1,
                },
              ),
            ),
          ]),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      assign(
        this.seasonStateButton,
        eColumnBoxWithArrow(
          [
            E.div(
              {
                class: "season-details-state",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(LOCALIZED_TEXT.seasonStateLabel),
              E.div(
                {
                  style: `display: inline; font-weight: ${FONT_WEIGHT_600};`,
                },
                E.text(this.getStateText(seasonDetails.state)),
              ),
            ),
            E.div(
              {
                class: "season-details-state-description",
                style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(
                this.getStateFooterText(
                  seasonDetails.state,
                  seasonDetails.takenDownReason,
                ),
              ),
            ),
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
    );
    this.backButton.val.on("action", () => this.emit("back"));

    if (seasonDetails.state !== SeasonState.ARCHIVED) {
      this.coverImageButton.val.addEventListener("click", () =>
        this.emit("editCoverImage", this.season),
      );
      this.seasonInfoButton.val.addEventListener("click", () =>
        this.emit("editSeasonInfo", this.season),
      );
      this.seasonPricingButton.val.addEventListener("click", () =>
        this.emit(
          seasonDetails.state === SeasonState.DRAFT
            ? "editSeasonDraftPricing"
            : "editSeasonPublishedPricing",
          this.season,
        ),
      );
      this.createDraftEpisodeButton.val.addEventListener("click", () =>
        this.emit("createDraftEpisode"),
      );
      this.episodesListButton.val.addEventListener("click", () =>
        this.emit("viewEpisodes", this.season),
      );
      this.seasonStateButton.val.addEventListener("click", () =>
        this.emit(
          seasonDetails.state === SeasonState.DRAFT
            ? "deleteSeason"
            : "archiveSeason",
          this.season,
        ),
      );
    }
    this.emit("loaded");
  }

  private getPricingFooterText(state: SeasonState): string {
    switch (state) {
      case SeasonState.PUBLISHED:
      case SeasonState.TAKEN_DOWN:
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
      case SeasonState.TAKEN_DOWN:
        return LOCALIZED_TEXT.seasonStateTakenDownLabel;
    }
  }

  private getStateFooterText(
    state: SeasonState,
    takenDownReason?: string,
  ): string {
    switch (state) {
      case SeasonState.PUBLISHED:
        return LOCALIZED_TEXT.seasonStatePublishedFooter;
      case SeasonState.ARCHIVED:
        return LOCALIZED_TEXT.seasonStateArchivedFooter;
      case SeasonState.DRAFT:
        return LOCALIZED_TEXT.seasonStateDraftFooter;
      case SeasonState.TAKEN_DOWN:
        return `${LOCALIZED_TEXT.seasonStateTakenDownFooter}${takenDownReason}`;
    }
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
