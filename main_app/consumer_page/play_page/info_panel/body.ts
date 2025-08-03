import { IconButton } from "../../../../common/button";
import { SCHEME } from "../../../../common/color_scheme";
import {
  formatPremieredTime,
  formatUpcomingPremiereTime,
} from "../../../../common/formatter/date";
import {
  calculateEstimatedShowMoneyAndFormat,
  formatShowPrice,
} from "../../../../common/formatter/price";
import { formatSecondsAsHHMMSS } from "../../../../common/formatter/timestamp";
import {
  createCircularProgressIcon,
  createClockIcon,
  createPlayIcon,
  createQuestionMarkIcon,
} from "../../../../common/icons";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { eCoverImage } from "../../../../common/season_cover_image";
import {
  BORDER_RADIUS_S,
  BORDER_WIDTH_2,
  FONT_M,
  FONT_S,
  FONT_WEIGHT_600,
  GAP_1X,
  GAP_d_5X,
  ICON_BUTTON_M,
  ICON_L,
  ICON_M,
  LINE_HEIGHT_M,
  LINE_HEIGHT_S,
} from "../../../../common/sizes";
import {
  Episode,
  SeasonSummary,
} from "@phading/product_service_interface/show/web/public/info";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { EventEmitter } from "events";

export interface InfoPanel {
  on(event: "viewDetails", listener: () => void): this;
  on(event: "play", listener: (episodeId: string) => void): this;
}

export class InfoPanel extends EventEmitter {
  public static create(
    customeStyle: string,
    episode: Episode,
    seasonSummary: SeasonSummary,
    nextEpisode?: Episode,
    nextEpisodeWatchedTimeMs?: number,
  ): InfoPanel {
    return new InfoPanel(
      () => new Date(),
      customeStyle,
      episode,
      seasonSummary,
      nextEpisode,
      nextEpisodeWatchedTimeMs,
    );
  }

  public body: HTMLElement;
  private metering = new Ref<Text>();
  public meteringQuestionMark = new Ref<IconButton>();
  private meteringExplained = new Ref<HTMLDivElement>();
  public seasonInfoButton = new Ref<HTMLDivElement>();
  public nextEpisodeButton = new Ref<HTMLDivElement>();
  private nowDate: Date;

