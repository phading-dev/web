import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import {
  IconTooltipButton,
  TooltipPosition,
} from "../../../common/icon_button";
import { createQuestionMarkIcon } from "../../../common/icons";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import {
  AVATAR_S,
  FONT_M,
  FONT_S,
  FONT_WEIGHT_600,
  ICON_S,
  LINE_HEIGHT_M,
} from "../../../common/sizes";
import { formatSecondsAsHHMMSS } from "../../../common/timestamp_formatter";
import { COMMERCE_SERVICE_CLIENT } from "../../../common/web_service_client";
import { CARD_SIDE_PADDING } from "../common/styles";
import { getPricing } from "@phading/commerce_service_interface/consumer/frontend/show/client";
import { GetPricingResponse } from "@phading/commerce_service_interface/consumer/frontend/show/interface";
import {
  EpisodeSummary,
  EpisodeToPlay,
} from "@phading/product_service_interface/consumer/frontend/show/episode_to_play";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface InfoCard {
  on(event: "play", listener: (episodeId: string) => void): this;
  on(event: "focusAccount", listener: (accountId: string) => void): this;
  on(event: "pricingLoaded", listener: () => void): this;
}

export class InfoCard extends EventEmitter {
  public static create(episodeToPlay: EpisodeToPlay): InfoCard {
    return new InfoCard(COMMERCE_SERVICE_CLIENT, episodeToPlay);
  }

