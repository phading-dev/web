import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { eFullPage, eSeasonItem, eSeasonItemContainer } from "../common/elements";
import { newListSeasonsByRatingRequest } from "@phading/product_service_interface/show/web/consumer/client";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";

export interface ListTopRatedPage {
  on(event: "showDetails", listener: (seasonId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class ListTopRatedPage extends EventEmitter {
  public static create(): ListTopRatedPage {
    return new ListTopRatedPage(SERVICE_CLIENT);
  }

  private static LIMIT = 10;

  public body: HTMLElement;
  private contentContainer = new Ref<HTMLDivElement>();
  public loadingSection = new Ref<ScrollLoadingSection>();
  private ratingCursor: number;
  private createdTimeCursor: number;

  public constructor(private serviceClient: WebServiceClient) {
    super();
    this.body = eFullPage(
      eSeasonItemContainer(LOCALIZED_TEXT.topRatedTitle, this.contentContainer),
      assign(this.loadingSection, new ScrollLoadingSection()).body,
    );
    this.loadingSection.val.startLoading(() => this.load());

    this.loadingSection.val.on("loaded", () => this.emit("loaded"));
  }

  private async load(): Promise<boolean> {
    let response = await this.serviceClient.send(
      newListSeasonsByRatingRequest({
        limit: ListTopRatedPage.LIMIT,
        ratingCursor: this.ratingCursor,
        createdTimeCursor: this.createdTimeCursor,
      }),
    );
    response.seasons.forEach((season) => {
      let item = eSeasonItem(season);
      item.addEventListener("click", () => {
        this.emit("showDetails", season.seasonId);
      });
      this.contentContainer.val.append(item);
    });

    this.ratingCursor = response.ratingCursor;
    this.createdTimeCursor = response.createdTimeCursor;
    return Boolean(response.ratingCursor);
  }

  public remove(): void {
    this.body.remove();
  }
}
