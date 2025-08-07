import { SCHEME } from "../../../common/color_scheme";
import { formatLastChangeTimeShort } from "../../../common/formatter/date";
import { formatShowPrice } from "../../../common/formatter/price";
import {
  formatRating,
  formatRatingsCountLong,
} from "../../../common/formatter/rating";
import { createFilledStarIcon } from "../../../common/icons";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { eCoverImage } from "../../../common/season_cover_image";
import { BORDER_WIDTH_1, FONT_M, FONT_S, FONT_WEIGHT_600, GAP_1X, GAP_0_5X, ICON_M, LINE_HEIGHT_M, LINE_HEIGHT_S } from "../../../common/sizes";
import { SeasonSummary } from "@phading/product_service_interface/show/web/publisher/summary";
import { E } from "@selfage/element/factory";

export function ePublishedSeasonItem(
  season: SeasonSummary,
  date: Date,
  customStyle = "",
): HTMLDivElement {
  return E.div(
    {
      class: "published-season-item",
      style: `margin: 0 ${GAP_1X}rem; cursor: pointer; display: flex; flex-flow: row nowrap; gap: ${GAP_0_5X}rem; padding: ${GAP_0_5X}rem 0; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; ${customStyle}`,
    },
    E.div(
      {
        class: "published-season-item-cover-image",
        style: `width: 30%; max-width: 10rem; flex: 0 0 auto;`,
      },
      eCoverImage("100%", season.coverImageUrl),
    ),
    E.div(
      {
        class: "published-season-item-info",
        style: `flex: 1 0 0; display: flex; flex-flow: column nowrap;`,
      },
      E.div(
        {
          class: "published-season-name",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
        },
        E.text(season.name),
      ),
      E.div(
        {
          class: "published-season-total-published-episodes",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          `${LOCALIZED_TEXT.totalPublishedEpisodes[0]}${season.totalPublishedEpisodes}${LOCALIZED_TEXT.totalPublishedEpisodes[1]}`,
        ),
      ),
      E.div(
        {
          class: "published-season-grade",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          `${LOCALIZED_TEXT.currentRate}${formatShowPrice(season.grade, date)}`,
        ),
      ),
      E.div(
        {
          class: "published-season-item-rating-line",
          style: `display: flex; flex-flow: row nowrap; align-items: center;`,
        },
        E.div(
          {
            class: "published-season-item-rating-icon",
            style: `width: ${ICON_M}rem; height: ${ICON_M}rem;`,
          },
          createFilledStarIcon(SCHEME.star),
        ),
        E.div({
          style: `flex: 0 0 ${GAP_0_5X}rem;`,
        }),
        E.div(
          {
            class: "published-season-item-rating",
            style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${formatRating(season.averageRating)} (${formatRatingsCountLong(season.ratingsCount)})`,
          ),
        ),
      ),
      E.div(
        {
          class: "published-season-state",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          `${LOCALIZED_TEXT.seasonStateLabel}${LOCALIZED_TEXT.seasonStatePublishedLabel}`,
        ),
      ),
      E.div(
        {
          class: "published-season-last-change-time",
          style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
        },
        E.text(
          `${LOCALIZED_TEXT.seasonLastChangeTime}${formatLastChangeTimeShort(season.lastChangeTimeMs)}`,
        ),
      ),
    ),
  );
}

export function eTakenDownSeasonItem(
  season: SeasonSummary,
  date: Date,
  customStyle = "",
): HTMLDivElement {
  return E.div(
    {
      class: "published-season-item",
      style: `margin: 0 ${GAP_1X}rem; cursor: pointer; display: flex; flex-flow: row nowrap; gap: ${GAP_0_5X}rem; padding: ${GAP_0_5X}rem 0; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; ${customStyle}`,
    },
    E.div(
      {
        class: "published-season-item-cover-image",
        style: `width: 30%; max-width: 10rem; flex: 0 0 auto;`,
      },
      eCoverImage("100%", season.coverImageUrl),
    ),
    E.div(
      {
        class: "published-season-item-info",
        style: `flex: 1 0 0; display: flex; flex-flow: column nowrap;`,
      },
      E.div(
        {
          class: "published-season-name",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
        },
        E.text(season.name),
      ),
      E.div(
        {
          class: "published-season-grade",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          `${LOCALIZED_TEXT.currentRate}${formatShowPrice(season.grade, date)}`,
        ),
      ),
      E.div(
        {
          class: "published-season-state",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          `${LOCALIZED_TEXT.seasonStateLabel}${LOCALIZED_TEXT.seasonStateTakenDownLabel}`,
        ),
      ),
      E.div(
        {
          class: "published-season-last-change-time",
          style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
        },
        E.text(
          `${LOCALIZED_TEXT.seasonLastChangeTime}${formatLastChangeTimeShort(season.lastChangeTimeMs)}`,
        ),
      ),
    ),
  );
}

export function eDraftSeasonItem(
  season: SeasonSummary,
  date: Date,
  customStyle = "",
): HTMLDivElement {
  return E.div(
    {
      class: "draft-season-item",
      style: `margin: 0 ${GAP_1X}rem; cursor: pointer; display: flex; flex-flow: row nowrap; gap: ${GAP_0_5X}rem; padding: ${GAP_0_5X}rem 0; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; ${customStyle}`,
    },
    E.div(
      {
        class: "draft-season-item-cover-image",
        style: `width: 30%; max-width: 10rem; flex: 0 0 auto;`,
      },
      eCoverImage("100%", season.coverImageUrl),
    ),
    E.div(
      {
        class: "draft-season-item-info",
        style: `flex: 1 0 0; display: flex; flex-flow: column nowrap;`,
      },
      E.div(
        {
          class: "draft-season-name",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
        },
        E.text(season.name),
      ),
      E.div(
        {
          class: "draft-season-grade",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          `${LOCALIZED_TEXT.currentRate}${formatShowPrice(season.grade, date)}`,
        ),
      ),
      E.div(
        {
          class: "draft-season-state",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          `${LOCALIZED_TEXT.seasonStateLabel}${LOCALIZED_TEXT.seasonStateDraftLabel}`,
        ),
      ),
      E.div(
        {
          class: "draft-season-last-change-time",
          style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
        },
        E.text(
          `${LOCALIZED_TEXT.seasonLastChangeTime}${formatLastChangeTimeShort(season.lastChangeTimeMs)}`,
        ),
      ),
    ),
  );
}

export function eArchivedSeasonItem(
  season: SeasonSummary,
  date: Date,
  customStyle = "",
): HTMLDivElement {
  return E.div(
    {
      class: "archived-season-item",
      style: `margin: 0 ${GAP_1X}rem; cursor: pointer; display: flex; flex-flow: row nowrap; gap: ${GAP_0_5X}rem; padding: ${GAP_0_5X}rem 0; border-bottom: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; ${customStyle}`,
    },
    E.div(
      {
        class: "archived-season-item-cover-image",
        style: `width: 30%; max-width: 10rem; flex: 0 0 auto;`,
      },
      eCoverImage("100%", season.coverImageUrl),
    ),
    E.div(
      {
        class: "archived-season-item-info",
        style: `flex: 1 0 0; display: flex; flex-flow: column nowrap;`,
      },
      E.div(
        {
          class: "archived-season-name",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
        },
        E.text(season.name),
      ),
      E.div(
        {
          class: "archived-season-grade",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          `${LOCALIZED_TEXT.currentRate}${formatShowPrice(season.grade, date)}`,
        ),
      ),
      E.div(
        {
          class: "archived-season-state",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          `${LOCALIZED_TEXT.seasonStateLabel}${LOCALIZED_TEXT.seasonStateArchivedLabel}`,
        ),
      ),
      E.div(
        {
          class: "archived-season-last-change-time",
          style: `font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.neutral1};`,
        },
        E.text(
          `${LOCALIZED_TEXT.seasonLastChangeTime}${formatLastChangeTimeShort(season.lastChangeTimeMs)}`,
        ),
      ),
    ),
  );
}
