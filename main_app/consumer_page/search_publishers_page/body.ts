import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import {
  eFullPage,
  ePublisherItem,
  ePublisherItemContainer,
} from "../common/elements";
import { newSearchPublishersRequest } from "@phading/user_service_interface/web/third_person/client";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";

export interface SearchPublishers {
  on(event: "showroom", listener: (publisherId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class SearchPublishersPage extends EventEmitter {
  public static create(query: string): SearchPublishers {
    return new SearchPublishersPage(SERVICE_CLIENT, query);
  }

  private static LIMIT = 10;

  public body: HTMLElement;
  private contentContainer = new Ref<HTMLDivElement>();
  public loadingSection = new Ref<ScrollLoadingSection>();
  private scoreCursor: number;
  private createdTimeCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    private query: string,
  ) {
    super();
    this.body = eFullPage(
      ePublisherItemContainer(
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
      newSearchPublishersRequest({
        limit: SearchPublishersPage.LIMIT,
        query: this.query,
        scoreCursor: this.scoreCursor,
        createdTimeCursor: this.createdTimeCursor,
      }),
    );
    response.accounts.forEach((account) => {
      let item = ePublisherItem(account);
      item.addEventListener("click", () => {
        this.emit("showroom", account.accountId);
      });
      this.contentContainer.val.append(item);
    });

    this.scoreCursor = response.scoreCursor;
    this.createdTimeCursor = response.createdTimeCursor;
    return Boolean(response.scoreCursor);
  }

  public remove(): void {
    this.body.remove();
  }
}
