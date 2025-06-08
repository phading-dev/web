import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import {
  eFullItemsPage,
  ePublisherItem,
  ePublisherItemContainerRef,
} from "../common/elements";
import { SearchInput } from "../common/search_input";
import { newSearchPublishersRequest } from "@phading/user_service_interface/web/third_person/client";
import { SearchTarget } from "@phading/web_interface/main/consumer/page";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";

export interface SearchPublishersPage {
  on(
    event: "search",
    listener: (searchTarget: SearchTarget, query: string) => void,
  ): this;
  on(event: "showroom", listener: (publisherId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class SearchPublishersPage extends EventEmitter {
  public static create(query: string): SearchPublishersPage {
    return new SearchPublishersPage(SERVICE_CLIENT, query);
  }

  private static LIMIT = 10;

  public body: HTMLElement;
  public searchInput = new Ref<SearchInput>();
  private contentContainer = new Ref<HTMLDivElement>();
  public loadingSection = new Ref<ScrollLoadingSection>();
  private scoreCursor: number;
  private createdTimeCursor: number;

  public constructor(
    private serviceClient: WebServiceClient,
    public query: string,
  ) {
    super();
    this.body = eFullItemsPage(
      assign(this.searchInput, new SearchInput(SearchTarget.PUBLISHER, query))
        .body,
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      ePublisherItemContainerRef(this.contentContainer),
      assign(this.loadingSection, new ScrollLoadingSection()).body,
    );
    this.searchInput.val.on("search", (searchTarget, query) =>
      this.emit("search", searchTarget, query),
    );

    this.loadingSection.val.addLoadAction(() => this.load());
    this.loadingSection.val.on("loaded", () => this.emit("loaded"));
    this.loadingSection.val.load();
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
    this.loadingSection.val.stopLoading();
    this.removeAllListeners();
  }
}
