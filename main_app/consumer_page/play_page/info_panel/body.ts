import { SCHEME } from "../../../../common/color_scheme";
import {
  formatPremieredTime,
  formatUpcomingPremiereTime,
} from "../../../../common/formatter/date";
import {
  calculateShowMoneyAndFormat,
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
import {
  FONT_M,
  FONT_S,
  FONT_WEIGHT_600,
  ICON_BUTTON_M,
  ICON_L,
  ICON_M,
} from "../../../../common/sizes";
import {
  Episode,
  SeasonSummary,
} from "@phading/product_service_interface/show/web/consumer/info";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { EventEmitter } from "events";

export interface InfoPanel {
  on(
    event: "play",
    listener: (seasonId: string, episodeId: string) => void,
  ): this;
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
  public meteringQuestionMark = new Ref<HTMLDivElement>();
  private meteringExplained = new Ref<HTMLDivElement>();
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
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};font-weight: ${FONT_WEIGHT_600};`,
        },
        E.text(episode.name),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      E.div(
        {
          class: "info-panel-episode-premiere-time",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral1};`,
        },
        E.text(
          `${LOCALIZED_TEXT.episodePremieredOn}${formatPremieredTime(episode.premiereTimeMs)}`,
        ),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      E.div(
        {
          class: "info-panel-episode-metering-line",
          style: `display: flex; flex-flow: row nowrap; align-items: center;`,
        },
        E.div(
          {
            class: "info-panel-episode-metering",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(`${LOCALIZED_TEXT.currentMetering}`),
          E.textRef(this.metering, ""),
        ),
        E.divRef(
          this.meteringQuestionMark,
          {
            class: "info-panel-episode-metering-question-mark",
            style: `cursor: pointer; width: ${ICON_BUTTON_M}rem; height: ${ICON_BUTTON_M}rem; box-sizing: border-box; padding: ${(ICON_BUTTON_M - ICON_L) / 2}rem;`,
          },
          createQuestionMarkIcon(SCHEME.neutral1),
        ),
      ),
      E.divRef(
        this.meteringExplained,
        {
          class: "info-panel-episode-metering-explained",
          style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0}; display: none; transition: height .2s; overflow: hidden;`,
        },
        E.text(`${LOCALIZED_TEXT.currentMeteringExplained}`),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      E.div(
        {
          class: "info-panel-season-info-row",
          style: `display: flex; flex-flow: row nowrap; gap: 1rem;`,
        },
        E.div(
          {
            class: "info-panel-cover-image-container",
            style: `flex: 1 0 0; max-width: 10rem;`,
          },
          E.image({
            class: "info-panel-cover-image",
            style: `width: 100%; aspect-ratio: 2/3; object-fit: contain;`,
            src: this.seasonSummary.coverImageUrl,
          }),
        ),
        E.div(
          {
            class: "info-panel-season-info-column",
            style: `flex: 3 0 0; display: flex; flex-flow: column nowrap;`,
          },
          E.div(
            {
              class: "info-panel-season-name",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
            },
            E.text(this.seasonSummary.name),
          ),
          E.div({
            style: `flex: 0 0 auto; height: 1rem;`,
          }),
          E.div(
            {
              class: "info-panel-season-pricing",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              `${LOCALIZED_TEXT.currentRate}${formatShowPrice(this.seasonSummary.grade, this.nowDate)}`,
            ),
          ),
          E.div({
            style: `flex: 0 0 auto; height: 1rem;`,
          }),
          E.div(
            {
              class: "info-panel-season-total-episodes",
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              `${LOCALIZED_TEXT.totalEpisodes[0]}${this.seasonSummary.totalEpisodes}${LOCALIZED_TEXT.totalEpisodes[1]}`,
            ),
          ),
        ),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      ...this.createNextEpisodeElements(),
    );
    this.show();
    this.updateMeterReading(0);

    this.meteringQuestionMark.val.addEventListener(
      "click",
      this.showMeteringExplained,
    );
    if (this.nextEpisodeButton.val) {
      this.nextEpisodeButton.val.addEventListener("click", () => {
        this.emit(
          "play",
          this.seasonSummary.seasonId,
          this.nextEpisode.episodeId,
        );
      });
    }
  }

  private createNextEpisodeElements(): Array<HTMLElement> {
    if (!this.nextEpisode) {
      return [
        E.div(
          {
            class: "info-panel-next-episode",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.noNextEpisode),
        ),
      ];
    } else {
      let hasPremiered =
        this.nextEpisode.premiereTimeMs <= this.nowDate.getTime();
      let continueTimeMs = this.nextEpisodeWatchedTimeMs ?? 0;
      return [
        E.div(
          {
            class: "info-panel-next-episode",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.nextEpisode),
        ),
        E.div({
          style: `flex: 0 0 auto; height: 1rem;`,
        }),
        E.divRef(
          this.nextEpisodeButton,
          {
            class: "info-panel-next-episode",
            style: `cursor: ${hasPremiered ? "pointer" : "default"}; border: .2rem solid ${hasPremiered ? SCHEME.primary1 : SCHEME.neutral2}; border-radius: .5rem; display: flex; flex-flow: row nowrap; align-items: center; gap: 1rem; padding: 1rem;`,
          },
          E.div(
            {
              class: "info-panel-next-episode-icon",
              style: `flex: 0 0 auto; width: ${ICON_L}rem; height: ${ICON_L}rem;`,
            },
            hasPremiered
              ? createPlayIcon(SCHEME.neutral1)
              : createClockIcon(SCHEME.neutral1),
          ),
          E.div(
            {
              class: "info-panel-next-episode-column",
              style: `flex: 1 0 0; display: flex; flex-flow: column nowrap; gap: 1rem;`,
            },
            E.div(
              {
                class: "info-panel-next-episode-name",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(this.nextEpisode.name),
            ),
            hasPremiered
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
                      SCHEME.progress,
                      SCHEME.neutral2,
                      continueTimeMs / 1000 / this.nextEpisode.videoDurationSec,
                    ),
                  ),
                  E.div({
                    style: `flex: 0 0 auto; width: 1rem;`,
                  }),
                  E.div(
                    {
                      class: "info-panel-next-episode-conintue-at",
                      style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
                    },
                    E.text(
                      `${formatSecondsAsHHMMSS(continueTimeMs / 1000)} / ${formatSecondsAsHHMMSS(this.nextEpisode.videoDurationSec)} (${calculateShowMoneyAndFormat(this.seasonSummary.grade, this.nextEpisode.videoDurationSec, this.nowDate)})`,
                    ),
                  ),
                )
              : E.div(
                  {
                    class: "season-details-episode-premiere-time",
                    style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
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
    this.metering.val.textContent = calculateShowMoneyAndFormat(
      this.seasonSummary.grade,
      Math.round(watchedTimeMs / 1000),
      this.nowDate,
    );
  }

  private showMeteringExplained = (): void => {
    this.meteringExplained.val.style.display = "block";
    this.meteringExplained.val.style.height = "0";
    this.meteringExplained.val.style.height = `${this.meteringExplained.val.scrollHeight}px`;
    this.meteringExplained.val.addEventListener("transitionend", () => {
      this.meteringExplained.val.style.height = "auto";
    });
    this.meteringQuestionMark.val.removeEventListener(
      "click",
      this.showMeteringExplained,
    );
  };

  public show(): void {
    this.body.style.display = "flex";
  }

  public hide(): void {
    this.body.style.display = "none";
  }
}
