import EventEmitter = require("events");
import { SCHEME } from "../../../common/color_scheme";
import { formatSecondsAsHHMMSS } from "../../../common/formatter/timestamp";
import { createCircularProgressIcon } from "../../../common/icons";
import { FONT_M, ICON_M, LINE_HEIGHT_M } from "../../../common/sizes";
import {
  EpisodeSummary,
  SeasonSummary,
} from "@phading/product_service_interface/show/web/consumer/summary";
import { E } from "@selfage/element/factory";

export interface ContinueEpisodeItem {
  on(
    event: "play",
    listener: (seasonId: string, episodeId: string) => void,
  ): this;
}

export class ContinueEpisodeItem extends EventEmitter {
  public body: HTMLDivElement;

  public constructor(
    season: SeasonSummary,
    episode: EpisodeSummary,
    customStyle?: string,
  ) {
    super();
    this.body = E.div(
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
            createCircularProgressIcon(SCHEME.progress, SCHEME.neutral2, episode.continueTimeMs / 1000 / episode.videoDurationSec),
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

    this.body.addEventListener("click", () => {
      this.emit("play", season.seasonId, episode.episodeId);
    });
  }
}
