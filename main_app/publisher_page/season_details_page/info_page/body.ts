import EventEmitter = require("events");
import { IconButton, createBackButton } from "../../../../common/button";
import { SCHEME } from "../../../../common/color_scheme";
import {
  formatLastChangeTimeLong,
  formatNegativeTimezoneOffset,
} from "../../../../common/formatter/date";
import {
  formatShowCreditPrice,
  formatShowPrice,
} from "../../../../common/formatter/price";
import { createPlusIcon } from "../../../../common/icons";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { ePageWithTopDownCard } from "../../../../common/page_elements";
import { eCoverImage } from "../../../../common/season_cover_image";
import {
  FONT_M,
  FONT_S,
  FONT_WEIGHT_600,
  GAP_0_25X,
  GAP_0_5X,
  GAP_1X,
  ICON_BUTTON_L,
  ICON_M,
  LINE_HEIGHT_M,
  LINE_HEIGHT_S,
  PAGE_MAX_WIDTH_L,
} from "../../../../common/sizes";
import {
  eBox,
  eColumnBoxWithArrow,
  eLabelAndText,
} from "../../../../common/value_box";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { ENV_VARS } from "../../../../env_vars";
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
  on(event: "publishSeason", listener: (season: SeasonDetails) => void): this;
  on(event: "deleteSeason", listener: (season: SeasonDetails) => void): this;
  on(event: "archiveSeason", listener: (season: SeasonDetails) => void): this;
  on(event: "createDraftEpisode", listener: () => void): this;
  on(
    event: "viewDraftEpisodes",
    listener: (season: SeasonDetails) => void,
  ): this;
  on(
    event: "viewPublishedEpisodes",
    listener: (season: SeasonDetails) => void,
  ): this;
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
  public backButton = new Ref<IconButton>();
  public coverImageButton = new Ref<HTMLDivElement>();
  public seasonInfoButton = new Ref<HTMLDivElement>();
  public seasonPricingButton = new Ref<HTMLDivElement>();
  public createDraftEpisodeButton = new Ref<HTMLDivElement>();
  public draftEpisodesListButton = new Ref<HTMLDivElement>();
  public publishedEpisodesListButton = new Ref<HTMLDivElement>();
  public seasonStateButton = new Ref<HTMLDivElement>();
  public dangerZoneButton = new Ref<HTMLDivElement>();
  private season: SeasonDetails;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    public seasonId: string,
  ) {
    super();
    this.body = ePageWithTopDownCard(
      this.card,
      `max-width: ${PAGE_MAX_WIDTH_L}rem; padding: ${ICON_BUTTON_L + GAP_0_5X}rem ${GAP_1X}rem ${PAGE_NAVIGATION_PADDING_BOTTOM}rem ${GAP_1X}rem; display: flex; flex-flow: column nowrap;`,
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
                  customStyle: `margin-bottom: ${GAP_1X}rem; align-self: center; width: 100%; max-width: 30rem; box-sizing: border-box;`,
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
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      assign(
        this.seasonPricingButton,
        eColumnBoxWithArrow(
          [
            E.div(
              {
                class: "season-details-current-rate-line",
              },
              E.div(
                {
                  class: "season-details-current-rate",
                  style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
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
                  style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
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
            ...(!seasonDetails.nextGrade
              ? []
              : [
                  E.div(
                    {
                      class: "season-details-new-rate-line",
                    },
                    E.div(
                      {
                        class: "season-details-new-rate",
                        style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
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
                        style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
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
                    E.div(
                      {
                        class: "season-details-new-rate-effective-date-label",
                        style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
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
                  ),
                ]),
          ],
          {
            clickable:
              seasonDetails.state === SeasonState.ARCHIVED ? false : true,
            linesGap: GAP_0_5X,
          },
        ),
      ),
      ...(seasonDetails.state === SeasonState.ARCHIVED
        ? []
        : [
            E.div({
              style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
            }),
            assign(
              this.createDraftEpisodeButton,
              eBox(
                [
                  E.div(
                    {
                      class: "episode-details-upload-button-icon",
                      style: `width: ${ICON_M}rem; height: ${ICON_M}rem;`,
                    },
                    createPlusIcon(SCHEME.neutral1),
                  ),
                  E.div(
                    {
                      class: "episode-details-upload-button-text",
                      style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
                    },
                    E.text(LOCALIZED_TEXT.seasonCreateDraftEpisodeLabel),
                  ),
                ],
                {
                  customStyle: `display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; gap: ${GAP_0_5X}rem;`,
                },
              ),
            ),
            E.div({
              style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
            }),
            assign(
              this.draftEpisodesListButton,
              eColumnBoxWithArrow([
                E.div(
                  {
                    class: "season-details-draft-episodes",
                    style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
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
              ]),
            ),
            E.div({
              style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
            }),
            assign(
              this.publishedEpisodesListButton,
              eColumnBoxWithArrow([
                E.div(
                  {
                    class: "season-details-published-episodes",
                    style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(
                    `${seasonDetails.state === SeasonState.DRAFT ? LOCALIZED_TEXT.seasonTotalReadyEpisodes[0] : LOCALIZED_TEXT.seasonTotalPublishedEpisodes[0]}`,
                  ),
                  E.div(
                    {
                      style: `display: inline; font-weight: ${FONT_WEIGHT_600};`,
                    },
                    E.text(`${seasonDetails.totalPublishedEpisodes}`),
                  ),
                  E.text(
                    `${seasonDetails.state === SeasonState.DRAFT ? LOCALIZED_TEXT.seasonTotalReadyEpisodes[1] : LOCALIZED_TEXT.seasonTotalPublishedEpisodes[1]}`,
                  ),
                ),
              ]),
            ),
          ]),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      assign(
        this.seasonStateButton,
        eColumnBoxWithArrow(
          [
            E.div(
              {
                class: "season-details-state",
                style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
              },
              E.text(LOCALIZED_TEXT.seasonStateTitleLabel),
            ),
            E.div(
              {
                class: "season-details-state-value",
                style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${seasonDetails.state === SeasonState.DRAFT ? SCHEME.fair0 : seasonDetails.state === SeasonState.PUBLISHED ? SCHEME.great0 : SCHEME.bad0}`,
              },
              E.text(this.getStateText(seasonDetails.state)),
            ),
            E.div(
              {
                class: "season-details-state-description",
                style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
              },
              E.text(this.getStateFooterText(seasonDetails)),
            ),
          ],
          {
            clickable:
              seasonDetails.state === SeasonState.DRAFT &&
              seasonDetails.totalPublishedEpisodes > 0
                ? true
                : false,
            linesGap: GAP_0_25X,
          },
        ),
      ),
      ...(seasonDetails.state === SeasonState.ARCHIVED
        ? []
        : [
            E.div({
              style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
            }),
            assign(
              this.dangerZoneButton,
              eColumnBoxWithArrow([
                E.div(
                  {
                    class: "season-details-danger-zone",
                    style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.bad0};`,
                  },
                  E.text(LOCALIZED_TEXT.seasonDangerZone),
                ),
              ]),
            ),
          ]),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      E.div(
        {
          class: "season-details-last-change-time",
          style: `align-self: flex-end; font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
        },
        E.text(
          `${LOCALIZED_TEXT.seasonLastChangeTime}${formatLastChangeTimeLong(seasonDetails.lastChangeTimeMs)}`,
        ),
      ),
      E.div(
        {
          class: "season-details-created-time",
          style: `align-self: flex-end; font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
        },
        E.text(
          `${LOCALIZED_TEXT.seasonCreatedTime}${formatLastChangeTimeLong(seasonDetails.createdTimeMs)}`,
        ),
      ),
    );
    this.backButton.val.addAction(() => this.emit("back"));

    this.coverImageButton.val?.addEventListener("click", () =>
      this.emit("editCoverImage", this.season),
    );
    this.seasonInfoButton.val?.addEventListener("click", () =>
      this.emit("editSeasonInfo", this.season),
    );
    this.seasonPricingButton.val?.addEventListener("click", () =>
      this.emit(
        seasonDetails.state === SeasonState.DRAFT
          ? "editSeasonDraftPricing"
          : "editSeasonPublishedPricing",
        this.season,
      ),
    );
    this.createDraftEpisodeButton.val?.addEventListener("click", () =>
      this.emit("createDraftEpisode"),
    );
    this.draftEpisodesListButton.val?.addEventListener("click", () =>
      this.emit("viewDraftEpisodes", this.season),
    );
    this.publishedEpisodesListButton.val?.addEventListener("click", () =>
      this.emit("viewPublishedEpisodes", this.season),
    );
    this.seasonStateButton.val?.addEventListener("click", () =>
      // Only DRAFT state can be changed for now.
      this.emit("publishSeason", this.season),
    );
    this.dangerZoneButton.val?.addEventListener("click", () =>
      this.emit(
        seasonDetails.state === SeasonState.DRAFT
          ? "deleteSeason"
          : "archiveSeason",
        this.season,
      ),
    );
    this.emit("loaded");
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

  private getStateFooterText(season: SeasonDetails): string {
    switch (season.state) {
      case SeasonState.PUBLISHED:
        return LOCALIZED_TEXT.seasonStatePublishedFooter;
      case SeasonState.ARCHIVED:
        return LOCALIZED_TEXT.seasonStateArchivedFooter;
      case SeasonState.DRAFT:
        if (season.totalPublishedEpisodes === 0) {
          return LOCALIZED_TEXT.seasonStateDraftNotReadyFooter;
        } else {
          return LOCALIZED_TEXT.seasonStateDraftReadyFooter;
        }
      case SeasonState.TAKEN_DOWN:
        return `${LOCALIZED_TEXT.seasonStateTakenDownFooter}${season.takenDownReason}`;
    }
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
