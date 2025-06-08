import EventEmitter = require("events");
import { AddBodiesFn } from "../../common/add_bodies_fn";
import { SCHEME } from "../../common/color_scheme";
import {
  createAccountIcon,
  createHistoryIcon,
  createHomeIcon,
  createSearchIcon,
} from "../../common/icons";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import {
  eBottomNavigationBarRef,
  eNavigationItemRef,
} from "../../common/navigation_bar";
import { TabSwitcher } from "../../common/page_navigator";
import { HistoryPage } from "./history_page/body";
import { ListRecentPremieresPage } from "./list_recent_premieres_page/body";
import { ListTopRatedPage } from "./list_top_rated_page/body";
import { MultiSectionPage } from "./multi_section_page/body";
import { PlayPage } from "./play_page/body";
import { PublisherShowroomPage } from "./publisher_showroom_page/body";
import { SearchPublishersPage } from "./search_publishers_page/body";
import { SearchSeasonsPage } from "./search_seasons_page/body";
import { SeasonDetailsPage } from "./season_details_page/body";
import { UsagePage } from "./usage_page/body";
import { WatchLaterPage } from "./watch_later_page/body";
import {
  ConsumerPageRl,
  SearchTarget,
} from "@phading/web_interface/main/consumer/page";
import { Ref } from "@selfage/ref";

export interface ConsumerPage {
  on(event: "pushRl", listener: (rl: ConsumerPageRl) => void): this;
  on(event: "goToAccount", listener: () => void): this;
}

export class ConsumerPage extends EventEmitter {
  public static create(appendBodies: AddBodiesFn): ConsumerPage {
    return new ConsumerPage(
      HistoryPage.create,
      ListRecentPremieresPage.create,
      ListTopRatedPage.create,
      MultiSectionPage.create,
      PlayPage.create,
      PublisherShowroomPage.create,
      SearchPublishersPage.create,
      SearchSeasonsPage.create,
      SeasonDetailsPage.create,
      UsagePage.create,
      WatchLaterPage.create,
      appendBodies,
    );
  }

  private navigationBar = new Ref<HTMLDivElement>();
  public homeButton = new Ref<HTMLDivElement>();
  public exploreButton = new Ref<HTMLDivElement>();
  public activityButton = new Ref<HTMLDivElement>();
  public accountButton = new Ref<HTMLDivElement>();

  private pageSwitcher = new TabSwitcher();
  public historyPage: HistoryPage;
  public listRecentPremieresPage: ListRecentPremieresPage;
  public listTopRatedPage: ListTopRatedPage;
  public multiSectionPage: MultiSectionPage;
  public playPage: PlayPage;
  public publisherShowroomPage: PublisherShowroomPage;
  public searchPublishersPage: SearchPublishersPage;
  public searchSeasonsPage: SearchSeasonsPage;
  public seasonDetailsPage: SeasonDetailsPage;
  public usagePage: UsagePage;
  public watchLaterPage: WatchLaterPage;
  private lastListRl: ConsumerPageRl;

  public constructor(
    private createHistoryPage: typeof HistoryPage.create,
    private createListRecentPremieresPage: typeof ListRecentPremieresPage.create,
    private createListTopRatedPage: typeof ListTopRatedPage.create,
    private createMultiSectionPage: typeof MultiSectionPage.create,
    private createPlayPage: typeof PlayPage.create,
    private createPublisherShowroomPage: typeof PublisherShowroomPage.create,
    private createSearchPublishersPage: typeof SearchPublishersPage.create,
    private createSearchSeasonsPage: typeof SearchSeasonsPage.create,
    private createSeasonDetailsPage: typeof SeasonDetailsPage.create,
    private createUsagePage: typeof UsagePage.create,
    private createWatchLaterPage: typeof WatchLaterPage.create,
    private appendBodies: AddBodiesFn,
  ) {
    super();
    appendBodies(
      eBottomNavigationBarRef(
        this.navigationBar,
        eNavigationItemRef(
          this.homeButton,
          createHomeIcon(SCHEME.neutral1),
          LOCALIZED_TEXT.homeLabel,
        ),
        eNavigationItemRef(
          this.exploreButton,
          createSearchIcon(SCHEME.neutral1),
          LOCALIZED_TEXT.exploreLabel,
        ),
        eNavigationItemRef(
          this.activityButton,
          createHistoryIcon(SCHEME.neutral1),
          LOCALIZED_TEXT.activityLabel,
        ),
        eNavigationItemRef(
          this.accountButton,
          createAccountIcon(SCHEME.neutral1),
          LOCALIZED_TEXT.accountLabel,
        ),
      ),
    );
    this.showNavigationBar();

    this.homeButton.val.addEventListener("click", () => {
      this.pushRl({
        home: {},
      });
    });
    this.exploreButton.val.addEventListener("click", () => {
      this.pushRl({
        search: {
          searchTarget: SearchTarget.SEASON,
        },
      });
    });
    this.activityButton.val.addEventListener("click", () => {
      this.pushRl({
        history: {},
      });
    });
    this.accountButton.val.addEventListener("click", () =>
      this.emit("goToAccount"),
    );
  }

