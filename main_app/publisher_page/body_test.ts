import "../../dev/env";
import path = require("path");
import { normalizeBody } from "../../common/normalize_body";
import { setTabletView } from "../../common/view_port";
import { PublisherPage } from "./body";
import { CreateSeasonPage } from "./create_season_page/body";
import { ListPageMock } from "./list_page/body_mock";
import { SearchPageMock } from "./search_page/body_mock";
import { SeasonDetailsPageMock } from "./season_details_page/body_mock";
import { StatsPageMock } from "./stats_page/body_mock";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import {
  PUBLISHER_PAGE_RL,
  PublisherPageRl,
} from "@phading/web_interface/main/publisher/page";
import { copyMessage } from "@selfage/message/copier";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

function createPublisherPage(): PublisherPage {
  let nowDate = new Date("2023-10-10T00:00:00Z");
  return new PublisherPage(
    () => new CreateSeasonPage(undefined),
    (seasonState) => new ListPageMock(() => nowDate, seasonState),
    (seasonState, query) =>
      new SearchPageMock(() => nowDate, seasonState, query),
    (appendBodies, seasonId) =>
      new SeasonDetailsPageMock(() => nowDate, appendBodies, seasonId),
    () => new StatsPageMock(() => nowDate),
    (...bodies) => document.body.append(...bodies),
  );
}

