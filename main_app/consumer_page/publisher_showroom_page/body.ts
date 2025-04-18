import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { ENV_VARS } from "../../../env_vars";
import {
  eFullPage,
  ePublisherContextItem,
  eSeasonItem,
  eSeasonItemContainer,
} from "../common/elements";
import { newListSeasonsByRecentPremiereTimeAndPublisherRequest } from "@phading/product_service_interface/show/web/consumer/client";
import { newGetAccountDetailsRequest } from "@phading/user_service_interface/web/third_person/client";
import { Ref, assign } from "@selfage/ref";
import { TzDate } from "@selfage/tz_date";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";

export interface PublisherShowroomPage {
  on(event: "showDetails", listener: (seasonId: string) => void): this;
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
    private accountId: string,
  ) {
    super();
    this.body = eFullPage();
    this.loadPublisher();
  }

  private async loadPublisher(): Promise<void> {
    let response = await this.serviceClient.send(
      newGetAccountDetailsRequest({
        accountId: this.accountId,
      }),
    );
    this.body.append(
      ePublisherContextItem(response.account, `width: 100%;`),
      eSeasonItemContainer(
        LOCALIZED_TEXT.recentPremieresTitle,
        this.contentContainer,
      ),
      assign(this.loadingSection, new ScrollLoadingSection()).body,
    );
    this.loadingSection.val.startLoading(() => this.load());
    this.loadingSection.val.on("loaded", () => this.emit("loaded"));
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
    let date = TzDate.fromDate(
      this.getNowDate(),
      ENV_VARS.timezoneNegativeOffset,
    ).toLocalDateISOString();
    response.seasons.forEach((season) => {
      let item = eSeasonItem(season, date);
      item.addEventListener("click", () => {
        this.emit("showDetails", season.seasonId);
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
  }
}
