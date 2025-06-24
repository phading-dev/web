import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../common/navigation_bar";
import { eFullPage } from "../../../common/page_elements";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { eSeasonItem, eSeasonItemContainerRef } from "../common/elements";
import { ActivityTab, ActivityTabsOption } from "../common/tabs";
import { newListFromWatchLaterListRequest } from "@phading/play_activity_service_interface/show/web/client";
import { newGetSeasonSummaryRequest } from "@phading/product_service_interface/show/web/consumer/client";
import { SeasonSummary } from "@phading/product_service_interface/show/web/consumer/info";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";

export interface WatchLaterPage {
  on(event: "viewHistory", listener: () => void): this;
  on(event: "viewUsage", listener: () => void): this;
  on(event: "viewDetails", listener: (seasonId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class WatchLaterPage extends EventEmitter {
  public static create(): WatchLaterPage {
    return new WatchLaterPage(SERVICE_CLIENT, () => new Date());
  }

  private static LIMIT = 10;

  public body: HTMLDivElement;
  public tabs = new Ref<ActivityTabsOption>();
  private contentContainer = new Ref<HTMLDivElement>();
  public loadingSection = new Ref<ScrollLoadingSection>();
  private addedTimeCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
  ) {
    super();
    this.body = eFullPage(
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      assign(this.tabs, new ActivityTabsOption()).body,
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      eSeasonItemContainerRef(this.contentContainer),
      assign(this.loadingSection, new ScrollLoadingSection()).body,
    );
    this.tabs.val.setValue(ActivityTab.WATCH_LATER).on("select", (tab) => {
      switch (tab) {
        case ActivityTab.HISTORY:
          this.emit("viewHistory");
        case ActivityTab.USAGE:
          this.emit("viewUsage");
      }
    });
    this.loadingSection.val
      .addLoadAction(() => this.load())
      .on("loaded", () => this.emit("loaded"))
      .load();
  }

  private async load(): Promise<boolean> {
    let response = await this.serviceClient.send(
      newListFromWatchLaterListRequest({
        limit: WatchLaterPage.LIMIT,
        addedTimeCursor: this.addedTimeCursor,
      }),
    );
    let seasonSummaries = new Array<SeasonSummary>(response.seasonIds.length);
    await Promise.all(
      response.seasonIds.map(async (seasonId, i) => {
        try {
          let { seasonSummary } = await this.serviceClient.send(
            newGetSeasonSummaryRequest({
              seasonId,
            }),
          );
          seasonSummaries[i] = seasonSummary;
        } catch (e) {
          console.error(e);
        }
      }),
    );
    seasonSummaries.forEach((seasonSummary) => {
      if (!seasonSummary) {
        return;
      }
      let item = eSeasonItem(seasonSummary, this.getNowDate());
      item.addEventListener("click", () => {
        this.emit("viewDetails", seasonSummary.seasonId);
      });
      this.contentContainer.val.append(item);
    });
    this.addedTimeCursor = response.addedTimeCursor;
    return Boolean(response.addedTimeCursor);
  }

  public remove(): void {
    this.body.remove();
    this.loadingSection.val.stopLoading();
    this.removeAllListeners();
  }
}
