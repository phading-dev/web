import EventEmitter = require("events");
import { CLICKABLE_TEXT_STYLE } from "../../../common/button_styles";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { FONT_M } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import {
  eContinueEpisodeItem,
  eContinueEpisodeItemContainer,
  eFullPage,
  eSeasonItem,
  eSeasonItemContainer,
} from "../common/elements";
import {
  newListContinueWatchingSeasonsRequest,
  newListSeasonsByRecentPremiereTimeRequest,
} from "@phading/product_service_interface/show/web/consumer/client";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface MultiSectionPage {
  on(
    event: "play",
    listener: (seasonId: string, episodeId: string) => void,
  ): this;
  on(event: "showDetails", listener: (seasonId: string) => void): this;
  on(event: "listWatchHistory", listener: () => void): this;
  on(event: "listRecentPremieres", listener: () => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class MultiSectionPage extends EventEmitter {
  public static create(): MultiSectionPage {
    return new MultiSectionPage(SERVICE_CLIENT);
  }

  private static LIMIT = 10;

  public body: HTMLDivElement;
  public continueWatchingViewMore = new Ref<HTMLDivElement>();
  public recentPremieresViewMore = new Ref<HTMLDivElement>();

  public constructor(private serviceClient: WebServiceClient) {
    super();
    this.body = eFullPage();
    this.load();
  }

  private async load() {
    let [continueWatchingSeasonsResponse, recentPremiereSeasonsResponse] =
      await Promise.all([
        this.serviceClient.send(
          newListContinueWatchingSeasonsRequest({
            limit: MultiSectionPage.LIMIT,
          }),
        ),
        this.serviceClient.send(
          newListSeasonsByRecentPremiereTimeRequest({
            limit: MultiSectionPage.LIMIT,
          }),
        ),
      ]);
    let episodeContent = new Ref<HTMLDivElement>();
    let seasonContent = new Ref<HTMLDivElement>();
    this.body.append(
      ...(continueWatchingSeasonsResponse.continues.length > 0
        ? [
            eContinueEpisodeItemContainer(
              LOCALIZED_TEXT.continueWatchingTitle,
              episodeContent,
              E.divRef(
                this.continueWatchingViewMore,
                {
                  class: "multi-section-continue-watching-view-history",
                  style: `${CLICKABLE_TEXT_STYLE} font-size: ${FONT_M}rem; align-self: flex-end;`,
                },
                E.text(LOCALIZED_TEXT.viewHistoryLink),
              ),
            ),
          ]
        : []),
      eSeasonItemContainer(
        LOCALIZED_TEXT.recentPremieresTitle,
        seasonContent,
        E.divRef(
          this.recentPremieresViewMore,
          {
            class: "multi-section-recent-premiere-view-more",
            style: `${CLICKABLE_TEXT_STYLE} font-size: ${FONT_M}rem; align-self: flex-end;`,
          },
          E.text(LOCALIZED_TEXT.viewMoreLink),
        ),
      ),
    );
    if (episodeContent.val) {
      for (
        let i = 0;
        i < continueWatchingSeasonsResponse.continues.length && i < 3;
        i++
      ) {
        let continueSummary = continueWatchingSeasonsResponse.continues[i];
        let item = eContinueEpisodeItem(
          continueSummary.season,
          continueSummary.episode,
          continueSummary.continueTimeMs,
        );
        item.addEventListener("click", () => {
          this.emit(
            "play",
            continueSummary.season.seasonId,
            continueSummary.episode.episodeId,
          );
        });
        episodeContent.val.append(item);
      }
    }
    recentPremiereSeasonsResponse.seasons.forEach((season) => {
      let item = eSeasonItem(season);
      item.addEventListener("click", () => {
        this.emit("showDetails", season.seasonId);
      });
      seasonContent.val.append(item);
    });

    if (this.continueWatchingViewMore.val) {
      this.continueWatchingViewMore.val.addEventListener("click", () => {
        this.emit("listWatchHistory");
      });
    }
    this.recentPremieresViewMore.val.addEventListener("click", () => {
      this.emit("listRecentPremieres");
    });
    this.emit("loaded");
  }
}
