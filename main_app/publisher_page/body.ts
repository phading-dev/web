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
import { CreateSeasonPage } from "./create_season_page/body";
import { EpisodeDetailsPage } from "./episode_details_page/body";
import { ListPage } from "./list_page/body";
import { SearchPage } from "./search_page/body";
import { SeasonDetailsPage } from "./season_details_page/body";
import { StatsPage } from "./stats_page/body";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { PublisherPageRl } from "@phading/web_interface/main/publisher/page";
import { Ref } from "@selfage/ref";

export interface PublisherPage {
  on(event: "pushRl", listener: (rl: PublisherPageRl) => void): this;
  on(event: "goToAccount", listener: () => void): this;
}

export class PublisherPage extends EventEmitter {
  public static create(appendBodies: AddBodiesFn): PublisherPage {
    return new PublisherPage(
      CreateSeasonPage.create,
      EpisodeDetailsPage.create,
      ListPage.create,
      SearchPage.create,
      SeasonDetailsPage.create,
      StatsPage.create,
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
  public episodeDetailsPage: EpisodeDetailsPage;
  public listPage: ListPage;
  public searchPage: SearchPage;
  public seasonDetailsPage: SeasonDetailsPage;
  public statsPage: StatsPage;
  private lastListRl: PublisherPageRl;

  public constructor(
    private createCreateSeasonPage: typeof CreateSeasonPage.create,
    private createEpisodeDetailsPage: typeof EpisodeDetailsPage.create,
    private createListPage: typeof ListPage.create,
    private createSearchPage: typeof SearchPage.create,
    private createSeasonDetailsPage: typeof SeasonDetailsPage.create,
    private createStatsPage: typeof StatsPage.create,
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
        stats: {},
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
    if (rl.search && !rl.search.query) {
      rl.search = undefined;
    }
    if (
      !rl.create &&
      !rl.list &&
      !rl.search &&
      !rl.seasonDetails &&
      !rl.episodeDetails &&
      !rl.stats
    ) {
      rl.list = {};
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
        () => this.addSearchPage(rl.search.query, rl.search.seasonState),
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
    } else if (
      rl.episodeDetails &&
      (!this.episodeDetailsPage ||
        this.episodeDetailsPage.seasonId !== rl.episodeDetails.seasonId ||
        this.episodeDetailsPage.episodeId !== rl.episodeDetails.episodeId)
    ) {
      this.pageSwitcher.goTo(
        () =>
          this.addEpisodeDetailsPage(
            rl.episodeDetails.seasonId,
            rl.episodeDetails.episodeId,
          ),
        () => this.removeEpisodeDetailsPage(),
      );
    } else if (rl.stats && !this.statsPage) {
      this.pageSwitcher.goTo(
        () => this.addStatsPage(),
        () => this.removeStatsPage(),
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

  private addEpisodeDetailsPage(seasonId: string, episodeId: string): void {
    this.episodeDetailsPage = this.createEpisodeDetailsPage(
      this.appendBodies,
      seasonId,
      episodeId,
    ).on("viewSeason", (seasonId) =>
      this.pushRl({
        seasonDetails: {
          seasonId,
        },
      }),
    );
  }

  private removeEpisodeDetailsPage(): void {
    this.episodeDetailsPage.remove();
    this.episodeDetailsPage = undefined;
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
      .on("searchSeasons", (query, seasonState) => {
        this.pushRl({
          search: {
            query,
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

  private addSearchPage(query: string, seasonState: SeasonState): void {
    this.searchPage = this.createSearchPage(query, seasonState)
      .on("viewSeason", (seasonId: string) => {
        this.pushRl({
          seasonDetails: {
            seasonId,
          },
        });
      })
      .on("searchSeasons", (query, seasonState) => {
        this.pushRl({
          search: {
            query,
            seasonState,
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
    )
      .on("back", () => {
        this.pushRl(this.lastListRl);
      })
      .on("viewEpisode", (seasonId, episodeId) =>
        this.pushRl({
          episodeDetails: {
            seasonId,
            episodeId,
          },
        }),
      );
  }

  private removeSeasonDetailsPage(): void {
    this.seasonDetailsPage.remove();
    this.seasonDetailsPage = undefined;
  }

  private addStatsPage(): void {
    this.statsPage = this.createStatsPage();
    this.appendBodies(this.statsPage.body);
  }

  private removeStatsPage(): void {
    this.statsPage.remove();
    this.statsPage = undefined;
  }

  public remove(): void {
    this.navigationBar.val.remove();
    this.pageSwitcher.remove();
    this.removeAllListeners();
  }
}
