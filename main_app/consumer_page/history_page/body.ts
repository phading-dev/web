import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../common/navigation_bar";
import { eFullPage } from "../../../common/page_elements";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import {
  eContainerTitle,
  eContinueEpisodeItem,
  eContinueEpisodeItemContainerRef,
} from "../common/elements";
import { ActivityTab, ActivityTabsOption } from "../common/tabs";
import { newListWatchSessionsRequest } from "@phading/play_activity_service_interface/show/web/client";
import { newGetEpisodeWithSeasonSummaryRequest } from "@phading/product_service_interface/show/web/public/client";
import { SeasonSummaryAndEpisode } from "@phading/product_service_interface/show/web/public/info";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";
import { GAP_1X, GAP_2X } from "../../../common/sizes";

export interface HistoryPage {
  on(event: "viewWatchLater", listener: () => void): this;
  on(event: "viewUsage", listener: () => void): this;
  on(
    event: "play",
    listener: (seasonId: string, episodeId: string) => void,
  ): this;
  on(event: "loaded", listener: () => void): this;
}

export class HistoryPage extends EventEmitter {
  public static create(): HistoryPage {
    return new HistoryPage(SERVICE_CLIENT);
  }

  private static LIMIT = 10;

  public body: HTMLDivElement;
  public tabs = new Ref<ActivityTabsOption>();
  private dateToContentContainer = new Map<string, Ref<HTMLDivElement>>();
  private loadingSection = new Ref<ScrollLoadingSection>();
  private updatedTimeCursor: number;

  public constructor(private serviceClient: WebServiceClient) {
    super();
    this.body = eFullPage(
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      assign(this.tabs, new ActivityTabsOption()).body,
      assign(this.loadingSection, new ScrollLoadingSection()).body,
    );
    this.tabs.val.setValue(ActivityTab.HISTORY).on("select", (tab) => {
      switch (tab) {
        case ActivityTab.WATCH_LATER:
          this.emit("viewWatchLater");
        case ActivityTab.USAGE:
          this.emit("viewUsage");
      }
    });
    this.loadingSection.val
      .setLoadAction(() => this.load())
      .on("loaded", () => this.emit("loaded"))
      .load();
  }

  private async load(): Promise<boolean> {
    let response = await this.serviceClient.send(
      newListWatchSessionsRequest({
        limit: HistoryPage.LIMIT,
        updatedTimeCursor: this.updatedTimeCursor,
      }),
    );
    let summaries = new Array<SeasonSummaryAndEpisode>(
      response.sessions.length,
    );
    await Promise.all(
      response.sessions.map(async (session, i) => {
        try {
          let summaryResponse = await this.serviceClient.send(
            newGetEpisodeWithSeasonSummaryRequest({
              seasonId: session.seasonId,
              episodeId: session.episodeId,
            }),
          );
          summaries[i] = summaryResponse.summary;
        } catch (e) {
          console.log(e);
          return;
        }
      }),
    );

    response.sessions.forEach((session, i) => {
      let summary = summaries[i];
      if (!summary || !summary.episode.canPlay) {
        return;
      }

      let contentContainer = this.dateToContentContainer.get(session.date);
      if (!contentContainer) {
        contentContainer = new Ref<HTMLDivElement>();
        this.loadingSection.val.body.before(
          E.div({
            style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
          }),
          eContainerTitle(session.date),
          E.div({
            style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
          }),
          eContinueEpisodeItemContainerRef(contentContainer),
        );
        this.dateToContentContainer.set(session.date, contentContainer);
      }
      let item = eContinueEpisodeItem(
        summary.season,
        summary.episode,
        session.latestWatchedVideoTimeMs,
      );
      item.addEventListener("click", () => {
        this.emit("play", session.seasonId, session.episodeId);
      });
      contentContainer.val.append(item);
    });
    this.updatedTimeCursor = response.updatedTimeCursor;
    return Boolean(response.updatedTimeCursor);
  }

  public remove(): void {
    this.body.remove();
    this.loadingSection?.val.stopLoading();
    this.removeAllListeners();
  }
}
