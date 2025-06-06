import "../../dev/env";
import path from "path";
import { normalizeBody } from "../../common/normalize_body";
import { setTabletView } from "../../common/view_port";
import { ConsumerPage } from "./body";
import { HistoryPageMock } from "./history_page/body_mock";
import { ListRecentPremieresPageMock } from "./list_recent_premieres_page/body_mock";
import { ListTopRatedPageMock } from "./list_top_rated_page/body_mock";
import { MultiSectionPageMock } from "./multi_section_page/body_mock";
import { PlayPageMock } from "./play_page/body_mock";
import { PublisherShowroomPageMock } from "./publisher_showroom_page/body_mock";
import { SearchPublishersPageMock } from "./search_publishers_page/body_mock";
import { SearchSeasonsPageMock } from "./search_seasons_page/body_mock";
import { SeasonDetailsPageMock } from "./season_details_page/body_mock";
import { UsagePageMock } from "./usage_page/body_mock";
import { WatchLaterPageMock } from "./watch_later_page/body_mock";
import {
  CONSUMER_PAGE,
  ConsumerPage as ConsumerPageUrl,
  SearchTarget,
} from "@phading/web_interface/main/consumer/page";
import { copyMessage } from "@selfage/message/copier";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

function createConsumerPage(): ConsumerPage {
  let nowDate = new Date("2023-10-10T00:00:00Z");
  return new ConsumerPage(
    () => new HistoryPageMock(() => nowDate),
    () => new ListRecentPremieresPageMock(() => nowDate),
    () => new ListTopRatedPageMock(() => nowDate),
    () => new MultiSectionPageMock(() => nowDate),
    (seasonId, episodeId) =>
      new PlayPageMock(() => nowDate, seasonId, episodeId),
    (accountId) => new PublisherShowroomPageMock(() => nowDate, accountId),
    (query) => new SearchPublishersPageMock(query),
    (query) => new SearchSeasonsPageMock(() => nowDate, query),
    (seasonId) => new SeasonDetailsPageMock(() => nowDate, seasonId),
    () => new UsagePageMock(() => nowDate),
    () => new WatchLaterPageMock(() => nowDate),
    (...bodies) => document.body.append(...bodies),
  );
}