TEST_RUNNER.run({
  name: "PublisherPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Navigation";
      private cut: PublisherPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createPublisherPage();
        let rl: PublisherPageRl;
        this.cut.on(
          "pushRl",
          (rl_) => (rl = copyMessage(rl_, PUBLISHER_PAGE_RL)),
        );

        // Execute
        this.cut.applyRl();

        // Verify
        assertThat(
          this.cut.listPage.seasonState,
          eq(SeasonState.PUBLISHED),
          "listPage.seasonState",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_page_list_published.png"),
          path.join(__dirname, "/golden/publisher_page_list_published.png"),
          path.join(__dirname, "/publisher_page_list_published_diff.png"),
        );

        // Execute
        this.cut.listPage.emit("viewSeason", "season1");

        // Verify
        assertThat(
          this.cut.seasonDetailsPage.seasonId,
          eq("season1"),
          "seasonDetailsPage.seasonId",
        );
        assertThat(
          rl,
          eqMessage(
            {
              seasonDetails: {
                seasonId: "season1",
              },
            },
            PUBLISHER_PAGE_RL,
          ),
          "rl.seasonDetails",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_page_season_details.png"),
          path.join(__dirname, "/golden/publisher_page_season_details.png"),
          path.join(__dirname, "/publisher_page_season_details_diff.png"),
        );

        // Execute
        this.cut.seasonDetailsPage.emit("back");

        // Verify
        assertThat(
          rl,
          eqMessage(
            {
              list: {
                seasonState: SeasonState.PUBLISHED,
              },
            },
            PUBLISHER_PAGE_RL,
          ),
          "rl.list back from season details",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_page_back_from_season_details.png"),
          path.join(__dirname, "/golden/publisher_page_list_published.png"),
          path.join(
            __dirname,
            "/publisher_page_back_from_season_details_diff.png",
          ),
        );

        // Execute
        this.cut.listPage.emit("listSeasons", SeasonState.DRAFT);

        // Verify
        assertThat(
          this.cut.listPage.seasonState,
          eq(SeasonState.DRAFT),
          "listPage.seasonState after listSeasons",
        );
        assertThat(
          rl,
          eqMessage(
            {
              list: {
                seasonState: SeasonState.DRAFT,
              },
            },
            PUBLISHER_PAGE_RL,
          ),
          "rl.list after listSeasons",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_page_list_draft.png"),
          path.join(__dirname, "/golden/publisher_page_list_draft.png"),
          path.join(__dirname, "/publisher_page_list_draft_diff.png"),
        );

        // Execute
        this.cut.listPage.emit(
          "searchSeasons",
          SeasonState.PUBLISHED,
          "some query",
        );

        // Verify
        assertThat(
          this.cut.searchPage.seasonState,
          eq(SeasonState.PUBLISHED),
          "searchPage.seasonState",
        );
        assertThat(
          this.cut.searchPage.query,
          eq("some query"),
          "searchPage.query",
        );
        assertThat(
          rl,
          eqMessage(
            {
              search: {
                seasonState: SeasonState.PUBLISHED,
                query: "some query",
              },
            },
            PUBLISHER_PAGE_RL,
          ),
          "rl.search",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_page_search.png"),
          path.join(__dirname, "/golden/publisher_page_search.png"),
          path.join(__dirname, "/publisher_page_search_diff.png"),
        );

        // Execute
        this.cut.searchPage.emit("viewSeason", "season3");

        // Verify
        assertThat(
          this.cut.seasonDetailsPage.seasonId,
          eq("season3"),
          "seasonDetailsPage.seasonId after search",
        );
        assertThat(
          rl,
          eqMessage(
            {
              seasonDetails: {
                seasonId: "season3",
              },
            },
            PUBLISHER_PAGE_RL,
          ),
          "rl.seasonDetails after search",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/publisher_page_season_details_after_search.png",
          ),
          path.join(__dirname, "/golden/publisher_page_season_details.png"),
          path.join(
            __dirname,
            "/publisher_page_season_details_after_search_diff.png",
          ),
        );

        // Execute
        this.cut.seasonDetailsPage.emit("back");

        // Verify
        assertThat(
          rl,
          eqMessage(
            {
              search: {
                seasonState: SeasonState.PUBLISHED,
                query: "some query",
              },
            },
            PUBLISHER_PAGE_RL,
          ),
          "rl.search back from season details after search",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_page_back_from_season_details.png"),
          path.join(__dirname, "/golden/publisher_page_search.png"),
          path.join(
            __dirname,
            "/publisher_page_back_from_season_details_diff.png",
          ),
        );

        // Execute
        this.cut.searchPage.emit("searchSeasons", SeasonState.DRAFT, "My Hero");

        // Verify
        assertThat(
          this.cut.searchPage.seasonState,
          eq(SeasonState.DRAFT),
          "searchPage.seasonState after searchSeasons",
        );
        assertThat(
          this.cut.searchPage.query,
          eq("My Hero"),
          "searchPage.query after searchSeasons",
        );
        assertThat(
          rl,
          eqMessage(
            {
              search: {
                seasonState: SeasonState.DRAFT,
                query: "My Hero",
              },
            },
            PUBLISHER_PAGE_RL,
          ),
          "rl.search after searchSeasons",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_page_search_draft.png"),
          path.join(__dirname, "/golden/publisher_page_search_draft.png"),
          path.join(__dirname, "/publisher_page_search_draft_diff.png"),
        );

        // Execute
        this.cut.searchPage.emit("listSeasons", SeasonState.ARCHIVED);

        // Verify
        assertThat(
          this.cut.listPage.seasonState,
          eq(SeasonState.ARCHIVED),
          "listPage.seasonState after listSeasons from searchPage",
        );
        assertThat(
          rl,
          eqMessage(
            {
              list: {
                seasonState: SeasonState.ARCHIVED,
              },
            },
            PUBLISHER_PAGE_RL,
          ),
          "rl.list after listSeasons from searchPage",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_page_list_archived.png"),
          path.join(__dirname, "/golden/publisher_page_list_archived.png"),
          path.join(__dirname, "/publisher_page_list_archived_diff.png"),
        );

        // Execute
        this.cut.createSeasonButton.val.click();

        // Verify
        assertThat(
          rl,
          eqMessage(
            {
              create: {},
            },
            PUBLISHER_PAGE_RL,
          ),
          "rl.create",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_page_create.png"),
          path.join(__dirname, "/golden/publisher_page_create.png"),
          path.join(__dirname, "/publisher_page_create_diff.png"),
        );

        // Execute
        this.cut.createSeasonPage.emit("viewSeason", "season2");

        // Verify
        assertThat(
          this.cut.seasonDetailsPage.seasonId,
          eq("season2"),
          "seasonDetailsPage.seasonId after create",
        );
        assertThat(
          rl,
          eqMessage(
            {
              seasonDetails: {
                seasonId: "season2",
              },
            },
            PUBLISHER_PAGE_RL,
          ),
          "rl.seasonDetails",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/publisher_page_season_details_after_create.png",
          ),
          path.join(__dirname, "/golden/publisher_page_season_details.png"),
          path.join(
            __dirname,
            "/publisher_page_season_details_after_create_diff.png",
          ),
        );

        // Execute
        this.cut.seasonDetailsPage.emit("back");

        // Verify
        assertThat(
          rl,
          eqMessage(
            {
              list: {
                seasonState: SeasonState.ARCHIVED,
              },
            },
            PUBLISHER_PAGE_RL,
          ),
          "rl.list back from season details after create",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/publisher_page_back_from_season_details_after_create.png",
          ),
          path.join(__dirname, "/golden/publisher_page_list_archived.png"),
          path.join(
            __dirname,
            "/publisher_page_back_from_season_details_after_create_diff.png",
          ),
        );

        // Execute
        this.cut.statsButton.val.click();

        // Verify
        assertThat(rl, eqMessage({ usage: {} }, PUBLISHER_PAGE_RL), "rl.usage");
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_page_stats.png"),
          path.join(__dirname, "/golden/publisher_page_stats.png"),
          path.join(__dirname, "/publisher_page_stats_diff.png"),
        );

        // Prepare
        let goToAccount = false;
        this.cut.on("goToAccount", () => (goToAccount = true));

        // Execute
        this.cut.accountButton.val.click();

        // Verify
        assertThat(goToAccount, eq(true), "goToAccount");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyRl_Empty";
      private cut: PublisherPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createPublisherPage();

        // Execute
        this.cut.applyRl({});

        // Verify
        assertThat(Boolean(this.cut.listPage), eq(true), "listPage");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyRl_InvalidSearch";
      private cut: PublisherPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createPublisherPage();

        // Execute
        this.cut.applyRl({
          search: {
            seasonState: SeasonState.PUBLISHED,
          },
        });

        // Verify
        assertThat(Boolean(this.cut.listPage), eq(true), "listPage");

        // Execute
        this.cut.applyRl({
          search: {
            query: "My Hero",
          },
        });

        // Verify
        assertThat(Boolean(this.cut.listPage), eq(true), "listPage");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "ApplyRl_ListPage_SameStateSamePage_DifferentStateDifferentPage";
      private cut: PublisherPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createPublisherPage();

        // Execute
        this.cut.applyRl({
          list: {
            seasonState: SeasonState.PUBLISHED,
          },
        });

        // Verify
        assertThat(Boolean(this.cut.listPage), eq(true), "listPage");

        // Prepare
        let page = this.cut.listPage;

        // Execute
        this.cut.applyRl({
          list: {
            seasonState: SeasonState.PUBLISHED,
          },
        });

        // Verify
        assertThat(this.cut.listPage, eq(page), "listPage unchanged");

        // Execute
        this.cut.applyRl({
          list: {
            seasonState: SeasonState.DRAFT,
          },
        });

        // Verify
        assertThat(
          this.cut.listPage.seasonState,
          eq(SeasonState.DRAFT),
          "listPage.seasonState changed to DRAFT",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "ApplyRl_SearchPage_SameStateSamePage_DifferentStateDifferentPage";
      private cut: PublisherPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createPublisherPage();

        // Execute
        this.cut.applyRl({
          search: {
            seasonState: SeasonState.PUBLISHED,
            query: "My Hero",
          },
        });

        // Verify
        assertThat(Boolean(this.cut.searchPage), eq(true), "searchPage");

        // Prepare
        let page = this.cut.searchPage;

        // Execute
        this.cut.applyRl({
          search: {
            seasonState: SeasonState.PUBLISHED,
            query: "My Hero",
          },
        });

        // Verify
        assertThat(this.cut.searchPage, eq(page), "searchPage unchanged");

        // Execute
        this.cut.applyRl({
          search: {
            seasonState: SeasonState.DRAFT,
            query: "My Hero",
          },
        });

        // Verify
        assertThat(
          this.cut.searchPage.seasonState,
          eq(SeasonState.DRAFT),
          "searchPage.seasonState changed to DRAFT",
        );

        // Execute
        this.cut.applyRl({
          search: {
            seasonState: SeasonState.DRAFT,
            query: "My Hero 2",
          },
        });

        // Verify
        assertThat(
          this.cut.searchPage.query,
          eq("My Hero 2"),
          "searchPage.query changed to 'My Hero 2'",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyRl_CreatePage_SameRlSamePage";
      private cut: PublisherPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createPublisherPage();

        // Execute
        this.cut.applyRl({
          create: {},
        });

        // Verify
        assertThat(
          Boolean(this.cut.createSeasonPage),
          eq(true),
          "createSeasonPage",
        );

        // Prepare
        let page = this.cut.createSeasonPage;

        // Execute
        this.cut.applyRl({
          create: {},
        });

        // Verify
        assertThat(
          this.cut.createSeasonPage,
          eq(page),
          "createSeasonPage unchanged",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyRl_SeasonDetailsPage_SameRlSamePage";
      private cut: PublisherPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createPublisherPage();

        // Execute
        this.cut.applyRl({
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
        this.cut.applyRl({
          seasonDetails: {
            seasonId: "season1",
          },
        });

        // Verify
        assertThat(
          this.cut.seasonDetailsPage,
          eq(page),
          "seasonDetailsPage unchanged",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyRl_StatsPage_SameRlSamePage";
      private cut: PublisherPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createPublisherPage();

        // Execute
        this.cut.applyRl({
          usage: {},
        });

        // Verify
        assertThat(Boolean(this.cut.statsPage), eq(true), "statsPage");

        // Prepare
        let page = this.cut.statsPage;

        // Execute
        this.cut.applyRl({
          usage: {},
        });

        // Verify
        assertThat(this.cut.statsPage, eq(page), "statsPage unchanged");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