  private showNavigationBar() {
    this.navigationBar.val.style.display = `flex`;
  }

  private hideNavigationBar() {
    this.navigationBar.val.style.display = `none`;
  }

  private pushRl(rl: ConsumerPageRl): void {
    this.emit("pushRl", rl);
    this.applyRl(rl);
  }

  public applyRl(rl?: ConsumerPageRl): this {
    if (!rl) {
      rl = {};
    }
    if (rl.search && !rl.search.searchTarget) {
      rl.search = undefined;
    }
    if (
      !rl.home &&
      !rl.listTopRated &&
      !rl.listRecentPremieres &&
      !rl.search &&
      !rl.seasonDetails &&
      !rl.play &&
      !rl.publisherShowroom &&
      !rl.history &&
      !rl.watchLater &&
      !rl.usage
    ) {
      rl.home = {};
    }

    if (rl.home && !this.multiSectionPage) {
      this.pageSwitcher.goTo(
        () => this.addMultiSectionPage(),
        () => this.removeMultiSectionPage(),
      );
    } else if (rl.listRecentPremieres && !this.listRecentPremieresPage) {
      this.pageSwitcher.goTo(
        () => this.addListRecentPremieresPage(),
        () => this.removeListRecentPremieresPage(),
      );
    } else if (rl.listTopRated && !this.listTopRatedPage) {
      this.pageSwitcher.goTo(
        () => this.addListTopRatedPage(),
        () => this.removeListTopRatedPage(),
      );
    } else if (rl.search) {
      if (rl.search.searchTarget === SearchTarget.PUBLISHER) {
        if (
          !this.searchPublishersPage ||
          this.searchPublishersPage.query !== rl.search.query
        ) {
          this.pageSwitcher.goTo(
            () => this.addSearchPublishersPage(rl.search.query),
            () => this.removeSearchPublishersPage(),
          );
        }
      } else if (rl.search.searchTarget === SearchTarget.SEASON) {
        if (
          !this.searchSeasonsPage ||
          this.searchSeasonsPage.query !== rl.search.query
        ) {
          this.pageSwitcher.goTo(
            () => this.addSearchSeasonsPage(rl.search.query),
            () => this.removeSearchSeasonsPage(),
          );
        }
      }
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
      rl.play &&
      (!this.playPage ||
        this.playPage.seasonId !== rl.play.seasonId ||
        this.playPage.episodeId !== rl.play.episodeId)
    ) {
      this.pageSwitcher.goTo(
        () => this.addPlayPage(rl.play.seasonId, rl.play.episodeId),
        () => this.removePlayPage(),
      );
    } else if (
      rl.publisherShowroom &&
      (!this.publisherShowroomPage ||
        this.publisherShowroomPage.accountId !== rl.publisherShowroom.accountId)
    ) {
      this.pageSwitcher.goTo(
        () => this.addPublisherShowroomPage(rl.publisherShowroom.accountId),
        () => this.removePublisherShowroomPage(),
      );
    } else if (rl.history && !this.historyPage) {
      this.pageSwitcher.goTo(
        () => this.addHistoryPage(),
        () => this.removeHistoryPage(),
      );
    } else if (rl.usage && !this.usagePage) {
      this.pageSwitcher.goTo(
        () => this.addUsagePage(),
        () => this.removeUsagePage(),
      );
    } else if (rl.watchLater && !this.watchLaterPage) {
      this.pageSwitcher.goTo(
        () => this.addWatchLaterPage(),
        () => this.removeWatchLaterPage(),
      );
    }
    if (
      rl.home ||
      rl.listRecentPremieres ||
      rl.listTopRated ||
      rl.search ||
      rl.publisherShowroom ||
      rl.history ||
      rl.watchLater
    ) {
      this.lastListRl = rl;
    }
    return this;
  }

  private addHistoryPage(): void {
    this.historyPage = this.createHistoryPage()
      .on("viewUsage", () => {
        this.pushRl({
          usage: {},
        });
      })
      .on("play", (seasonId, episodeId) => {
        this.pushRl({
          play: {
            seasonId,
            episodeId,
          },
        });
      });
    this.appendBodies(this.historyPage.body);
  }

  private removeHistoryPage(): void {
    this.historyPage.remove();
    this.historyPage = undefined;
  }

  private addListRecentPremieresPage(): void {
    this.listRecentPremieresPage = this.createListRecentPremieresPage().on(
      "showDetails",
      (seasonId) => {
        this.pushRl({
          seasonDetails: {
            seasonId,
          },
        });
      },
    );
    this.appendBodies(this.listRecentPremieresPage.body);
  }

  private removeListRecentPremieresPage(): void {
    this.listRecentPremieresPage.remove();
    this.listRecentPremieresPage = undefined;
  }