  public constructor(
    getNowDate: () => Date,
    customeStyle: string,
    episode: Episode,
    private seasonSummary: SeasonSummary,
    private nextEpisode?: Episode,
    private nextEpisodeWatchedTimeMs?: number,
  ) {
    super();
    this.nowDate = getNowDate();
    this.body = E.div(
      {
        class: "info-panel",
        style: `flex-flow: column nowrap; ${customeStyle}`,
      },
      E.div(
        {
          class: "info-panel-episode-name",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
        },
        E.text(episode.name),
      ),
      E.div(
        {
          class: "info-panel-episode-premiere-time",
          style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
        },
        E.text(
          `${LOCALIZED_TEXT.episodePremieredOn}${formatPremieredTime(episode.premiereTimeMs)}`,
        ),
      ),
      E.div(
        {
          class: "info-panel-episode-metering-line",
          style: `display: flex; flex-flow: row nowrap; align-items: center;`,
        },
        E.div(
          {
            class: "info-panel-episode-metering",
            style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(`${LOCALIZED_TEXT.currentMetering}`),
          E.textRef(this.metering, ""),
        ),
        assign(
          this.meteringQuestionMark,
          new IconButton(
            ICON_BUTTON_M,
            ICON_L,
            createQuestionMarkIcon("currentColor"),
          ),
        ).body,
      ),
      E.divRef(
        this.meteringExplained,
        {
          class: "info-panel-episode-metering-explained",
          style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1}; display: none; transition: height .2s; overflow: hidden;`,
        },
        E.text(`${LOCALIZED_TEXT.currentMeteringExplained}`),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_d_5X}rem;`,
      }),
      E.divRef(
        this.seasonInfoButton,
        {
          class: "info-panel-season-info-row",
          style: `cursor: pointer; display: flex; flex-flow: row nowrap; gap: ${GAP_d_5X}rem;`,
        },
        E.div(
          {
            class: "info-panel-cover-image-container",
            style: `flex: 1 0 0; max-width: 6rem;`,
          },
          eCoverImage("100%", this.seasonSummary.coverImageUrl),
        ),
        E.div(
          {
            class: "info-panel-season-info-column",
            style: `flex: 3 0 0; display: flex; flex-flow: column nowrap;`,
          },
          E.div(
            {
              class: "info-panel-season-name",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
            },
            E.text(this.seasonSummary.name),
          ),
          E.div(
            {
              class: "info-panel-season-pricing",
              style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
            },
            E.text(
              `${LOCALIZED_TEXT.currentRate}${formatShowPrice(this.seasonSummary.grade, this.nowDate)}`,
            ),
          ),
        ),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      ...this.createNextEpisodeElements(),
    );
    this.show();
    this.updateMeterReading(0);

    this.meteringQuestionMark.val.addAction(
      () => this.showMeteringExplained(),
    );
    this.seasonInfoButton.val.addEventListener("click", () =>
      this.emit("viewDetails"),
    );
    if (this.nextEpisode && this.nextEpisode.canPlay) {
      this.nextEpisodeButton.val.addEventListener("click", () => {
        this.emit("play", this.nextEpisode.episodeId);
      });
    }
  }

  private createNextEpisodeElements(): Array<HTMLElement> {
    if (!this.nextEpisode) {
      return [];
    } else {
      let continueTimeMs = this.nextEpisodeWatchedTimeMs ?? 0;
      return [
        E.div(
          {
            class: "info-panel-next-episode",
            style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.nextEpisode),
        ),
        E.div({
          style: `flex: 0 0 auto; height: ${GAP_d_5X}rem;`,
        }),
        E.divRef(
          this.nextEpisodeButton,
          {
            class: "info-panel-next-episode",
            style: `cursor: ${this.nextEpisode.canPlay ? "pointer" : "default"}; border: ${BORDER_WIDTH_2}rem solid ${this.nextEpisode.canPlay ? SCHEME.primary1 : SCHEME.neutral2}; border-radius: ${BORDER_RADIUS_S}rem; display: flex; flex-flow: row nowrap; align-items: center; gap: ${GAP_d_5X}rem; padding: ${GAP_d_5X}rem;`,
          },
          E.div(
            {
              class: "info-panel-next-episode-icon",
              style: `flex: 0 0 auto; width: ${ICON_L}rem; height: ${ICON_L}rem;`,
            },
            this.nextEpisode.canPlay
              ? createPlayIcon(SCHEME.neutral1)
              : createClockIcon(SCHEME.neutral1),
          ),
          E.div(
            {
              class: "info-panel-next-episode-column",
              style: `flex: 1 0 0; display: flex; flex-flow: column nowrap;`,
            },
            E.div(
              {
                class: "info-panel-next-episode-name",
                style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(this.nextEpisode.name),
            ),
            this.nextEpisode.canPlay
              ? E.div(
                  {
                    class: "info-panel-next-episode-progress-line",
                    style: `display: flex; flex-flow: row nowrap; align-items: center;`,
                  },
                  E.div(
                    {
                      class: "info-panel-next-episode-progress-icon",
                      style: `width: ${ICON_M}rem; height: ${ICON_M}rem;`,
                    },
                    createCircularProgressIcon(
                      SCHEME.primary1,
                      SCHEME.neutral2,
                      continueTimeMs / 1000 / this.nextEpisode.videoDurationSec,
                    ),
                  ),
                  E.div({
                    style: `flex: 0 0 auto; width: ${GAP_d_5X}rem;`,
                  }),
                  E.div(
                    {
                      class: "info-panel-next-episode-continue-at",
                      style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral0};`,
                    },
                    E.text(
                      `${formatSecondsAsHHMMSS(continueTimeMs / 1000)} / ${formatSecondsAsHHMMSS(this.nextEpisode.videoDurationSec)} (${calculateEstimatedShowMoneyAndFormat(this.seasonSummary.grade, this.nextEpisode.videoDurationSec, this.nowDate)})`,
                    ),
                  ),
                )
              : E.div(
                  {
                    class: "season-details-episode-premiere-time",
                    style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral0};`,
                  },
                  E.text(
                    `${LOCALIZED_TEXT.episodePremieresAt}${formatUpcomingPremiereTime(this.nextEpisode.premiereTimeMs)}`,
                  ),
                ),
          ),
        ),
      ];
    }
  }

  // Don't update too frequently.
  public updateMeterReading(watchedTimeMs: number): void {
    this.metering.val.textContent = calculateEstimatedShowMoneyAndFormat(
      this.seasonSummary.grade,
      Math.round(watchedTimeMs / 1000),
      this.nowDate,
    );
  }

  private showMeteringExplained(): void {
    this.meteringExplained.val.style.display = "block";
    this.meteringExplained.val.style.height = "0";
    this.meteringExplained.val.style.height = `${this.meteringExplained.val.scrollHeight}px`;
    this.meteringExplained.val.addEventListener("transitionend", () => {
      this.meteringExplained.val.style.height = "auto";
    });
    this.meteringQuestionMark.val.clearAction();
  };

  public show(): void {
    this.body.style.display = "flex";
  }

  public hide(): void {
    this.body.style.display = "none";
  }
}
