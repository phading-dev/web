import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { SCHEME } from "../../common/color_scheme";
import {
  createAccountIcon,
  createHistogramIcon,
  createListIcon,
  createPlusIcon,
} from "../../common/icons";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import {
  eBottomNavigationBarRef,
  eNavigationItemRef,
} from "../../common/navigation_bar";
import { TabSwitcher } from "../../common/page_navigator";
import { FONT_L } from "../../common/sizes";
import { CreateSeasonPage } from "./create_season_page/body";
import { ListPage } from "./list_page/body";
import { SearchPage } from "./search_page/body";
import { SeasonDetailsPage } from "./season_details_page/body";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { PublisherPageRl } from "@phading/web_interface/main/publisher/page";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface PublisherPage {
  on(event: "pushRl", listener: (rl: PublisherPageRl) => void): this;
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
  public createSeasonButton = new Ref<HTMLDivElement>();
  public statsButton = new Ref<HTMLDivElement>();
  public accountButton = new Ref<HTMLDivElement>();

  private pageSwitcher = new TabSwitcher();
  public createSeasonPage: CreateSeasonPage;
  public listPage: ListPage;
  public searchPage: SearchPage;
  public seasonDetailsPage: SeasonDetailsPage;
  public usagePage: HTMLDivElement;
  private lastListRl: PublisherPageRl;

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
      this.pushRl({
        list: {
          seasonState: SeasonState.PUBLISHED,
        },
      });
    });
    this.createSeasonButton.val.addEventListener("click", () => {
      this.pushRl({
        create: {},
      });
    });
    this.statsButton.val.addEventListener("click", () => {
      this.pushRl({
        usage: {},
      });
    });
    this.accountButton.val.addEventListener("click", () =>
      this.emit("goToAccount"),
    );
  }

  private pushRl(rl: PublisherPageRl): void {
    this.emit("pushRl", rl);
    this.applyRl(rl);
  }

  public applyRl(rl?: PublisherPageRl): this {
    if (!rl) {
      rl = {};
    }
    if (rl.search && (!rl.search.seasonState || !rl.search.query)) {
      rl.search = undefined;
    }
    if (
      !rl.create &&
      !rl.list &&
      !rl.search &&
      !rl.seasonDetails &&
      !rl.usage
    ) {
      rl.list = {};
    }
    if (rl.list && !rl.list.seasonState) {
      rl.list.seasonState = SeasonState.PUBLISHED;
    }

    if (
      rl.list &&
      (!this.listPage || this.listPage.seasonState !== rl.list.seasonState)
    ) {
      this.pageSwitcher.goTo(
        () => this.addListPage(rl.list.seasonState),
        () => this.removeListPage(),
      );
    } else if (
      rl.search &&
      (!this.searchPage ||
        this.searchPage.seasonState !== rl.search.seasonState ||
        (this.searchPage.query ?? "") !== (rl.search.query ?? ""))
    ) {
      this.pageSwitcher.goTo(
        () => this.addSearchPage(rl.search.seasonState, rl.search.query),
        () => this.removeSearchPage(),
      );
    } else if (rl.create && !this.createSeasonPage) {
      this.pageSwitcher.goTo(
        () => this.addCreateSeasonPage(),
        () => this.removeCreateSeasonPage(),
      );
    } else if (
      rl.seasonDetails &&
      (!this.seasonDetailsPage ||
        this.seasonDetailsPage.seasonId !== rl.seasonDetails.seasonId)
    ) {
      this.pageSwitcher.goTo(
        () => this.addSeasonDetailsPage(rl.seasonDetails.seasonId),
        () => this.removeSeasonDetailsPage(),
      );
    } else if (rl.usage && !this.usagePage) {
      this.pageSwitcher.goTo(
        () => this.addUsagePage(),
        () => this.removeUsagePage(),
      );
    }
    if (rl.list || rl.search) {
      this.lastListRl = rl;
    }
    return this;
  }

  private addCreateSeasonPage(): void {
    this.createSeasonPage = this.createCreateSeasonPage().on(
      "viewSeason",
      (seasonId: string) => {
        this.pushRl({
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
      .on("viewSeason", (seasonId: string) => {
        this.pushRl({
          seasonDetails: {
            seasonId,
          },
        });
      })
      .on("listSeasons", (seasonState) => {
        this.pushRl({
          list: {
            seasonState,
          },
        });
      })
      .on("searchSeasons", (seasonState, query) => {
        this.pushRl({
          search: {
            seasonState,
            query,
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
      .on("viewSeason", (seasonId: string) => {
        this.pushRl({
          seasonDetails: {
            seasonId,
          },
        });
      })
      .on("searchSeasons", (seasonState, query) => {
        this.pushRl({
          search: {
            seasonState,
            query,
          },
        });
      })
      .on("listSeasons", (seasonState) => {
        this.pushRl({
          list: {
            seasonState,
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
      this.pushRl(this.lastListRl);
    });
  }

  private removeSeasonDetailsPage(): void {
    this.seasonDetailsPage.remove();
    this.seasonDetailsPage = undefined;
  }

  private addUsagePage(): void {
    this.usagePage = E.div(
      {
        style: `font-size: ${FONT_L}rem; color: ${SCHEME.neutral0};`,
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
    this.removeAllListeners();
  }
}
