import EventEmitter = require("events");
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../common/navigation_bar";
import { eFullPage } from "../../../common/page_elements";
import { GAP_1X, GAP_2X } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import {
  eContainerTitleClickableRef,
  eContinueEpisodeItem,
  eContinueEpisodeItemContainerRef,
  eSeasonItem,
  eSeasonItemContainerRef,
} from "../common/elements";
import { newListContinueWatchingSeasonsRequest } from "@phading/product_service_interface/show/web/consumer/client";
import {
  newListSeasonsByRatingRequest,
  newListSeasonsByRecentPremiereTimeRequest,
} from "@phading/product_service_interface/show/web/public/client";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface MultiSectionPage {
  on(
    event: "play",
    listener: (seasonId: string, episodeId: string) => void,
  ): this;
  on(event: "viewDetails", listener: (seasonId: string) => void): this;
  on(event: "listWatchHistory", listener: () => void): this;
  on(event: "listRecentPremieres", listener: () => void): this;
  on(event: "listTopRated", listener: () => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class MultiSectionPage extends EventEmitter {
  public static create(): MultiSectionPage {
    return new MultiSectionPage(SERVICE_CLIENT, () => new Date());
  }

  private static LIMIT = 10;

  public body: HTMLDivElement;
  public continueWatchingButton = new Ref<HTMLDivElement>();
  public recentPremieresButton = new Ref<HTMLDivElement>();
  public topRatedButton = new Ref<HTMLDivElement>();

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
  ) {
    super();
    this.body = eFullPage(
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
    );
    this.load();
  }

  private async load() {
    let [
      continueWatchingSeasonsResponse,
      recentPremiereSeasonsResponse,
      topRatedSeasonsResponse,
    ] = await Promise.all([
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
      this.serviceClient.send(
        newListSeasonsByRatingRequest({
          limit: MultiSectionPage.LIMIT,
        }),
      ),
    ]);
    let continueWatchingContent = new Ref<HTMLDivElement>();
    let recentPremieresContent = new Ref<HTMLDivElement>();
    let topRatedContent = new Ref<HTMLDivElement>();
    this.body.append(
      ...(continueWatchingSeasonsResponse.continues.length > 0
        ? [
            eContainerTitleClickableRef(
              this.continueWatchingButton,
              LOCALIZED_TEXT.continueWatchingTitle,
            ),
            E.div({
              style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
            }),
            eContinueEpisodeItemContainerRef(continueWatchingContent),
            E.div({
              style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
            }),
          ]
        : []),
      eContainerTitleClickableRef(
        this.recentPremieresButton,
        LOCALIZED_TEXT.recentPremieresTitle,
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      eSeasonItemContainerRef(recentPremieresContent),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      eContainerTitleClickableRef(
        this.topRatedButton,
        LOCALIZED_TEXT.topRatedTitle,
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      eSeasonItemContainerRef(topRatedContent),
    );
    if (continueWatchingContent.val) {
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
        continueWatchingContent.val.append(item);
      }
    }
    recentPremiereSeasonsResponse.seasons.forEach((season) => {
      let item = eSeasonItem(season, this.getNowDate());
      item.addEventListener("click", () => {
        this.emit("viewDetails", season.seasonId);
      });
      recentPremieresContent.val.append(item);
    });
    topRatedSeasonsResponse.seasons.forEach((season) => {
      let item = eSeasonItem(season, this.getNowDate());
      item.addEventListener("click", () => {
        this.emit("viewDetails", season.seasonId);
      });
      topRatedContent.val.append(item);
    });

    this.continueWatchingButton.val?.addEventListener("click", () => {
      this.emit("listWatchHistory");
    });
    this.recentPremieresButton.val.addEventListener("click", () => {
      this.emit("listRecentPremieres");
    });
    this.topRatedButton.val.addEventListener("click", () => {
      this.emit("listTopRated");
    });
    this.emit("loaded");
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
