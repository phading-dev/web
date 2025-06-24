import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../common/navigation_bar";
import { eFullPage } from "../../../common/page_elements";
import { ScrollLoadingSection } from "../../../common/scroll_loading_section";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { eSeasonItem, eSeasonItemContainerRef } from "../common/elements";
import { SearchInput } from "../common/search_input";
import { newSearchSeasonsRequest } from "@phading/product_service_interface/show/web/consumer/client";
import { SearchTarget } from "@phading/web_interface/main/consumer/page";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { EventEmitter } from "events";

export interface SearchSeasonsPage {
  on(
    event: "search",
    listener: (searchTarget: SearchTarget, query: string) => void,
  ): this;
  on(event: "viewDetails", listener: (seasonId: string) => void): this;
  on(event: "loaded", listener: () => void): this;
}

export class SearchSeasonsPage extends EventEmitter {
  public static create(query: string): SearchSeasonsPage {
    return new SearchSeasonsPage(SERVICE_CLIENT, () => new Date(), query);
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
    private getNowDate: () => Date,
    public query?: string,
  ) {
    super();
    this.body = eFullPage(
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      assign(this.searchInput, new SearchInput(SearchTarget.SEASON, query))
        .body,
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      eSeasonItemContainerRef(this.contentContainer),
      ...(query
        ? [assign(this.loadingSection, new ScrollLoadingSection()).body]
        : []),
    );
    this.searchInput.val.on("search", (searchTarget, query) =>
      this.emit("search", searchTarget, query),
    );

    this.loadingSection.val
      ?.addLoadAction(() => this.load())
      .on("loaded", () => this.emit("loaded"))
      .load();
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
        this.emit("viewDetails", season.seasonId);
      });
      this.contentContainer.val.append(item);
    });

    this.scoreCursor = response.scoreCursor;
    this.createdTimeCursor = response.createdTimeCursor;
    return Boolean(response.scoreCursor);
  }

  public remove(): void {
    this.body.remove();
    this.loadingSection.val?.stopLoading();
    this.removeAllListeners();
  }
}