TEST_RUNNER.run({
  name: "ConsumerPageTest",
  cases: [
    new (class implements TestCase {
      public name = "NavigationForHomeAndPlay";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createConsumerPage();
        let newUrl: ConsumerPageUrl;
        this.cut.on("newUrl", (url) => {
          newUrl = copyMessage(url, CONSUMER_PAGE);
        });

        // Execute
        this.cut.applyUrl();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_home.png"),
          path.join(__dirname, "/golden/consumer_page_home.png"),
          path.join(__dirname, "/consumer_page_home_diff.png"),
        );

        // Execute
        this.cut.multiSectionPage.emit("play", "season1", "episode1");

        // Verify
        assertThat(
          this.cut.playPage.seasonId,
          eq("season1"),
          "play.seasonId from home",
        );
        assertThat(
          this.cut.playPage.episodeId,
          eq("episode1"),
          "play.episodeId from home",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              play: {
                seasonId: "season1",
                episodeId: "episode1",
              },
            },
            CONSUMER_PAGE,
          ),
          "play from home",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_play.png"),
          path.join(__dirname, "/golden/consumer_page_play.png"),
          path.join(__dirname, "/consumer_page_play_diff.png"),
        );

        // Execute
        this.cut.playPage.emit("play", "season1", "episode2");

        // Verify
        assertThat(
          this.cut.playPage.seasonId,
          eq("season1"),
          "play.seasonId from play",
        );
        assertThat(
          this.cut.playPage.episodeId,
          eq("episode2"),
          "play.episodeId from play",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              play: {
                seasonId: "season1",
                episodeId: "episode2",
              },
            },
            CONSUMER_PAGE,
          ),
          "play from play",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_play.png"),
          path.join(__dirname, "/golden/consumer_page_play.png"),
          path.join(__dirname, "/consumer_page_play_diff.png"),
        );

        // Execute
        this.cut.playPage.emit("showDetails", "season1");

        // Verify
        assertThat(
          this.cut.seasonDetailsPage.seasonId,
          eq("season1"),
          "seasonDetails.seasonId from play",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              seasonDetails: {
                seasonId: "season1",
              },
            },
            CONSUMER_PAGE,
          ),
          "seasonDetails from play",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_season_details.png"),
          path.join(__dirname, "/golden/consumer_page_season_details.png"),
          path.join(__dirname, "/consumer_page_season_details_diff.png"),
        );

        // Execute
        this.cut.seasonDetailsPage.emit("play", "season1", "episode3");

        // Verify
        assertThat(
          this.cut.playPage.seasonId,
          eq("season1"),
          "play.seasonId from seasonDetails",
        );
        assertThat(
          this.cut.playPage.episodeId,
          eq("episode3"),
          "play.episodeId from seasonDetails",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              play: {
                seasonId: "season1",
                episodeId: "episode3",
              },
            },
            CONSUMER_PAGE,
          ),
          "play from seasonDetails",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_play.png"),
          path.join(__dirname, "/golden/consumer_page_play.png"),
          path.join(__dirname, "/consumer_page_play_diff.png"),
        );

        // Execute
        this.cut.playPage.emit("showDetails", "season1");
        this.cut.seasonDetailsPage.emit("back");

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              home: {},
            },
            CONSUMER_PAGE,
          ),
          "back to home from seasonDetails",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_home.png"),
          path.join(__dirname, "/golden/consumer_page_home.png"),
          path.join(__dirname, "/consumer_page_home_diff.png"),
        );

        // Execute
        this.cut.multiSectionPage.emit("showDetails", "season2");

        // Verify
        assertThat(
          this.cut.seasonDetailsPage.seasonId,
          eq("season2"),
          "seasonDetails.seasonId from multiSectionPage",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              seasonDetails: {
                seasonId: "season2",
              },
            },
            CONSUMER_PAGE,
          ),
          "seasonDetails from multiSectionPage",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_season_details.png"),
          path.join(__dirname, "/golden/consumer_page_season_details.png"),
          path.join(__dirname, "/consumer_page_season_details_diff.png"),
        );

        // Execute
        this.cut.seasonDetailsPage.emit("back");

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              home: {},
            },
            CONSUMER_PAGE,
          ),
          "back to home from seasonDetails again",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_home.png"),
          path.join(__dirname, "/golden/consumer_page_home.png"),
          path.join(__dirname, "/consumer_page_home_diff.png"),
        );

        // Execute
        this.cut.multiSectionPage.emit("listRecentPremieres");

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              listRecentPremieres: {},
            },
            CONSUMER_PAGE,
          ),
          "listRecentPremieres",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_list_recent_premieres.png"),
          path.join(
            __dirname,
            "/golden/consumer_page_list_recent_premieres.png",
          ),
          path.join(__dirname, "/consumer_page_list_recent_premieres_diff.png"),
        );

        // Execute
        this.cut.listRecentPremieresPage.emit("showDetails", "season3");

        // Verify
        assertThat(
          this.cut.seasonDetailsPage.seasonId,
          eq("season3"),
          "seasonDetails.seasonId from listRecentPremieres",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              seasonDetails: {
                seasonId: "season3",
              },
            },
            CONSUMER_PAGE,
          ),
          "seasonDetails from listRecentPremieres",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_season_details.png"),
          path.join(__dirname, "/golden/consumer_page_season_details.png"),
          path.join(__dirname, "/consumer_page_season_details_diff.png"),
        );

        // Execute
        this.cut.seasonDetailsPage.emit("back");

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              listRecentPremieres: {},
            },
            CONSUMER_PAGE,
          ),
          "back to listRecentPremieres from seasonDetails",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_list_recent_premieres.png"),
          path.join(
            __dirname,
            "/golden/consumer_page_list_recent_premieres.png",
          ),
          path.join(__dirname, "/consumer_page_list_recent_premieres_diff.png"),
        );

        // Execute
        this.cut.homeButton.val.click();
        this.cut.multiSectionPage.emit("listTopRated");

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              listTopRated: {},
            },
            CONSUMER_PAGE,
          ),
          "listTopRated",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_list_top_rated.png"),
          path.join(__dirname, "/golden/consumer_page_list_top_rated.png"),
          path.join(__dirname, "/consumer_page_list_top_rated_diff.png"),
        );

        // Execute
        this.cut.listTopRatedPage.emit("showDetails", "season4");

        // Verify
        assertThat(
          this.cut.seasonDetailsPage.seasonId,
          eq("season4"),
          "seasonDetails.seasonId from listTopRated",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              seasonDetails: {
                seasonId: "season4",
              },
            },
            CONSUMER_PAGE,
          ),
          "seasonDetails from listTopRated",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_season_details.png"),
          path.join(__dirname, "/golden/consumer_page_season_details.png"),
          path.join(__dirname, "/consumer_page_season_details_diff.png"),
        );

        // Execute
        this.cut.seasonDetailsPage.emit("back");

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              listTopRated: {},
            },
            CONSUMER_PAGE,
          ),
          "back to listTopRated from seasonDetails",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_list_top_rated.png"),
          path.join(__dirname, "/golden/consumer_page_list_top_rated.png"),
          path.join(__dirname, "/consumer_page_list_top_rated_diff.png"),
        );

        // Execute
        this.cut.homeButton.val.click();
        this.cut.multiSectionPage.emit("listWatchHistory");

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              history: {},
            },
            CONSUMER_PAGE,
          ),
          "history from home",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_history.png"),
          path.join(__dirname, "/golden/consumer_page_history.png"),
          path.join(__dirname, "/consumer_page_history_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "NavigationForSearch";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createConsumerPage();
        let newUrl: ConsumerPageUrl;
        this.cut.on("newUrl", (url) => {
          newUrl = copyMessage(url, CONSUMER_PAGE);
        });
        this.cut.applyUrl();

        // Execute
        this.cut.exploreButton.val.click();

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              search: {
                searchTarget: SearchTarget.SEASON,
              },
            },
            CONSUMER_PAGE,
          ),
          "search",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_search_empty.png"),
          path.join(__dirname, "/golden/consumer_page_search_empty.png"),
          path.join(__dirname, "/consumer_page_search_empty_diff.png"),
        );

        // Execute
        this.cut.searchSeasonsPage.emit(
          "search",
          SearchTarget.SEASON,
          "some query",
        );

        // Verify
        assertThat(
          this.cut.searchSeasonsPage.query,
          eq("some query"),
          "searchSeasonsPage.query from search",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              search: {
                searchTarget: SearchTarget.SEASON,
                query: "some query",
              },
            },
            CONSUMER_PAGE,
          ),
          "search seasons from search",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_search_seasons.png"),
          path.join(__dirname, "/golden/consumer_page_search_seasons.png"),
          path.join(__dirname, "/consumer_page_search_seasons_diff.png"),
        );

        // Execute
        this.cut.searchSeasonsPage.emit("showDetails", "season1");

        // Verify
        assertThat(
          this.cut.seasonDetailsPage.seasonId,
          eq("season1"),
          "seasonDetails.seasonId from search",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              seasonDetails: {
                seasonId: "season1",
              },
            },
            CONSUMER_PAGE,
          ),
          "seasonDetails from search",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_season_details.png"),
          path.join(__dirname, "/golden/consumer_page_season_details.png"),
          path.join(__dirname, "/consumer_page_season_details_diff.png"),
        );

        // Execute
        this.cut.seasonDetailsPage.emit("back");

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              search: {
                searchTarget: SearchTarget.SEASON,
                query: "some query",
              },
            },
            CONSUMER_PAGE,
          ),
          "back to search from seasonDetails",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_search_seasons.png"),
          path.join(__dirname, "/golden/consumer_page_search_seasons.png"),
          path.join(__dirname, "/consumer_page_search_seasons_diff.png"),
        );

        // Execute
        this.cut.searchSeasonsPage.emit(
          "search",
          SearchTarget.PUBLISHER,
          "some publisher",
        );

        // Verify
        assertThat(
          this.cut.searchPublishersPage.query,
          eq("some publisher"),
          "searchPublishersPage.query from search",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              search: {
                searchTarget: SearchTarget.PUBLISHER,
                query: "some publisher",
              },
            },
            CONSUMER_PAGE,
          ),
          "search publishers from search",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_search_publishers.png"),
          path.join(__dirname, "/golden/consumer_page_search_publishers.png"),
          path.join(__dirname, "/consumer_page_search_publishers_diff.png"),
        );

        // Execute
        this.cut.searchPublishersPage.emit("showroom", "publisher1");

        // Verify
        assertThat(
          this.cut.publisherShowroomPage.accountId,
          eq("publisher1"),
          "publisherShowroomPage.accountId from search publishers",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              publisherShowroom: {
                accountId: "publisher1",
              },
            },
            CONSUMER_PAGE,
          ),
          "publisherShowroom from search publishers",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_publisher_showroom.png"),
          path.join(__dirname, "/golden/consumer_page_publisher_showroom.png"),
          path.join(__dirname, "/consumer_page_publisher_showroom_diff.png"),
        );

        // Execute
        this.cut.publisherShowroomPage.emit("showDetails", "season2");

        // Verify
        assertThat(
          this.cut.seasonDetailsPage.seasonId,
          eq("season2"),
          "seasonDetails.seasonId from publisherShowroom",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              seasonDetails: {
                seasonId: "season2",
              },
            },
            CONSUMER_PAGE,
          ),
          "seasonDetails from publisherShowroom",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_season_details.png"),
          path.join(__dirname, "/golden/consumer_page_season_details.png"),
          path.join(__dirname, "/consumer_page_season_details_diff.png"),
        );

        // Execute
        this.cut.seasonDetailsPage.emit("back");

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              publisherShowroom: {
                accountId: "publisher1",
              },
            },
            CONSUMER_PAGE,
          ),
          "back to publisherShowroom from seasonDetails",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_publisher_showroom.png"),
          path.join(__dirname, "/golden/consumer_page_publisher_showroom.png"),
          path.join(__dirname, "/consumer_page_publisher_showroom_diff.png"),
        );

        // Execute
        this.cut.exploreButton.val.click();
        this.cut.searchSeasonsPage.emit(
          "search",
          SearchTarget.PUBLISHER,
          "some query",
        );
        this.cut.searchPublishersPage.emit(
          "search",
          SearchTarget.SEASON,
          "some query",
        );

        // Verify
        assertThat(
          this.cut.searchSeasonsPage.query,
          eq("some query"),
          "searchSeasonsPage.query from search publishers",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              search: {
                searchTarget: SearchTarget.SEASON,
                query: "some query",
              },
            },
            CONSUMER_PAGE,
          ),
          "search seasons from search publishers",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_search_seasons.png"),
          path.join(__dirname, "/golden/consumer_page_search_seasons.png"),
          path.join(__dirname, "/consumer_page_search_seasons_diff.png"),
        );

        // Execute
        this.cut.searchSeasonsPage.emit("showDetails", "season3");
        this.cut.seasonDetailsPage.emit("showroom", "publisher2");

        // Verify
        assertThat(
          this.cut.publisherShowroomPage.accountId,
          eq("publisher2"),
          "publisherShowroomPage.accountId from seasonDetails",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              publisherShowroom: {
                accountId: "publisher2",
              },
            },
            CONSUMER_PAGE,
          ),
          "publisherShowroom from seasonDetails",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_publisher_showroom.png"),
          path.join(__dirname, "/golden/consumer_page_publisher_showroom.png"),
          path.join(__dirname, "/consumer_page_publisher_showroom_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "NavigationForHistory";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createConsumerPage();
        let newUrl: ConsumerPageUrl;
        this.cut.on("newUrl", (url) => {
          newUrl = copyMessage(url, CONSUMER_PAGE);
        });
        this.cut.applyUrl();

        // Execute
        this.cut.activityButton.val.click();

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              history: {},
            },
            CONSUMER_PAGE,
          ),
          "history",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_history.png"),
          path.join(__dirname, "/golden/consumer_page_history.png"),
          path.join(__dirname, "/consumer_page_history_diff.png"),
        );

        // Execute
        this.cut.historyPage.emit("play", "season1", "episode1");

        // Verify
        assertThat(this.cut.playPage.seasonId, eq("season1"), "play.seasonId");
        assertThat(
          this.cut.playPage.episodeId,
          eq("episode1"),
          "play.episodeId",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              play: {
                seasonId: "season1",
                episodeId: "episode1",
              },
            },
            CONSUMER_PAGE,
          ),
          "play",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_play.png"),
          path.join(__dirname, "/golden/consumer_page_play.png"),
          path.join(__dirname, "/consumer_page_play_diff.png"),
        );

        // Execute
        this.cut.playPage.emit("showDetails", "season1");
        this.cut.seasonDetailsPage.emit("back");

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              history: {},
            },
            CONSUMER_PAGE,
          ),
          "back to history from seasonDetails",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_history.png"),
          path.join(__dirname, "/golden/consumer_page_history.png"),
          path.join(__dirname, "/consumer_page_history_diff.png"),
        );

        // Execute
        this.cut.historyPage.emit("viewUsage");

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              usage: {},
            },
            CONSUMER_PAGE,
          ),
          "usage",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/consumer_page_usage.png"),
          path.join(__dirname, "/golden/consumer_page_usage.png"),
          path.join(__dirname, "/consumer_page_usage_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_Empty";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createConsumerPage();

        // Execute
        this.cut.applyUrl({});

        // Verify
        assertThat(
          Boolean(this.cut.multiSectionPage),
          eq(true),
          "multiSectionPage",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_InvalidSearch";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createConsumerPage();

        // Execute
        this.cut.applyUrl({
          search: {},
        });

        // Verify
        assertThat(
          Boolean(this.cut.multiSectionPage),
          eq(true),
          "multiSectionPage",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_HomePage_SameUrlSamePage";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createConsumerPage();

        // Execute
        this.cut.applyUrl({
          home: {},
        });

        // Verify
        assertThat(
          Boolean(this.cut.multiSectionPage),
          eq(true),
          "multiSectionPage",
        );

        // Prepare
        let page = this.cut.multiSectionPage;

        // Execute
        this.cut.applyUrl({ home: {} });

        // Verify
        assertThat(
          this.cut.multiSectionPage,
          eq(page),
          "multiSectionPage is the same",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_ListRecentPremieresPage_SameUrlSamePage";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createConsumerPage();

        // Execute
        this.cut.applyUrl({
          listRecentPremieres: {},
        });

        // Verify
        assertThat(
          Boolean(this.cut.listRecentPremieresPage),
          eq(true),
          "listRecentPremieresPage",
        );

        // Prepare
        let page = this.cut.listRecentPremieresPage;

        // Execute
        this.cut.applyUrl({
          listRecentPremieres: {},
        });

        // Verify
        assertThat(
          this.cut.listRecentPremieresPage,
          eq(page),
          "listRecentPremieresPage is the same",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_ListTopRatedPage_SameUrlSamePage";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createConsumerPage();

        // Execute
        this.cut.applyUrl({
          listTopRated: {},
        });

        // Verify
        assertThat(
          Boolean(this.cut.listTopRatedPage),
          eq(true),
          "listTopRatedPage",
        );

        // Prepare
        let page = this.cut.listTopRatedPage;

        // Execute
        this.cut.applyUrl({
          listTopRated: {},
        });

        // Verify
        assertThat(
          this.cut.listTopRatedPage,
          eq(page),
          "listTopRatedPage is the same",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "ApplyUrl_SearchSeasons_SameTargetSameQuerySamePage_DifferentQueryDifferentPage_DifferentTargetDifferentPage";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createConsumerPage();

        // Execute
        this.cut.applyUrl({
          search: {
            searchTarget: SearchTarget.SEASON,
            query: "My Hero Academia",
          },
        });

        // Verify
        assertThat(
          Boolean(this.cut.searchSeasonsPage),
          eq(true),
          "searchSeasonsPage",
        );

        // Prepare
        let page = this.cut.searchSeasonsPage;

        // Execute
        this.cut.applyUrl({
          search: {
            searchTarget: SearchTarget.SEASON,
            query: "My Hero Academia",
          },
        });

        // Verify
        assertThat(
          this.cut.searchSeasonsPage,
          eq(page),
          "searchSeasonsPage is the same",
        );

        // Execute
        this.cut.applyUrl({
          search: {
            searchTarget: SearchTarget.SEASON,
            query: "Attack on Titan",
          },
        });

        // Verify
        assertThat(
          this.cut.searchSeasonsPage.query,
          eq("Attack on Titan"),
          "searchSeasonsPage.query is updated",
        );

        // Execute
        this.cut.applyUrl({
          search: {
            searchTarget: SearchTarget.PUBLISHER,
            query: "My Hero Academia",
          },
        });

        // Verify
        assertThat(
          Boolean(this.cut.searchPublishersPage),
          eq(true),
          "searchPublishersPage",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "ApplyUrl_SearchPublisher_SameTargetSameQuerySamePage_DifferentQueryDifferentPage_DifferentTargetDifferentPage";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createConsumerPage();

        // Execute
        this.cut.applyUrl({
          search: {
            searchTarget: SearchTarget.PUBLISHER,
            query: "My Hero Academia",
          },
        });

        // Verify
        assertThat(
          Boolean(this.cut.searchPublishersPage),
          eq(true),
          "searchPublishersPage",
        );

        // Prepare
        let page = this.cut.searchPublishersPage;

        // Execute
        this.cut.applyUrl({
          search: {
            searchTarget: SearchTarget.PUBLISHER,
            query: "My Hero Academia",
          },
        });

        // Verify
        assertThat(
          this.cut.searchPublishersPage,
          eq(page),
          "searchPublishersPage is the same",
        );

        // Execute
        this.cut.applyUrl({
          search: {
            searchTarget: SearchTarget.PUBLISHER,
            query: "Attack on Titan",
          },
        });

        // Verify
        assertThat(
          this.cut.searchPublishersPage.query,
          eq("Attack on Titan"),
          "searchPublishersPage.query is updated",
        );

        // Execute
        this.cut.applyUrl({
          search: {
            searchTarget: SearchTarget.SEASON,
            query: "My Hero Academia",
          },
        });

        // Verify
        assertThat(
          Boolean(this.cut.searchSeasonsPage),
          eq(true),
          "searchSeasonsPage",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "ApplyUrl_SeasonDetails_SameIdSamePage_DifferentIdDifferentPage";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createConsumerPage();

        // Execute
        this.cut.applyUrl({
          seasonDetails: {
            seasonId: "season1",
          },
        });

        // Verify
        assertThat(
          Boolean(this.cut.seasonDetailsPage),
          eq(true),
          "seasonDetailsPage",
        );

        // Prepare
        let page = this.cut.seasonDetailsPage;

        // Execute
        this.cut.applyUrl({
          seasonDetails: {
            seasonId: "season1",
          },
        });

        // Verify
        assertThat(
          this.cut.seasonDetailsPage,
          eq(page),
          "seasonDetailsPage is the same",
        );

        // Execute
        this.cut.applyUrl({
          seasonDetails: {
            seasonId: "season2",
          },
        });

        // Verify
        assertThat(
          this.cut.seasonDetailsPage.seasonId,
          eq("season2"),
          "seasonDetailsPage.seasonId is updated",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_Play_SameIdSamePage_DifferentIdDifferentPage";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createConsumerPage();

        // Execute
        this.cut.applyUrl({
          play: {
            seasonId: "season1",
            episodeId: "episode1",
          },
        });

        // Verify
        assertThat(Boolean(this.cut.playPage), eq(true), "playPage");

        // Prepare
        let page = this.cut.playPage;

        // Execute
        this.cut.applyUrl({
          play: {
            seasonId: "season1",
            episodeId: "episode1",
          },
        });

        // Verify
        assertThat(this.cut.playPage, eq(page), "playPage is the same");

        // Execute
        this.cut.applyUrl({
          play: {
            seasonId: "season2",
            episodeId: "episode1",
          },
        });

        // Verify
        assertThat(
          this.cut.playPage.seasonId,
          eq("season2"),
          "playPage.seasonId is updated",
        );
        assertThat(
          this.cut.playPage.episodeId,
          eq("episode1"),
          "playPage.episodeId is updated",
        );

        // Execute
        this.cut.applyUrl({
          play: {
            seasonId: "season2",
            episodeId: "episode2",
          },
        });

        // Verify
        assertThat(
          this.cut.playPage.seasonId,
          eq("season2"),
          "playPage.seasonId is updated 2",
        );
        assertThat(
          this.cut.playPage.episodeId,
          eq("episode2"),
          "playPage.episodeId is updated 2",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "ApplyUrl_PublisherShowroom_SameIdSamePage_DifferentIdDifferentPage";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createConsumerPage();

        // Execute
        this.cut.applyUrl({
          publisherShowroom: {
            accountId: "publisher1",
          },
        });

        // Verify
        assertThat(
          Boolean(this.cut.publisherShowroomPage),
          eq(true),
          "publisherShowroomPage",
        );

        // Prepare
        let page = this.cut.publisherShowroomPage;

        // Execute
        this.cut.applyUrl({
          publisherShowroom: {
            accountId: "publisher1",
          },
        });

        // Verify
        assertThat(
          this.cut.publisherShowroomPage,
          eq(page),
          "publisherShowroomPage is the same",
        );

        // Execute
        this.cut.applyUrl({
          publisherShowroom: {
            accountId: "publisher2",
          },
        });

        // Verify
        assertThat(
          this.cut.publisherShowroomPage.accountId,
          eq("publisher2"),
          "publisherShowroomPage.accountId is updated",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_HistoryPage_SameUrlSamePage";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createConsumerPage();

        // Execute
        this.cut.applyUrl({
          history: {},
        });

        // Verify
        assertThat(Boolean(this.cut.historyPage), eq(true), "historyPage");

        // Prepare
        let page = this.cut.historyPage;

        // Execute
        this.cut.applyUrl({
          history: {},
        });

        // Verify
        assertThat(this.cut.historyPage, eq(page), "historyPage is the same");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_UsagePage_SameUrlSamePage";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createConsumerPage();

        // Execute
        this.cut.applyUrl({
          usage: {},
        });

        // Verify
        assertThat(Boolean(this.cut.usagePage), eq(true), "usagePage");

        // Prepare
        let page = this.cut.usagePage;

        // Execute
        this.cut.applyUrl({
          usage: {},
        });

        // Verify
        assertThat(this.cut.usagePage, eq(page), "usagePage is the same");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_WatchLaterPage_SameUrlSamePage";
      private cut: ConsumerPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createConsumerPage();

        // Execute
        this.cut.applyUrl({
          watchLater: {},
        });

        // Verify
        assertThat(
          Boolean(this.cut.watchLaterPage),
          eq(true),
          "watchLaterPage",
        );

        // Prepare
        let page = this.cut.watchLaterPage;

        // Execute
        this.cut.applyUrl({
          watchLater: {},
        });

        // Verify
        assertThat(
          this.cut.watchLaterPage,
          eq(page),
          "watchLaterPage is the same",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
