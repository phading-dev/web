import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import {
  eFullItemsPage,
  eSeasonItem,
  eSeasonItemContainer,
} from "../common/elements";
import { newListFromWatchLaterListRequest } from "@phading/play_activity_service_interface/show/web/client";
import { newGetSeasonSummaryRequest } from "@phading/product_service_interface/show/web/consumer/client";
import { SeasonSummary } from "@phading/product_service_interface/show/web/consumer/info";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";

export interface WatchLaterPage {
  on(event: "showDetails", listener: (seasonId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class WatchLaterPage extends EventEmitter {
  public static create(): WatchLaterPage {
    return new WatchLaterPage(SERVICE_CLIENT, () => new Date());
  }

  private static LIMIT = 10;

  public body: HTMLDivElement;
  private contentContainer = new Ref<HTMLDivElement>();
  public loadingSection = new Ref<ScrollLoadingSection>();
  private addedTimeCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
  ) {
    super();
    this.body = eFullItemsPage(
      eSeasonItemContainer(
        LOCALIZED_TEXT.watchLaterTitle,
        this.contentContainer,
      ),
      assign(this.loadingSection, new ScrollLoadingSection()).body,
    );
    this.loadingSection.val.startLoading(() => this.load());

    this.loadingSection.val.on("loaded", () => this.emit("loaded"));
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
        this.emit("showDetails", seasonSummary.seasonId);
      });
      this.contentContainer.val.append(item);
    });
    this.addedTimeCursor = response.addedTimeCursor;
    return Boolean(response.addedTimeCursor);
  }

  public remove(): void {
    this.body.remove();
  }
}
