import { AT_USER } from "../../../common/at_user";
import { SCHEME } from "../../../common/color_scheme";
import { formatShowPriceShortened } from "../../../common/formatter/price";
import {
  formatRating,
  formatRatingsCountShort,
} from "../../../common/formatter/rating";
import { formatSecondsAsHHMMSS } from "../../../common/formatter/timestamp";
import {
  createArrowIcon,
  createCircularProgressIcon,
  createFilledStarIcon,
} from "../../../common/icons";
import { eCoverImage } from "../../../common/season_cover_image";
import {
  AVATAR_M,
  FONT_M,
  FONT_WEIGHT_600,
  ICON_L,
  ICON_M,
  LINE_HEIGHT_M,
} from "../../../common/sizes";
import {
  Episode,
  SeasonSummary,
} from "@phading/product_service_interface/show/web/consumer/info";
import { AccountDetails } from "@phading/user_service_interface/web/third_person/account";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export function eSeasonItemContainerRef(
  ref: Ref<HTMLDivElement>,
): HTMLDivElement {
  return E.divRef(ref, {
    class: "season-item-container-content",
    style: `width: 100%; box-sizing: border-box; padding: 0 1rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(17.6rem, 1fr)); gap: 1rem;`,
  });
}

export function eContainerTitle(title: string): HTMLDivElement {
  return E.div(
    {
      class: "container-title",
      style: `padding: 0 1rem; font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
    },
    E.text(title),
  );
}

export function eContainerTitleClickableRef(
  ref: Ref<HTMLDivElement>,
  title: string,
): HTMLDivElement {
  return E.divRef(
    ref,
    {
      class: "container-title-clickable",
      style: `cursor: pointer; width: 100%; box-sizing: border-box; display: flex; flex-flow: row nowrap; align-items: center;`,
    },
    eContainerTitle(title),
    E.div(
      {
        class: "container-title-arrow",
        style: `width: ${ICON_M}rem; height: ${ICON_M}rem; transform: rotate(180deg);`,
      },
      createArrowIcon(SCHEME.neutral0),
    ),
  );
}

export function eSeasonItem(
  season: SeasonSummary,
  date: Date,
  customStyle = "",
): HTMLDivElement {
  return E.div(
    {
      class: "season-item-info",
      style: `cursor: pointer; ${customStyle}`,
    },
    eCoverImage("100%", season.coverImageUrl),
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
          style: `width: ${ICON_M}rem; height: ${ICON_M}rem;`,
        },
        createFilledStarIcon(SCHEME.star),
      ),
      E.div({
        style: `flex: 0 0 .5rem;`,
      }),
      E.div(
        {
          class: "season-item-rating",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          `${formatRating(season.averageRating)} (${formatRatingsCountShort(season.ratingsCount)})`,
        ),
      ),
      E.div({
        style: `flex: 1 0 .5rem;`,
      }),
      E.div(
        {
          class: "season-item-price",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(formatShowPriceShortened(season.grade, date)),
      ),
    ),
  );
}

export function eContinueEpisodeItemContainerRef(
  ref: Ref<HTMLDivElement>,
): HTMLDivElement {
  return E.divRef(ref, {
    class: "continue-watching-content",
    style: `width: 100%; box-sizing: border-box; padding: 0 1rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(36rem, 1fr)); gap: 1rem;`,
  });
}

export function eContinueEpisodeItem(
  season: SeasonSummary,
  episode: Episode,
  continueTimeMs: number,
  customStyle = "",
): HTMLDivElement {
  return E.div(
    {
      class: "continue-episode-item",
      style: `cursor: pointer; display: flex; flex-flow: row nowrap; align-items: flex-start; ${customStyle}`,
    },
    E.div(
      {
        class: "continue-episode-season-cover-image",
        style: `width: 30%; flex: 0 0 auto;`,
      },
      eCoverImage("100%", season.coverImageUrl),
    ),
    E.div({
      style: `width: 1rem;`,
    }),
    E.div(
      {
        class: "continue-episode-info",
        style: `flex: 1 0 0; display: flex; flex-flow: column nowrap; gap: 1rem;`,
      },
      E.div(
        {
          class: "continue-episode-season-name",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; line-height: ${LINE_HEIGHT_M}rem; max-height: ${LINE_HEIGHT_M * 3}rem; overflow: hidden;`,
        },
        E.text(season.name),
      ),
      E.div(
        {
          class: "continue-episode-name",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; line-height: ${LINE_HEIGHT_M}rem; max-height: ${LINE_HEIGHT_M * 3}rem; overflow: hidden;`,
        },
        E.text(episode.name),
      ),
      E.div(
        {
          class: "continue-episode-progress-line",
          style: `width: 100%; display: flex; flex-flow: row wrap; align-items: center; gap: 1rem;`,
        },
        E.div(
          {
            class: "continue-episode-progress-icon",
            style: `width: ${ICON_L}rem;`,
          },
          createCircularProgressIcon(
            SCHEME.progress,
            SCHEME.neutral2,
            continueTimeMs / 1000 / episode.videoDurationSec,
          ),
        ),
        E.div(
          {
            class: "continue-episode-continue-at",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${formatSecondsAsHHMMSS(Math.round(continueTimeMs / 1000))} / ${formatSecondsAsHHMMSS(episode.videoDurationSec)}`,
          ),
        ),
      ),
    ),
  );
}

