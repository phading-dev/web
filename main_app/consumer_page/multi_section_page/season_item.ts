import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import { formatShowPriceShortened } from "../../../common/formatter/price";
import {
  RATINGS_COUNT_FORMATTER,
  RATING_FORMATTER,
} from "../../../common/formatter/rating";
import { createStarIcon } from "../../../common/icons";
import { FONT_M, ICON_M, LINE_HEIGHT_M } from "../../../common/sizes";
import { SeasonSummary } from "@phading/product_service_interface/show/web/consumer/summary";
import { E } from "@selfage/element/factory";

export interface SeasonItem {
  on(event: "showDetails", listener: (seasonId: string) => void): this;
}

// Assumes price is per hour as in 3600 seconds.
export class SeasonItem extends EventEmitter {
  public body: HTMLDivElement;

  public constructor(season: SeasonSummary, customStyle?: string) {
    super();
    console.log();
    this.body = E.div(
      {
        class: "season-item-info",
        style: `cursor: pointer; ${customStyle ?? ""}`,
      },
      E.image({
        class: "season-item-cover-image",
        style: `width: 100%;  aspect-ratio: 2/3; object-fit: contain;`,
        src: season.coverImageUrl,
        alt: season.name,
      }),
      E.div({
        style: `height: .5rem;`,
      }),
      E.div(
        {
          class: "season-item-name",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; line-height: ${LINE_HEIGHT_M}rem; max-height: ${LINE_HEIGHT_M * 3}rem; overflow: hidden;`,
        },
        E.text(season.name),
      ),
      E.div({
        style: `height: .5rem;`,
      }),
      E.div(
        {
          class: "season-item-info-line",
          style: `width: 100%; display: flex; flex-flow: row wrap; align-items: center;`,
        },
        E.div(
          {
            class: "season-item-rating-icon",
            style: `width: ${ICON_M}rem; box-sizing: border-box; padding: .1rem;`,
          },
          createStarIcon(SCHEME.star),
        ),
        E.div({
          style: `flex: 0 0 .4rem;`,
        }),
        E.div(
          {
            class: "season-item-rating",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${RATING_FORMATTER.format(season.averageRating)} (${RATINGS_COUNT_FORMATTER.format(season.ratingsCount)})`,
          ),
        ),
        E.div({
          style: `flex: 1 0 0;`,
        }),
        E.div(
          {
            class: "season-item-price",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(formatShowPriceShortened(season.grade)),
        ),
      ),
    );

    this.body.addEventListener("click", () => {
      this.emit("showDetails", season.seasonId);
    });
  }
}
