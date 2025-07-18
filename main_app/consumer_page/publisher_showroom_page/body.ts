import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../common/navigation_bar";
import { eFullPage } from "../../../common/page_elements";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import {
  eContainerTitle,
  ePublisherContextItem,
  eSeasonItem,
  eSeasonItemContainerRef,
} from "../common/elements";
import { newListSeasonsByRecentPremiereTimeAndPublisherRequest } from "@phading/product_service_interface/show/web/public/client";
import { newGetAccountDetailsRequest } from "@phading/user_service_interface/web/third_person/client";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";

export interface PublisherShowroomPage {
  on(event: "viewDetails", listener: (seasonId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class PublisherShowroomPage extends EventEmitter {
  public static create(accountId: string): PublisherShowroomPage {
    return new PublisherShowroomPage(
      SERVICE_CLIENT,
      () => new Date(),
      accountId,
    );
  }

  private static LIMIT = 10;

  public body: HTMLElement;
  private contentContainer = new Ref<HTMLDivElement>();
  public loadingSection = new Ref<ScrollLoadingSection>();
  private premiereTimeCursor: number;
  private createdTimeCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    public accountId: string,
  ) {
    super();
    this.body = eFullPage(
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    );
    this.loadPublisher();
  }

  private async loadPublisher(): Promise<void> {
    let response = await this.serviceClient.send(
      newGetAccountDetailsRequest({
        accountId: this.accountId,
      }),
    );
    this.body.append(
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      ePublisherContextItem(response.account),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      eContainerTitle(LOCALIZED_TEXT.recentPremieresTitle),
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      eSeasonItemContainerRef(this.contentContainer),
      assign(this.loadingSection, new ScrollLoadingSection()).body,
    );
    this.loadingSection.val
      .addLoadAction(() => this.load())
      .on("loaded", () => this.emit("loaded"))
      .load();
  }

  private async load(): Promise<boolean> {
    let response = await this.serviceClient.send(
      newListSeasonsByRecentPremiereTimeAndPublisherRequest({
        publisherId: this.accountId,
        limit: PublisherShowroomPage.LIMIT,
        premiereTimeCursor: this.premiereTimeCursor,
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

    this.premiereTimeCursor = response.premiereTimeCursor;
    this.createdTimeCursor = response.createdTimeCursor;
    return Boolean(response.premiereTimeCursor);
  }

  public remove(): void {
    this.body.remove();
    this.loadingSection.val?.stopLoading();
    this.removeAllListeners();
  }
}
