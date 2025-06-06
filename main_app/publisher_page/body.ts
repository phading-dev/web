import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { SCHEME } from "../../common/color_scheme";
import {
  createAccountIcon,
  createHistogramIcon,
  createListIcon,
  createPlusIcon,
  createSearchIcon,
} from "../../common/icons";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import {
  eBottomNavigationBarRef,
  eNavigationItemRef,
} from "../../common/navigation_bar";
import { TabSwitcher } from "../../common/page_navigator";
import { PAGE_CENTER_CARD_BACKGROUND_STYLE } from "../../common/page_style";
import { FONT_L } from "../../common/sizes";
import { CreateSeasonPage } from "./create_season_page/body";
import { ListPage } from "./list_page/body";
import { SearchPage } from "./search_page/body";
import { SeasonDetailsPage } from "./season_details_page/body";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { PublisherPage as PublisherPageUrl } from "@phading/web_interface/main/publisher/page";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface PublisherPage {
  on(event: "newUrl", listener: (url: PublisherPageUrl) => void): this;
  on(event: "goToAccount", listener: () => void): this;
}

export class PublisherPage extends EventEmitter {
  public static create(appendBodies: AddBodiesFn): PublisherPage {
    return new PublisherPage(
      CreateSeasonPage.create,
      ListPage.create,
      SearchPage.create,
      SeasonDetailsPage.create,
      appendBodies,
    );
  }

  private navigationBar = new Ref<HTMLDivElement>();
  public listButton = new Ref<HTMLDivElement>();
  public searchButton = new Ref<HTMLDivElement>();
  public createSeasonButton = new Ref<HTMLDivElement>();
  public statsButton = new Ref<HTMLDivElement>();
  public accountButton = new Ref<HTMLDivElement>();

  private pageSwitcher = new TabSwitcher();
  public createSeasonPage: CreateSeasonPage;
  public listPage: ListPage;
  public searchPage: SearchPage;
  public seasonDetailsPage: SeasonDetailsPage;
  public usagePage: HTMLDivElement;
  private lastListUrl: PublisherPageUrl;

  public constructor(
    private createCreateSeasonPage: typeof CreateSeasonPage.create,
    private createListPage: typeof ListPage.create,
    private createSearchPage: typeof SearchPage.create,
    private createSeasonDetailsPage: typeof SeasonDetailsPage.create,
    private appendBodies: AddBodiesFn,
  ) {
    super();
    appendBodies(
      eBottomNavigationBarRef(
        this.navigationBar,
        eNavigationItemRef(
          this.listButton,
          createListIcon(SCHEME.neutral1),
          LOCALIZED_TEXT.catalogLabel,
        ),
        eNavigationItemRef(
          this.searchButton,
          createSearchIcon(SCHEME.neutral1),
          LOCALIZED_TEXT.searchLabel,
        ),
        eNavigationItemRef(
          this.createSeasonButton,
          createPlusIcon(SCHEME.neutral1),
          LOCALIZED_TEXT.createSeasonLabel,
        ),
        eNavigationItemRef(
          this.statsButton,
          createHistogramIcon(SCHEME.neutral1),
          LOCALIZED_TEXT.statsLabel,
        ),
        eNavigationItemRef(
          this.accountButton,
          createAccountIcon(SCHEME.neutral1),
          LOCALIZED_TEXT.accountLabel,
        ),
      ),
    );
    this.listButton.val.addEventListener("click", () => {
      this.newUrl({
        list: {
          seasonState: SeasonState.PUBLISHED,
        },
      });
    });
    this.searchButton.val.addEventListener("click", () => {
      this.newUrl({
        search: {
          seasonState: SeasonState.PUBLISHED,
          query: "",
        },
      });
    });
    this.createSeasonButton.val.addEventListener("click", () => {
      this.newUrl({
        create: {},
      });
    });
    this.statsButton.val.addEventListener("click", () => {
      this.newUrl({
        usage: {},
      });
    });
    this.accountButton.val.addEventListener("click", () =>
      this.emit("goToAccount"),
    );
  }

  private newUrl(newUrl: PublisherPageUrl): void {
    this.emit("newUrl", newUrl);
    this.applyUrl(newUrl);
  }

