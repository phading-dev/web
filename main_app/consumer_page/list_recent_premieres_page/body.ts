import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { ENV_VARS } from "../../../env_vars";
import {
  eFullPage,
  eSeasonItem,
  eSeasonItemContainer,
} from "../common/elements";
import { newListSeasonsByRecentPremiereTimeRequest } from "@phading/product_service_interface/show/web/consumer/client";
import { Ref, assign } from "@selfage/ref";
import { TzDate } from "@selfage/tz_date";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";

export interface ListRecentPremieresPage {
  on(event: "showDetails", listener: (seasonId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class ListRecentPremieresPage extends EventEmitter {
  public static create(): ListRecentPremieresPage {
    return new ListRecentPremieresPage(SERVICE_CLIENT, () => new Date());
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
  ) {
    super();
    this.body = eFullPage(
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
      newListSeasonsByRecentPremiereTimeRequest({
        limit: ListRecentPremieresPage.LIMIT,
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
    this.loadingSection.val.stopLoading();
  }
}
