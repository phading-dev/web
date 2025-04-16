import { AT_USER } from "../../../common/at_user";
import { SCHEME } from "../../../common/color_scheme";
import { formatShowPriceShortened } from "../../../common/formatter/price";
import {
  RATINGS_COUNT_FORMATTER,
  RATING_FORMATTER,
} from "../../../common/formatter/rating";
import { formatSecondsAsHHMMSS } from "../../../common/formatter/timestamp";
import {
  createCircularProgressIcon,
  createStarIcon,
} from "../../../common/icons";
import {
  AVATAR_M,
  FONT_M,
  FONT_WEIGHT_600,
  ICON_M,
  LINE_HEIGHT_M,
} from "../../../common/sizes";
import {
  EpisodeSummary,
  SeasonSummary,
} from "@phading/product_service_interface/show/web/consumer/summary";
import { AccountDetails } from "@phading/user_service_interface/web/third_person/account";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export function eFullPage(...elements: Array<HTMLElement>): HTMLDivElement {
  return E.div(
    {
      class: "full-page",
      style: `width: 100%; min-height: 100%; background-color: ${SCHEME.neutral4}; padding: 1rem 1rem 7rem 1rem; box-sizing: border-box; display: flex; flex-flow: column nowrap; gap: 2rem;`,
    },
    ...elements,
  );
}

export function eSeasonItemContainer(
  title: string,
  contentContainer: Ref<HTMLDivElement>,
  ...elements: Array<HTMLElement>
): HTMLDivElement {
  return E.div(
    {
      class: "season-item-container",
      style: `width: 100%; display: flex; flex-flow: column nowrap; gap: 1rem;`,
    },
    E.div(
      {
        class: "season-item-container-title",
        style: `font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
      },
      E.text(title),
    ),
    E.divRef(contentContainer, {
      class: "season-item-container-content",
      style: `width: 100%; display: grid; grid-template-columns: repeat(auto-fill, minmax(17.6rem, 1fr)); gap: 1rem;`,
    }),
    ...elements,
  );
}

export function eSeasonItem(
  season: SeasonSummary,
  customStyle?: string,
): HTMLDivElement {
  return E.div(
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
}

export function eEpisodeItemContainer(
  title: string,
  contentContainer: Ref<HTMLDivElement>,
  ...elements: Array<HTMLElement>
): HTMLDivElement {
  return E.div(
    {
      class: "continue-watching-section",
      style: `width: 100%; display: flex; flex-flow: column nowrap; gap: 1rem;`,
    },
    E.div(
      {
        class: "continue-watching-title",
        style: `font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
      },
      E.text(title),
    ),
    E.divRef(contentContainer, {
      class: "continue-watching-content",
      style: `width: 100%; display: grid; grid-template-columns: repeat(auto-fill, minmax(36rem, 1fr)); gap: 1rem;`,
    }),
    ...elements,
  );
}

export function eEpisodeItem(
  season: SeasonSummary,
  episode: EpisodeSummary,
  customStyle?: string,
): HTMLDivElement {
  return E.div(
    {
      class: "continue-episode-item",
      style: `cursor: pointer; display: flex; flex-flow: row nowrap; align-items: flex-start; ${customStyle ?? ""}`,
    },
    E.image({
      class: "continue-episode-season-cover-image",
      style: `width: 30%; flex: 0 0 auto; aspect-ratio: 2/3; object-fit: contain;`,
      src: season.coverImageUrl,
      alt: season.name,
    }),
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
            style: `width: ${ICON_M}rem;`,
          },
          createCircularProgressIcon(
            SCHEME.progress,
            SCHEME.neutral2,
            episode.continueTimeMs / 1000 / episode.videoDurationSec,
          ),
        ),
        E.div(
          {
            class: "continue-episode-continue-at",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${formatSecondsAsHHMMSS(Math.round(episode.continueTimeMs / 1000))} / ${formatSecondsAsHHMMSS(episode.videoDurationSec)}`,
          ),
        ),
      ),
    ),
  );
}

export function ePublisherItemContainer(
  title: string,
  contentContainer: Ref<HTMLDivElement>,
  ...elements: Array<HTMLElement>
): HTMLDivElement {
  return E.div(
    {
      class: "publishers-section",
      style: `width: 100%; display: flex; flex-flow: column nowrap; gap: 2rem;`,
    },
    E.div(
      {
        class: "publishers-title",
        style: `font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
      },
      E.text(title),
    ),
    E.divRef(contentContainer, {
      class: "publishers-content",
      style: `width: 100%; display: grid; grid-template-columns: repeat(auto-fill, minmax(36rem, 1fr)); gap: 2rem;`,
    }),
    ...elements,
  );
}

export function ePublisherItem(
  publisher: AccountDetails,
  customStyle?: string,
): HTMLDivElement {
  return E.div(
    {
      class: "publisher-item",
      style: `cursor: pointer; display: flex; flex-flow: row nowrap; gap: 1rem; ${customStyle ?? ""}`,
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
  customStyle?: string,
): HTMLDivElement {
  return E.div(
    {
      class: "publisher-context-item-container",
      style: `width: 100%; display: flex; flex-flow: row nowrap; justify-content: center; ${customStyle ?? ""}`,
    },
    E.div(
      {
        class: "publisher-context-item",
        style: `flex: 1; max-width: 60rem; display: flex; flex-flow: row nowrap; gap: 1rem;`,
      },
      E.image({
        class: "publisher-context-item-avatar",
        style: `width: ${AVATAR_M}rem; height: ${AVATAR_M}rem; border-radius: 100%;`,
        src: publisher.avatarLargeUrl,
        alt: publisher.naturalName,
      }),
      E.div(
        {
          class: "publisher-context-item-info",
          style: `flex: 1 0 0; display: flex; flex-flow: column nowrap; gap: .5rem;`,
        },
        E.div(
          {
            class: "publisher-context-item-name",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600}; line-height: ${LINE_HEIGHT_M}rem;`,
          },
          E.text(publisher.naturalName),
        ),
        E.div(
          {
            class: "publisher-context-item-id",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral1};`,
          },
          E.text(`${AT_USER}${publisher.accountId}`),
        ),
        E.div(
          {
            class: "publisher-context-item-description",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; line-height: ${LINE_HEIGHT_M}rem;`,
          },
          E.text(publisher.description ?? ""),
        ),
      ),
    ),
  );
}
