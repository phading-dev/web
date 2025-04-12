import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import { createPlayIcon, createStarIcon } from "../../../common/icons";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { FONT_S, ICON_XS, LINE_HEIGHT_M } from "../../../common/sizes";
import { formatSecondsAsHHMMSS } from "../../../common/timestamp_formatter";
import { EpisodeSummary } from "@phading/product_service_interface/show/web/consumer/episode_summary";
import { SeasonSummary } from "@phading/product_service_interface/show/web/consumer/season_summary";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface SeasonItem {
  on(event: "details", listener: (seasonId: string) => void): this;
  on(
    event: "play",
    listener: (seasonId: string, episodeId: string) => void,
  ): this;
}

// Assumes price is per hour as in 3600 seconds.
export class SeasonItem extends EventEmitter {
  public body: HTMLDivElement;
  public seasonInfo = new Ref<HTMLDivElement>();
  public episodeInfo = new Ref<HTMLDivElement>();

  public constructor(
    season: SeasonSummary,
    continueEpisode: EpisodeSummary,
    ratingFormatter: Intl.NumberFormat,
    ratersCountFormatter: Intl.NumberFormat,
    showPriceAmount: number,
    dollarToCents: number,
    currencyFormatter: Intl.NumberFormat,
  ) {
    super();
    console.log();
    this.body = E.div(
      {
        class: "season-item",
        style: `width: 100%; cursor: pointer; box-sizing: border-box; border-left: .1rem solid ${SCHEME.neutral1}; border-right: .1rem solid ${SCHEME.neutral1}; border-top: .1rem solid ${SCHEME.neutral1};`,
      },
      E.divRef(
        this.seasonInfo,
        {
          class: "season-item-info",
          style: `width: 100%;`,
        },
        E.image({
          class: "season-item-cover-image",
          style: `width: 100%;  aspect-ratio: 2/3; object-fit: contain;`,
          src: season.coverImageUrl,
          alt: season.name,
        }),
        E.div(
          {
            class: "season-item-info-line",
            style: `width: 100%; padding: 1rem; box-sizing: border-box; display: flex; flex-flow: row nowrap; align-items: center;`,
          },
          E.div(
            {
              class: "season-item-rating-icon",
              style: `width: ${ICON_XS}rem; box-sizing: border-box; padding: .2rem;`,
            },
            createStarIcon(SCHEME.star),
          ),
          E.div({
            style: `flex: 0 0 .5rem;`,
          }),
          E.div(
            {
              class: "season-item-rating",
              style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(`${ratingFormatter.format(season.averageRating)}`),
          ),
          E.div({
            style: `flex: 0 0 .5rem;`,
          }),
          E.div(
            {
              class: "season-item-raters-count",
              style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(`(${ratersCountFormatter.format(10)})`),
          ),
          E.div({
            style: `flex: 1 0 0;`,
          }),
          E.div(
            {
              class: "season-item-price",
              style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              `${LOCALIZED_TEXT.pricingRateShortened[0]}${currencyFormatter.format((showPriceAmount * season.grade) / dollarToCents)}${LOCALIZED_TEXT.pricingRateShortened[1]}`,
            ),
          ),
        ),
      ),
      E.divRef(
        this.episodeInfo,
        {
          class: "season-item-epsiode-info",
          style: `width: 100%; box-sizing: border-box; padding: 1rem; border-top: .1rem solid ${SCHEME.neutral1}; display: flex; flex-flow: column nowrap; gap: 1rem;`,
        },
        E.div(
          {
            class: "season-item-episode-name",
            style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0}; line-height: ${LINE_HEIGHT_M}rem; height: ${LINE_HEIGHT_M * 2}rem; overflow: hidden;`,
          },
          E.text(`${continueEpisode.index} ${continueEpisode.name}`),
        ),
        E.div(
          {
            class: "season-item-info-line",
            style: `display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: center;`,
          },
          E.div(
            {
              class: "season-item-play-icon",
              style: `width: ${ICON_XS}rem;`,
            },
            createPlayIcon(SCHEME.neutral1),
          ),
          E.div(
            {
              class: "season-item-episode-length",
              style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(
              `${formatSecondsAsHHMMSS(
                Math.round(continueEpisode.continueTimeMs / 1000),
              )} / ${formatSecondsAsHHMMSS(continueEpisode.videoDurationSec)}`,
            ),
          ),
        ),
      ),
      E.div(
        {
          class: "season-item-episode-time-bar",
          style: `width: 100%; height: .2rem; background-color: ${SCHEME.neutral1};`,
        },
        E.div({
          class: "season-item-episode-watched-progress",
          style: `width: ${Math.round(
            (continueEpisode.continueTimeMs /
              1000 /
              continueEpisode.videoDurationSec) *
              100,
          )}%; height: 100%; background-color: ${SCHEME.progress};`,
        }),
      ),
    );

    this.seasonInfo.val.addEventListener("click", () =>
      this.emit("details", season.seasonId),
    );
    this.episodeInfo.val.addEventListener("click", () =>
      this.emit("play", season.seasonId, continueEpisode.episodeId),
    );
  }
}