export function ePublisherItemContainerRef(
  ref: Ref<HTMLDivElement>,
): HTMLDivElement {
  return E.divRef(ref, {
    class: "publishers-content",
    style: `width: 100%; box-sizing: border-box; padding: 0 1rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(36rem, 1fr)); gap: 2rem;`,
  });
}

export function ePublisherItem(
  publisher: AccountDetails,
  customStyle = "",
): HTMLDivElement {
  return E.div(
    {
      class: "publisher-item",
      style: `cursor: pointer; display: flex; flex-flow: row nowrap; gap: 1rem; ${customStyle}`,
    },
    E.image({
      class: "publisher-item-avatar",
      style: `width: ${AVATAR_M}rem; height: ${AVATAR_M}rem; border-radius: 100%;`,
      src: publisher.avatarLargeUrl,
      alt: publisher.naturalName,
    }),
    E.div(
      {
        class: "publisher-item-info",
        style: `flex: 1 0 0; display: flex; flex-flow: column nowrap; gap: .5rem;`,
      },
      E.div(
        {
          class: "publisher-item-name",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600}; line-height: ${LINE_HEIGHT_M}rem; max-height: ${LINE_HEIGHT_M * 3}rem; overflow: hidden;`,
        },
        E.text(publisher.naturalName),
      ),
      E.div(
        {
          class: "publisher-item-id",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral1};`,
        },
        E.text(`${AT_USER}${publisher.accountId}`),
      ),
      E.div(
        {
          class: "publisher-item-description",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; line-height: ${LINE_HEIGHT_M}rem; max-height: ${LINE_HEIGHT_M * 3}rem; overflow: hidden;`,
        },
        E.text(publisher.description ?? ""),
      ),
    ),
  );
}

export function ePublisherContextItem(
  publisher: AccountDetails,
  customStyle = "",
): HTMLDivElement {
  return E.div(
    {
      class: "publisher-context-item-container",
      style: `width: 100%; box-sizing: border-box; padding: 0 1rem; display: flex; flex-flow: row nowrap; justify-content: center; ${customStyle}`,
    },
    E.div(
      {
        class: "publisher-context-item",
        style: `flex: 1; max-width: 60rem; display: flow-root;`,
      },
      E.image({
        class: "publisher-context-item-avatar",
        style: `float: left; margin: 0 1rem .5rem 0; width: ${AVATAR_M}rem; height: ${AVATAR_M}rem; border-radius: 100%;`,
        src: publisher.avatarLargeUrl,
        alt: publisher.naturalName,
      }),
      E.div(
        {
          class: "publisher-context-item-name",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
        },
        E.text(publisher.naturalName),
      ),
      E.div({
        style: `height: .5rem;`,
      }),
      E.div(
        {
          class: "publisher-context-item-id",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral1};`,
        },
        E.text(`${AT_USER}${publisher.accountId}`),
      ),
      E.div({
        style: `height: 1rem;`,
      }),
      E.div(
        {
          class: "publisher-context-item-description",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(publisher.description ?? ""),
      ),
    ),
  );
}
