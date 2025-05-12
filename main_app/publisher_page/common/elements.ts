import { SCHEME } from "../../../common/color_scheme";
import { formatLastChangeTime } from "../../../common/formatter/date";
import { formatShowPrice } from "../../../common/formatter/price";
import {
  formatRating,
  formatRatingsCountLong,
} from "../../../common/formatter/rating";
import { createFilledStarIcon } from "../../../common/icons";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  PAGE_CARD_BACKGROUND_STYLE,
  PAGE_COMMON_CARD_STYLE,
} from "../../../common/page_style";
import {
  FONT_L,
  FONT_M,
  FONT_S,
  FONT_WEIGHT_600,
  ICON_M,
} from "../../../common/sizes";
import { SeasonSummary } from "@phading/product_service_interface/show/web/publisher/summary";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export let PAGE_NAVIGATION_PADDING_BOTTOM = 7;

export function eSeasonItemsPage(
  title: string,
  card: Ref<HTMLDivElement>,
  ...elements: Array<HTMLElement>
): HTMLDivElement {
  return E.div(
    {
      class: "season-items-page",
      style: `${PAGE_CARD_BACKGROUND_STYLE} padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    },
    E.divRef(
      card,
      {
        class: "season-item-card",
        style: `${PAGE_COMMON_CARD_STYLE} padding: 1rem; border-radius: .5rem; max-width: 80rem;`,
      },
      E.div(
        {
          class: "season-item-card-title",
          style: `font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
        },
        E.text(title),
      ),
      ...elements,
    ),
  );
}

export function ePublishedSeasonItem(
  season: SeasonSummary,
  date: Date,
  customStyle = "",
): HTMLDivElement {
  return E.div(
    {
      class: "published-season-item",
      style: `cursor: pointer; display: flex; flex-flow: row nowrap; gap: 1rem; padding: 1rem 0; border-bottom: .1rem solid ${SCHEME.neutral1}; customStyle}`,
    },
    E.div(
      {
        class: "published-season-item-cover-image",
        style: `width: 30%; max-width: 15rem; flex: 0 0 auto;`,
      },
      E.image({
        class: "published-season-cover-image",
        style: `width: 100%; aspect-ratio: 2/3; object-fit: contain;`,
        src: season.coverImageUrl,
      }),
    ),
    E.div(
      {
        class: "published-season-item-info",
        style: `flex: 1 0 0; display: flex; flex-flow: column nowrap; gap: 1rem;`,
      },
      E.div(
        {
          class: "published-season-name",
          style: `font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
        },
        E.text(season.name),
      ),
      E.div(
        {
          class: "published-season-total-published-episodes",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          `${LOCALIZED_TEXT.totalPublishedEpisodes[0]}${season.totalPublishedEpisodes}${LOCALIZED_TEXT.totalPublishedEpisodes[1]}`,
        ),
      ),
      E.div(
        {
          class: "published-season-grade",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
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
          style: `flex: 0 0 .5rem;`,
        }),
        E.div(
          {
            class: "published-season-item-rating",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${formatRating(season.averageRating)} (${formatRatingsCountLong(season.ratingsCount)})`,
          ),
        ),
      ),
      E.div(
        {
          class: "published-season-last-change-time",
          style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          `${LOCALIZED_TEXT.seasonLastChangeTime}${formatLastChangeTime(season.lastChangeTimeMs)}`,
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
      style: `cursor: pointer; display: flex; flex-flow: row nowrap; gap: 1rem; padding: 1rem 0; border-bottom: .1rem solid ${SCHEME.neutral1}; ${customStyle}`,
    },
    E.div(
      {
        class: "draft-season-item-cover-image",
        style: `width: 30%; max-width: 15rem; flex: 0 0 auto;`,
      },
      season.coverImageUrl
        ? E.image({
            class: "draft-season-cover-image",
            style: `width: 100%; aspect-ratio: 2/3; object-fit: contain;`,
            src: season.coverImageUrl,
          })
        : E.div(
            {
              class: "draft-season-no-cover-image",
              style: `width: 100%; aspect-ratio: 2/3; display: flex; align-items: center; justify-content: center; font-size: ${FONT_L}rem; color: ${SCHEME.neutral1}; text-align: center;`,
            },
            E.text(LOCALIZED_TEXT.noCoverImage),
          ),
    ),
    E.div(
      {
        class: "draft-season-item-info",
        style: `flex: 1 0 0; display: flex; flex-flow: column nowrap; gap: 1rem;`,
      },
      E.div(
        {
          class: "draft-season-name",
          style: `font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
        },
        E.text(season.name),
      ),
      E.div(
        {
          class: "draft-season-grade",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          `${LOCALIZED_TEXT.currentRate}${formatShowPrice(season.grade, date)}`,
        ),
      ),
      E.div(
        {
          class: "draft-season-last-change-time",
          style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          `${LOCALIZED_TEXT.seasonLastChangeTime}${formatLastChangeTime(season.lastChangeTimeMs)}`,
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
      class: "archived-season-item-info",
      style: `flex: 1 0 0; display: flex; flex-flow: column nowrap; gap: 1rem; padding: 1rem 0; border-bottom: .1rem solid ${SCHEME.neutral1}; ${customStyle}`,
    },
    E.div(
      {
        class: "archived-season-name",
        style: `font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
      },
      E.text(season.name),
    ),
    E.div(
      {
        class: "archived-season-grade",
        style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
      },
      E.text(
        `${LOCALIZED_TEXT.currentRate}${formatShowPrice(season.grade, date)}`,
      ),
    ),
    E.div(
      {
        class: "archived-season-last-change-time",
        style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0};`,
      },
      E.text(
        `${LOCALIZED_TEXT.seasonLastChangeTime}${formatLastChangeTime(season.lastChangeTimeMs)}`,
      ),
    ),
  );
}
