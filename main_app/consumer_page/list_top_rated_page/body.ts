import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../common/navigation_bar";
import { eFullPage } from "../../../common/page_elements";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { GAP_1X } from "../../../common/sizes";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import {
  eContainerTitle,
  eSeasonItem,
  eSeasonItemContainerRef,
} from "../common/elements";
import { newListSeasonsByRatingRequest } from "@phading/product_service_interface/show/web/public/client";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";

export interface ListTopRatedPage {
  on(event: "viewDetails", listener: (seasonId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class ListTopRatedPage extends EventEmitter {
  public static create(): ListTopRatedPage {
    return new ListTopRatedPage(SERVICE_CLIENT, () => new Date());
  }

  private static LIMIT = 10;

  public body: HTMLElement;
  private contentContainer = new Ref<HTMLDivElement>();
  public loadingSection = new Ref<ScrollLoadingSection>();
  private ratingCursor: number;
  private createdTimeCursor: number;

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
      eContainerTitle(LOCALIZED_TEXT.topRatedTitle),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      eSeasonItemContainerRef(this.contentContainer),
      assign(this.loadingSection, new ScrollLoadingSection()).body,
    );
    this.loadingSection.val
      .setLoadAction(() => this.load())
      .on("loaded", () => this.emit("loaded"))
      .load();
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
      let item = eSeasonItem(season, this.getNowDate());
      item.addEventListener("click", () => {
        this.emit("viewDetails", season.seasonId);
      });
      this.contentContainer.val.append(item);
    });

    this.ratingCursor = response.ratingCursor;
    this.createdTimeCursor = response.createdTimeCursor;
    return Boolean(response.ratingCursor);
  }

  public remove(): void {
    this.body.remove();
    this.loadingSection.val.stopLoading();
    this.removeAllListeners();
  }
}
