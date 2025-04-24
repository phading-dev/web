import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import {
  eFullItemsPage,
  eSeasonItem,
  eSeasonItemContainer,
} from "../common/elements";
import { newSearchSeasonsRequest } from "@phading/product_service_interface/show/web/consumer/client";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";

export interface SearchSeasonsPage {
  on(event: "showDetails", listener: (seasonId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class SearchSeasonsPage extends EventEmitter {
  public static create(query: string): SearchSeasonsPage {
    return new SearchSeasonsPage(SERVICE_CLIENT, () => new Date(), query);
  }

  private static LIMIT = 10;

  public body: HTMLElement;
  private contentContainer = new Ref<HTMLDivElement>();
  public loadingSection = new Ref<ScrollLoadingSection>();
  private scoreCursor: number;
  private createdTimeCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    private query: string,
  ) {
    super();
    this.body = eFullItemsPage(
      eSeasonItemContainer(
        `${LOCALIZED_TEXT.searchResultTitle[0]}${this.query}${LOCALIZED_TEXT.searchResultTitle[1]}`,
        this.contentContainer,
      ),
      assign(this.loadingSection, new ScrollLoadingSection()).body,
    );
    this.loadingSection.val.startLoading(() => this.load());

    this.loadingSection.val.on("loaded", () => this.emit("loaded"));
  }

  private async load(): Promise<boolean> {
    let response = await this.serviceClient.send(
      newSearchSeasonsRequest({
        limit: SearchSeasonsPage.LIMIT,
        query: this.query,
        scoreCursor: this.scoreCursor,
        createdTimeCursor: this.createdTimeCursor,
      }),
    );
    response.seasons.forEach((season) => {
      let item = eSeasonItem(season, this.getNowDate());
      item.addEventListener("click", () => {
        this.emit("showDetails", season.seasonId);
      });
      this.contentContainer.val.append(item);
    });

    this.scoreCursor = response.scoreCursor;
    this.createdTimeCursor = response.createdTimeCursor;
    return Boolean(response.scoreCursor);
  }

  public remove(): void {
    this.body.remove();
    this.loadingSection.val.stopLoading();
  }
}