  private static DATE_FORMATTER = new Intl.DateTimeFormat(navigator.language, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  private static NANO_TO_HUNDREDTH = 10000000; // 10^7

  public body: HTMLDivElement;
  private gradePricing = new Ref<HTMLDivElement>();
  public pricingQuestionMark = new Ref<IconTooltipButton>();
  private playingEpisodeItem: HTMLDivElement;
  public publisher = new Ref<HTMLDivElement>();

  public constructor(
    private webServiceClient: WebServiceClient,
    episodeToPlay: EpisodeToPlay,
  ) {
    super();
    this.body = E.div(
      {
        class: "info-card",
        style: `flex: 1 1 0; min-height: 0; width: 100%; height: 100%; padding: 1rem 0; box-sizing: border-box; overflow: hidden; flex-flow: column nowrap;`,
      },
      E.div(
        {
          class: "info-card-season-name",
          style: `flex: 0 0 auto; padding: 0 ${CARD_SIDE_PADDING}rem; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
        },
        E.text(episodeToPlay.season.name),
      ),
      E.div({
        style: "flex: 0 0 auto; height: .5rem",
      }),
      E.divRef(
        this.gradePricing,
        {
          class: "info-card-season-grade-pricing",
          style: `flex: 0 0 auto; align-self: flex-end; padding: 0 ${CARD_SIDE_PADDING}rem; height: ${ICON_S}rem; position: relative; display: flex; flex-flow: row nowrap; align-items: center; gap: .5rem;`,
        },
        E.div(
          {
            class: "info-card-season-grade",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${LOCALIZED_TEXT.gradePricing}${episodeToPlay.season.grade.toString().padStart(2, "0")}`,
          ),
        ),
      ),
      E.div({
        style: "flex: 0 0 auto; height: .5rem",
      }),
      E.div(
        {
          class: "info-card-episode-list",
          style: `flex: 0 2 auto; min-height: 0; overflow-y: auto; display: flex; flex-flow: column nowrap;`,
        },
        ...episodeToPlay.episodes.map((episodeSummary) =>
          this.createEpisodeItem(
            episodeSummary,
            episodeToPlay.episode.episodeId,
          ),
        ),
      ),
      E.div({
        class: "info-card-divider",
        style: `flex: 0 0 auto; margin: 0 ${CARD_SIDE_PADDING}rem 1rem; border-top: .1rem solid ${SCHEME.neutral1};`,
      }),
      E.div(
        {
          class: "info-card-season-info",
          style: `flex: 0 3 auto; min-height: 0; overflow-y: auto; display: flex; flex-flow: column nowrap; gap: 1rem;`,
        },
        E.div(
          {
            class: "info-card-season-details",
            style: `padding: 0 ${CARD_SIDE_PADDING}rem;`,
          },
          E.image({
            class: "info-card-season-cover-image",
            style: `float: left; width: 10rem; aspect-ratio: 2/3; border: .1rem solid ${SCHEME.neutral1}; object-fit: contain; margin: .2rem 1rem .3rem 0;`,
            src: episodeToPlay.season.coverImagePath,
          }),
          E.div(
            {
              class: "info-card-season-description",
              style: `display: inline; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(episodeToPlay.season.description),
          ),
        ),
        E.divRef(
          this.publisher,
          {
            class: "info-card-publisher",
            style: `padding: 0 ${CARD_SIDE_PADDING}rem; pointer: cursor;`,
          },
          E.image({
            class: "info-card-publisher-avatar",
            style: `float: left; width: ${AVATAR_S}rem; height: ${AVATAR_S}rem; border-radius: ${AVATAR_S}rem; margin: 0 .5rem .5rem 0;`,
            src: episodeToPlay.publisher.avatarSmallPath,
          }),
          E.div(
            {
              class: "info-card-publisher-name",
              style: `display: inline; font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(episodeToPlay.publisher.naturalName),
          ),
        ),
      ),
    );
    this.loadPricing(episodeToPlay);

    this.publisher.val.addEventListener("click", () =>
      this.emit("focusAccount", episodeToPlay.publisher.accountId),
    );
  }

  private createEpisodeItem(
    episode: EpisodeSummary,
    playingEpisodeId: string,
  ): HTMLDivElement {
    let item = E.div(
      {
        class: "info-card-episode-item",
        style: `width: 100%; padding: .5rem ${CARD_SIDE_PADDING}rem; box-sizing: border-box; ${episode.episodeId !== playingEpisodeId ? "cursor: pointer;" : ""}`,
      },
      E.div(
        {
          class: "info-card-episode-name",
          style: `font-size: ${FONT_M}rem; color: ${episode.episodeId === playingEpisodeId ? SCHEME.primary0 : SCHEME.neutral0};`,
        },
        E.text(`${episode.name}`),
      ),
      E.div({
        style: `height: .5rem;`,
      }),
      E.div(
        {
          class: "info-card-episode-metadata",
          style: `display: flex; flex-flow: row nowrap; justify-content: space-between;`,
        },
        E.div(
          {
            class: "info-card-episode-published-time",
            style: `font-size: ${FONT_S}rem; color: ${episode.episodeId === playingEpisodeId ? SCHEME.primary0 : SCHEME.neutral0};`,
          },
          E.text(
            InfoCard.DATE_FORMATTER.format(
              new Date(episode.publishedTime * 1000),
            ),
          ),
        ),
        E.div(
          {
            class: "info-card-episode-length",
            style: `font-size: ${FONT_S}rem; color: ${episode.episodeId === playingEpisodeId ? SCHEME.primary0 : SCHEME.neutral0};`,
          },
          E.text(formatSecondsAsHHMMSS(episode.length)),
        ),
      ),
    );
    if (episode.episodeId === playingEpisodeId) {
      this.playingEpisodeItem = item;
    }
    InfoCard.lowlightEpisodeItem(item);

    if (episode.episodeId !== playingEpisodeId) {
      item.addEventListener("click", () =>
        this.emit("play", episode.episodeId),
      );
    }
    item.addEventListener("pointerover", () =>
      InfoCard.highlightEpisodeItem(item),
    );
    item.addEventListener("pointerout", () =>
      InfoCard.lowlightEpisodeItem(item),
    );
    return item;
  }

  private async loadPricing(episodeToPlay: EpisodeToPlay): Promise<void> {
    let response: GetPricingResponse;
    try {
      response = await getPricing(this.webServiceClient, {
        grade: episodeToPlay.season.grade,
      });
    } catch {
      console.error("Unable to get pricing.");
      this.emit("pricingLoaded");
      return;
    }
    let formattedFraction = Math.round(
      response.money.nano / InfoCard.NANO_TO_HUNDREDTH,
    )
      .toString()
      .padEnd(2, "0");
    let formattedMoney = `$${response.money.integer}.${formattedFraction}`;

    this.gradePricing.val.append(
      assign(
        this.pricingQuestionMark,
        IconTooltipButton.create(
          ICON_S,
          0.5,
          "",
          createQuestionMarkIcon(SCHEME.neutral1),
          TooltipPosition.LEFT,
          `${LOCALIZED_TEXT.pricingRate1}${formattedMoney}${LOCALIZED_TEXT.pricingRate2}`,
        ),
      ).body,
    );
    this.emit("pricingLoaded");
  }

  private static highlightEpisodeItem(item: HTMLDivElement): void {
    item.style.backgroundColor = SCHEME.neutral3;
  }

  private static lowlightEpisodeItem(item: HTMLDivElement): void {
    item.style.backgroundColor = "";
  }

  public show(): this {
    this.body.style.display = "flex";
    this.playingEpisodeItem.scrollIntoView();
    return this;
  }

  public hide(): this {
    this.body.style.display = "none";
    return this;
  }

  public remove(): void {
    this.body.remove();
  }
}
