import EventEmitter = require("events");
import { SCHEME } from "../../common/color_scheme";
import { HoverObserver, Mode } from "../../common/hover_observer";
import {
  AVATAR_S,
  FONT_L,
  FONT_M,
  FONT_S,
  FONT_WEIGHT_600,
  LINE_HEIGHT_M,
} from "../../common/sizes";
import { formatSecondsAsHHMMSS } from "../../common/timestamp_formatter";
import { SeasonOverview } from "@phading/product_recommendation_service_interface/consumer/frontend/show/season_overview";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface SeasonItem {
  on(event: "play", listener: (episodeId: string) => void): this;
  on(event: "focusAccount", listener: (accountId: string) => void): this;
}

export class SeasonItem extends EventEmitter {
  public static create(season: SeasonOverview): SeasonItem {
    return new SeasonItem(season);
  }

  public body: HTMLDivElement;
  private seasonInfoContainer = new Ref<HTMLDivElement>();
  private seasonInfo = new Ref<HTMLDivElement>();
  private bottomInfo = new Ref<HTMLDivElement>();
  private coverImage = new Ref<HTMLImageElement>();
  private hoverObserver: HoverObserver;

  public constructor(season: SeasonOverview) {
    super();
    let dateFormatter = new Intl.DateTimeFormat(navigator.language, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    this.body = E.div(
      {
        class: "season-item",
        style: `width: 100%; aspect-ratio: 2/3; box-sizing: border-box; border: .1rem solid ${SCHEME.neutral1}; overflow: hidden; position: relative; cursor: pointer;`,
      },
      E.imageRef(this.coverImage, {
        class: "season-item-cover-image",
        style: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;`,
        src: season.coverImagePath,
      }),
      E.divRef(
        this.seasonInfoContainer,
        {
          class: "season-item-info-container",
          style: `position: absolute; left: 0; width: 100%; height: 100%; padding: 1rem; box-sizing: border-box; background-color: ${SCHEME.neutral4Translucent}; display: flex; flex-flow: column nowrap; transition: top .2s;`,
        },
        E.divRef(
          this.seasonInfo,
          {
            class: "season-item-info",
            style: `flex: 1 1 0; min-height: 0; box-sizing: border-box; overflow: hidden; display: flex; flex-flow: column nowrap;`,
          },
          E.div(
            {
              class: "season-item-title",
              style: `flex: 0 1 auto; min-height: 0; overflow: hidden; font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; color: ${SCHEME.neutral0};`,
            },
            E.text(season.name),
          ),
          E.div({
            style: `flex: 0 0 auto; height: .5rem;`,
          }),
          E.div(
            {
              class: "season-item-episode-title",
              style: `flex: 0 1 auto; min-height: 0; overflow: hidden; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}`,
            },
            E.text(season.continueEpisode.name),
          ),
          E.div({
            style: `flex: 0 0 auto; height: .5rem;`,
          }),
          E.div(
            {
              class: "season-item-episode-metadata",
              style:
                "flex: 0 0 auto; display: flex; flex-flow: row nowrap; justify-content: space-between;",
            },
            E.div(
              {
                class: "season-item-episode-published-time",
                style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral1};`,
              },
              E.text(
                dateFormatter.format(
                  new Date(season.continueEpisode.publishedTime * 1000),
                ),
              ),
            ),
            E.div(
              {
                class: "season-item-episode-length",
                style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral1};`,
              },
              E.text(formatSecondsAsHHMMSS(season.continueEpisode.length)),
            ),
          ),
        ),
        E.div({
          style: `flex: 0 0 auto; height: 1rem;`,
        }),
        E.divRef(
          this.bottomInfo,
          {
            class: "season-item-bottom-info",
            style: `flex: 0 0 auto; display: flex; flex-flow: row nowrap; align-items: center; gap: .5rem;`,
          },
          E.image({
            class: "season-item-publisher-avatar",
            style: `flex: 0 0 auto; width: ${AVATAR_S}rem; height: ${AVATAR_S}rem; border-radius: ${AVATAR_S}rem;`,
            src: season.publisher.avatarSmallPath,
          }),
          E.div(
            {
              class: "season-item-publisher-name",
              style: `flex: 1 1 0; min-width: 0; font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_M}rem; max-height: ${LINE_HEIGHT_M * 2}rem; color: ${SCHEME.neutral0}; overflow: hidden;`,
            },
            E.text(season.publisher.naturalName),
          ),
          E.div(
            {
              class: "season-item-grade",
              style: `flex: 0 0 auto; float: right; font-size: ${FONT_L}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
            },
            E.text(`G${season.grade.toString().padStart(2, "0")}`),
          ),
        ),
      ),
    );
    this.hideInfo();

    this.hoverObserver = HoverObserver.create(
      this.body,
      Mode.HOVER_DELAY_LEAVE,
    )
      .on("hover", () => this.showInfo())
      .on("leave", () => this.hideInfo());
    this.seasonInfo.val.addEventListener("click", () =>
      this.emit("play", season.continueEpisode.episodeId),
    );
    this.coverImage.val.addEventListener("click", () =>
      this.emit("play", season.continueEpisode.episodeId),
    );
    this.bottomInfo.val.addEventListener("click", () =>
      this.emit("focusAccount", season.publisher.accountId),
    );
  }

  private hideInfo(): void {
    this.seasonInfoContainer.val.style.top = "100%";
  }

  public showInfo(): void {
    this.seasonInfoContainer.val.style.top = "0%";
  }

  public remove(): void {
    this.body.remove();
  }

  // Visible for testing
  public click(): void {
    this.seasonInfo.val.click();
  }
  public clickAccount(): void {
    this.bottomInfo.val.click();
  }
  public hover(): void {
    this.hoverObserver.emit("hover");
  }
  public leave(): void {
    this.hoverObserver.emit("leave");
  }
}