  private addListTopRatedPage(): void {
    this.listTopRatedPage = this.createListTopRatedPage().on(
      "showDetails",
      (seasonId) => {
        this.pushRl({
          seasonDetails: {
            seasonId,
          },
        });
      },
    );
    this.appendBodies(this.listTopRatedPage.body);
  }

  private removeListTopRatedPage(): void {
    this.listTopRatedPage.remove();
    this.listTopRatedPage = undefined;
  }

  private addMultiSectionPage(): void {
    this.multiSectionPage = this.createMultiSectionPage()
      .on("play", (seasonId, episodeId) => {
        this.pushRl({
          play: {
            seasonId,
            episodeId,
          },
        });
      })
      .on("showDetails", (seasonId) => {
        this.pushRl({
          seasonDetails: {
            seasonId,
          },
        });
      })
      .on("listWatchHistory", () => {
        this.pushRl({
          history: {},
        });
      })
      .on("listRecentPremieres", () => {
        this.pushRl({
          listRecentPremieres: {},
        });
      })
      .on("listTopRated", () => {
        this.pushRl({
          listTopRated: {},
        });
      });
    this.appendBodies(this.multiSectionPage.body);
  }

  private removeMultiSectionPage(): void {
    this.multiSectionPage.remove();
    this.multiSectionPage = undefined;
  }

  private addPlayPage(seasonId: string, episodeId: string): void {
    this.hideNavigationBar();
    this.playPage = this.createPlayPage(seasonId, episodeId)
      .on("play", (seasonId, episodeId) => {
        this.pushRl({
          play: {
            seasonId,
            episodeId,
          },
        });
      })
      .on("showDetails", (seasonId) => {
        this.pushRl({
          seasonDetails: {
            seasonId,
          },
        });
      });
    this.appendBodies(this.playPage.body);
  }

  private removePlayPage(): void {
    this.playPage.remove();
    this.playPage = undefined;
    this.showNavigationBar();
  }

  private addPublisherShowroomPage(publisherId: string): void {
    this.publisherShowroomPage = this.createPublisherShowroomPage(
      publisherId,
    ).on("showDetails", (seasonId) => {
      this.pushRl({
        seasonDetails: {
          seasonId,
        },
      });
    });
    this.appendBodies(this.publisherShowroomPage.body);
  }

  private removePublisherShowroomPage(): void {
    this.publisherShowroomPage.remove();
    this.publisherShowroomPage = undefined;
  }

  private addSearchPublishersPage(query: string): void {
    this.searchPublishersPage = this.createSearchPublishersPage(query)
      .on("search", (searchTarget, query) => {
        this.pushRl({
          search: {
            searchTarget,
            query,
          },
        });
      })
      .on("showroom", (publisherId) => {
        this.pushRl({
          publisherShowroom: {
            accountId: publisherId,
          },
        });
      });
    this.appendBodies(this.searchPublishersPage.body);
  }

  private removeSearchPublishersPage(): void {
    this.searchPublishersPage.remove();
    this.searchPublishersPage = undefined;
  }

  private addSearchSeasonsPage(query: string): void {
    this.searchSeasonsPage = this.createSearchSeasonsPage(query)
      .on("search", (searchTarget, query) => {
        this.pushRl({
          search: {
            searchTarget,
            query,
          },
        });
      })
      .on("showDetails", (seasonId) => {
        this.pushRl({
          seasonDetails: {
            seasonId,
          },
        });
      });
    this.appendBodies(this.searchSeasonsPage.body);
  }

  private removeSearchSeasonsPage(): void {
    this.searchSeasonsPage.remove();
    this.searchSeasonsPage = undefined;
  }

  private addSeasonDetailsPage(seasonId: string): void {
    this.seasonDetailsPage = this.createSeasonDetailsPage(seasonId)
      .on("back", () => {
        this.pushRl(this.lastListRl);
      })
      .on("play", (seasonId, episodeId) => {
        this.pushRl({
          play: {
            seasonId,
            episodeId,
          },
        });
      })
      .on("showroom", (publisherId) => {
        this.pushRl({
          publisherShowroom: {
            accountId: publisherId,
          },
        });
      });
    this.appendBodies(this.seasonDetailsPage.body);
  }

  private removeSeasonDetailsPage(): void {
    this.seasonDetailsPage.remove();
    this.seasonDetailsPage = undefined;
  }

  private addUsagePage(): void {
    this.usagePage = this.createUsagePage();
    this.appendBodies(this.usagePage.body);
  }

  private removeUsagePage(): void {
    this.usagePage.remove();
    this.usagePage = undefined;
  }

  private addWatchLaterPage(): void {
    this.watchLaterPage = this.createWatchLaterPage().on(
      "showDetails",
      (seasonId) => {
        this.pushRl({
          seasonDetails: {
            seasonId,
          },
        });
      },
    );
    this.appendBodies(this.watchLaterPage.body);
  }

  private removeWatchLaterPage(): void {
    this.watchLaterPage.remove();
    this.watchLaterPage = undefined;
  }

  public remove(): void {
    this.navigationBar.val.remove();
    this.pageSwitcher.remove();
    this.removeAllListeners();
  }
}
