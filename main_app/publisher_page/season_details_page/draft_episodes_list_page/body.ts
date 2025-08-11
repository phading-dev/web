import EventEmitter = require("events");
import { IconButton, createBackButton } from "../../../../common/button";
import { SCHEME } from "../../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import {
  eCenteredTitle,
  ePageWithTopDownCard,
} from "../../../../common/page_elements";
import {
  FONT_M,
  GAP_0_5X,
  GAP_1X,
  GAP_2X,
  ICON_S,
  LINE_HEIGHT_M,
  PAGE_MAX_WIDTH_L,
} from "../../../../common/sizes";
import { eRowBoxWithArrow } from "../../../../common/value_box";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { newListDraftEpisodesRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { EpisodeSummary } from "@phading/product_service_interface/show/web/publisher/summary";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface DraftEpisodesListPage {
  on(event: "back", listener: () => void): this;
  on(event: "viewEpisode", listener: (episodeId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class DraftEpisodesListPage extends EventEmitter {
  public static create(seasonId: string): DraftEpisodesListPage {
    return new DraftEpisodesListPage(SERVICE_CLIENT, seasonId);
  }

  public body: HTMLDivElement;
  private card = new Ref<HTMLDivElement>();
  public backButton = new Ref<IconButton>();
  public draftEpisodeElements = new Array<HTMLDivElement>();

  public constructor(
    private serviceClient: WebServiceClient,
    public seasonId: string,
  ) {
    super();
    this.body = ePageWithTopDownCard(
      this.card,
      `max-width: ${PAGE_MAX_WIDTH_L}rem; padding: ${GAP_2X}rem ${GAP_1X}rem ${PAGE_NAVIGATION_PADDING_BOTTOM}rem ${GAP_1X}rem; display: flex; flex-flow: column nowrap;`,
    );
    this.loadDrafts();
  }

  private async loadDrafts(): Promise<void> {
    let { episodes: draftEpisodes } = await this.serviceClient.send(
      newListDraftEpisodesRequest({
        seasonId: this.seasonId,
      }),
    );
    this.card.val.append(
      assign(this.backButton, createBackButton()).body,
      eCenteredTitle(LOCALIZED_TEXT.seasonDraftEpisodes),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      ...(draftEpisodes.length === 0
        ? [
            E.div(
              {
                class: "season-details-draft-episodes-empty",
                style: `align-self: center; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
              },
              E.text(LOCALIZED_TEXT.seasonDraftEpisodesEmpty),
            ),
          ]
        : draftEpisodes.map((episode) => this.eDraftEpisode(episode))),
    );
    this.backButton.val.addAction(() => this.emit("back"));
    this.emit("loaded");
  }

  private eDraftEpisode(episode: EpisodeSummary): HTMLDivElement {
    let body = eRowBoxWithArrow(
      [
        E.div({
          class: "season-details-draft-episode-icon",
          style: `width: ${ICON_S}rem; height: ${ICON_S}rem; border-radius: ${ICON_S / 2}rem; background-color: ${SCHEME.fair0};`,
        }),
        E.div(
          {
            class: "season-details-draft-episode-name",
            style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(episode.name),
        ),
      ],
      {
        columnGap: GAP_0_5X,
        customStyle: `margin-top: ${GAP_1X}rem;`,
      },
    );
    this.draftEpisodeElements.push(body);
    body.addEventListener("click", () =>
      this.emit("viewEpisode", episode.episodeId),
    );
    return body;
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
