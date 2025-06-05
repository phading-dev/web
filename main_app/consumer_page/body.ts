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
  ConsumerPage as ConsumerPageUrl,
  SearchTarget,
} from "@phading/web_interface/main/consumer/page";
import { Ref } from "@selfage/ref";

export interface ConsumerPage {
  on(event: "newUrl", listener: (newUrl: ConsumerPageUrl) => void): this;
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
  private lastListUrl: ConsumerPageUrl;
  private url: ConsumerPageUrl;

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
      this.newUrl({
        home: {},
      });
    });
    this.exploreButton.val.addEventListener("click", () => {
      this.newUrl({
        search: {
          searchTarget: SearchTarget.SEASON,
        },
      });
    });
    this.activityButton.val.addEventListener("click", () => {
      this.newUrl({
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

  private newUrl(newUrl: ConsumerPageUrl): void {
    this.applyUrl(newUrl);
    this.emit("newUrl", newUrl);
  }

  public applyUrl(newUrl?: ConsumerPageUrl): this {
    if (!newUrl) {
      newUrl = {};
    }
    if (newUrl.search && !newUrl.search.searchTarget) {
      newUrl.search = undefined;
    }
    if (
      !newUrl.home &&
      !newUrl.listTopRated &&
      !newUrl.listRecentPremieres &&
      !newUrl.search &&
      !newUrl.seasonDetails &&
      !newUrl.play &&
      !newUrl.publisherShowroom &&
      !newUrl.history &&
      !newUrl.watchLater &&
      !newUrl.usage
    ) {
      newUrl = { home: {} };
    }

    if (newUrl.home && !this.url?.home) {
      this.pageSwitcher.goTo(
        () => this.addMultiSectionPage(),
        () => this.multiSectionPage.remove(),
      );
    } else if (newUrl.listRecentPremieres && !this.url?.listRecentPremieres) {
      this.pageSwitcher.goTo(
        () => this.addListRecentPremieresPage(),
        () => this.listRecentPremieresPage.remove(),
      );
    } else if (newUrl.listTopRated && !this.url?.listTopRated) {
      this.pageSwitcher.goTo(
        () => this.addListTopRatedPage(),
        () => this.listTopRatedPage.remove(),
      );
    } else if (
      newUrl.search &&
      (!this.url?.search ||
        this.url.search.searchTarget !== newUrl.search.searchTarget ||
        this.url.search.query !== newUrl.search.query)
    ) {
      if (newUrl.search.searchTarget === SearchTarget.PUBLISHER) {
        this.pageSwitcher.goTo(
          () => this.addSearchPublishersPage(newUrl.search.query),
          () => this.searchPublishersPage.remove(),
        );
      } else if (newUrl.search.searchTarget === SearchTarget.SEASON) {
        this.pageSwitcher.goTo(
          () => this.addSearchSeasonsPage(newUrl.search.query),
          () => this.searchSeasonsPage.remove(),
        );
      }
    } else if (
      newUrl.seasonDetails &&
      (!this.url?.seasonDetails ||
        this.url.seasonDetails.seasonId !== newUrl.seasonDetails.seasonId)
    ) {
      this.pageSwitcher.goTo(
        () => this.addSeasonDetailsPage(newUrl.seasonDetails.seasonId),
        () => this.seasonDetailsPage.remove(),
      );
    } else if (
      newUrl.play &&
      (!this.url?.play ||
        this.url.play.seasonId !== newUrl.play.seasonId ||
        this.url.play.episodeId !== newUrl.play.episodeId)
    ) {
      this.pageSwitcher.goTo(
        () => this.addPlayPage(newUrl.play.seasonId, newUrl.play.episodeId),
        () => this.removePlayPage(),
      );
    } else if (
      newUrl.publisherShowroom &&
      (!this.url?.publisherShowroom ||
        this.url.publisherShowroom.accountId !==
          newUrl.publisherShowroom.accountId)
    ) {
      this.pageSwitcher.goTo(
        () => this.addPublisherShowroomPage(newUrl.publisherShowroom.accountId),
        () => this.publisherShowroomPage.remove(),
      );
    } else if (newUrl.history && !this.url?.history) {
      this.pageSwitcher.goTo(
        () => this.addHistoryPage(),
        () => this.historyPage.remove(),
      );
    } else if (newUrl.usage && !this.url?.usage) {
      this.pageSwitcher.goTo(
        () => this.addUsagePage(),
        () => this.usagePage.remove(),
      );
    } else if (newUrl.watchLater && !this.url?.watchLater) {
      this.pageSwitcher.goTo(
        () => this.addWatchLaterPage(),
        () => this.watchLaterPage.remove(),
      );
    }
    if (
      this.url?.home ||
      this.url?.listRecentPremieres ||
      this.url?.listTopRated ||
      this.url?.search ||
      this.url?.publisherShowroom ||
      this.url?.history ||
      this.url?.watchLater
    ) {
      this.lastListUrl = this.url;
    }
    this.url = newUrl;
    return this;
  }

  private addHistoryPage(): void {
    this.historyPage = this.createHistoryPage()
      .on("viewUsage", () => {
        this.newUrl({
          usage: {},
        });
      })
      .on("play", (seasonId, episodeId) => {
        this.newUrl({
          play: {
            seasonId,
            episodeId,
          },
        });
      });
    this.appendBodies(this.historyPage.body);
  }

  private addListRecentPremieresPage(): void {
    this.listRecentPremieresPage = this.createListRecentPremieresPage().on(
      "showDetails",
      (seasonId) => {
        this.newUrl({
          seasonDetails: {
            seasonId,
          },
        });
      },
    );
    this.appendBodies(this.listRecentPremieresPage.body);
  }

  private addListTopRatedPage(): void {
    this.listTopRatedPage = this.createListTopRatedPage().on(
      "showDetails",
      (seasonId) => {
        this.newUrl({
          seasonDetails: {
            seasonId,
          },
        });
      },
    );
    this.appendBodies(this.listTopRatedPage.body);
  }

  private addMultiSectionPage(): void {
    this.multiSectionPage = this.createMultiSectionPage()
      .on("play", (seasonId, episodeId) => {
        this.newUrl({
          play: {
            seasonId,
            episodeId,
          },
        });
      })
      .on("showDetails", (seasonId) => {
        this.newUrl({
          seasonDetails: {
            seasonId,
          },
        });
      })
      .on("listWatchHistory", () => {
        this.newUrl({
          history: {},
        });
      })
      .on("listRecentPremieres", () => {
        this.newUrl({
          listRecentPremieres: {},
        });
      })
      .on("listTopRated", () => {
        this.newUrl({
          listTopRated: {},
        });
      });
    this.appendBodies(this.multiSectionPage.body);
  }

  private addPlayPage(seasonId: string, episodeId: string): void {
    this.hideNavigationBar();
    this.playPage = this.createPlayPage(seasonId, episodeId)
      .on("play", (seasonId, episodeId) => {
        this.newUrl({
          play: {
            seasonId,
            episodeId,
          },
        });
      })
      .on("showDetails", (seasonId) => {
        this.newUrl({
          seasonDetails: {
            seasonId,
          },
        });
      });
    this.appendBodies(this.playPage.body);
  }

  private removePlayPage(): void {
    this.playPage.remove();
    this.showNavigationBar();
  }

  private addPublisherShowroomPage(publisherId: string): void {
    this.publisherShowroomPage = this.createPublisherShowroomPage(
      publisherId,
    ).on("showDetails", (seasonId) => {
      this.newUrl({
        seasonDetails: {
          seasonId,
        },
      });
    });
    this.appendBodies(this.publisherShowroomPage.body);
  }

  private addSearchPublishersPage(query: string): void {
    this.searchPublishersPage = this.createSearchPublishersPage(query)
      .on("search", (searchTarget, query) => {
        this.newUrl({
          search: {
            searchTarget,
            query,
          },
        });
      })
      .on("showroom", (publisherId) => {
        this.newUrl({
          publisherShowroom: {
            accountId: publisherId,
          },
        });
      });
    this.appendBodies(this.searchPublishersPage.body);
  }

  private addSearchSeasonsPage(query: string): void {
    this.searchSeasonsPage = this.createSearchSeasonsPage(query)
      .on("search", (searchTarget, query) => {
        this.newUrl({
          search: {
            searchTarget,
            query,
          },
        });
      })
      .on("showDetails", (seasonId) => {
        this.newUrl({
          seasonDetails: {
            seasonId,
          },
        });
      });
    this.appendBodies(this.searchSeasonsPage.body);
  }

  private addSeasonDetailsPage(seasonId: string): void {
    this.seasonDetailsPage = this.createSeasonDetailsPage(seasonId)
      .on("back", () => {
        this.newUrl(this.lastListUrl);
      })
      .on("play", (seasonId, episodeId) => {
        this.newUrl({
          play: {
            seasonId,
            episodeId,
          },
        });
      })
      .on("showroom", (publisherId) => {
        this.newUrl({
          publisherShowroom: {
            accountId: publisherId,
          },
        });
      });
    this.appendBodies(this.seasonDetailsPage.body);
  }

  private addUsagePage(): void {
    this.usagePage = this.createUsagePage();
    this.appendBodies(this.usagePage.body);
  }

  private addWatchLaterPage(): void {
    this.watchLaterPage = this.createWatchLaterPage().on(
      "showDetails",
      (seasonId) => {
        this.newUrl({
          seasonDetails: {
            seasonId,
          },
        });
      },
    );
    this.appendBodies(this.watchLaterPage.body);
  }

  public remove(): void {
    this.navigationBar.val.remove();
    this.pageSwitcher.remove();
  }
}