  public applyUrl(newUrl?: PublisherPageUrl): this {
    if (!newUrl) {
      newUrl = {};
    }
    if (newUrl.search && !newUrl.search.seasonState) {
      newUrl.search = undefined;
    }
    if (
      !newUrl.create &&
      !newUrl.list &&
      !newUrl.search &&
      !newUrl.seasonDetails &&
      !newUrl.usage
    ) {
      newUrl.list = {};
    }
    if (newUrl.list && !newUrl.list.seasonState) {
      newUrl.list.seasonState = SeasonState.PUBLISHED;
    }

    if (
      newUrl.list &&
      (!this.listPage || this.listPage.seasonState !== newUrl.list.seasonState)
    ) {
      this.pageSwitcher.goTo(
        () => this.addListPage(newUrl.list.seasonState),
        () => this.removeListPage(),
      );
    } else if (
      newUrl.search &&
      (!this.searchPage ||
        this.searchPage.seasonState !== newUrl.search.seasonState ||
        (this.searchPage.query ?? "") !== (newUrl.search.query ?? ""))
    ) {
      this.pageSwitcher.goTo(
        () =>
          this.addSearchPage(newUrl.search.seasonState, newUrl.search.query),
        () => this.removeSearchPage(),
      );
    } else if (newUrl.create && !this.createSeasonPage) {
      this.pageSwitcher.goTo(
        () => this.addCreateSeasonPage(),
        () => this.removeCreateSeasonPage(),
      );
    } else if (
      newUrl.seasonDetails &&
      (!this.seasonDetailsPage ||
        this.seasonDetailsPage.seasonId !== newUrl.seasonDetails.seasonId)
    ) {
      this.pageSwitcher.goTo(
        () => this.addSeasonDetailsPage(newUrl.seasonDetails.seasonId),
        () => this.removeSeasonDetailsPage(),
      );
    } else if (newUrl.usage && !this.usagePage) {
      this.pageSwitcher.goTo(
        () => this.addUsagePage(),
        () => this.removeUsagePage(),
      );
    }
    if (newUrl.list || newUrl.search) {
      this.lastListUrl = newUrl;
    }
    return this;
  }

  private addCreateSeasonPage(): void {
    this.createSeasonPage = this.createCreateSeasonPage().on(
      "showSeason",
      (seasonId: string) => {
        this.newUrl({
          seasonDetails: {
            seasonId,
          },
        });
      },
    );
    this.appendBodies(this.createSeasonPage.body);
  }

  private removeCreateSeasonPage(): void {
    this.createSeasonPage.remove();
    this.createSeasonPage = undefined;
  }

  private addListPage(seasonState: SeasonState): void {
    this.listPage = this.createListPage(seasonState)
      .on("showSeason", (seasonId: string) => {
        this.newUrl({
          seasonDetails: {
            seasonId,
          },
        });
      })
      .on("listSeasons", (seasonState) => {
        this.newUrl({
          list: {
            seasonState,
          },
        });
      });
    this.appendBodies(this.listPage.body);
  }

  private removeListPage(): void {
    this.listPage.remove();
    this.listPage = undefined;
  }

  private addSearchPage(seasonState: SeasonState, query: string): void {
    this.searchPage = this.createSearchPage(seasonState, query)
      .on("showSeason", (seasonId: string) => {
        this.newUrl({
          seasonDetails: {
            seasonId,
          },
        });
      })
      .on("searchSeasons", (seasonState, query) => {
        this.newUrl({
          search: {
            seasonState,
            query,
          },
        });
      });
    this.appendBodies(this.searchPage.body);
  }

  private removeSearchPage(): void {
    this.searchPage.remove();
    this.searchPage = undefined;
  }

  private addSeasonDetailsPage(seasonId: string): void {
    this.seasonDetailsPage = this.createSeasonDetailsPage(
      this.appendBodies,
      seasonId,
    ).on("back", () => {
      this.newUrl(this.lastListUrl);
    });
  }

  private removeSeasonDetailsPage(): void {
    this.seasonDetailsPage.remove();
    this.seasonDetailsPage = undefined;
  }

  private addUsagePage(): void {
    this.usagePage = E.div(
      {
        style: `${PAGE_CENTER_CARD_BACKGROUND_STYLE} font-size: ${FONT_L}rem; color: ${SCHEME.neutral0};`,
      },
      E.text("Upcoming"),
    );
    this.appendBodies(this.usagePage);
  }

  private removeUsagePage(): void {
    this.usagePage.remove();
    this.usagePage = undefined;
  }

  public remove(): void {
    this.navigationBar.val.remove();
    this.pageSwitcher.remove();
  }
}
