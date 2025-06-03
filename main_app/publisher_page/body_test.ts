import "../../dev/env";
import coverImage = require("./common/test_data/cover_tall.jpg");
import path = require("path");
import { normalizeBody } from "../../common/normalize_body";
import { setTabletView } from "../../common/view_port";
import { PublisherPage } from "./body";
import { CreateSeasonPage } from "./create_season_page/body";
import { ListPageMock } from "./list_page/body_mock";
import { SearchPageMock } from "./search_page/body_mock";
import { SeasonDetailsPageMock } from "./season_details_page/body_mock";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { SeasonDetails } from "@phading/product_service_interface/show/web/publisher/details";
import { SeasonSummary } from "@phading/product_service_interface/show/web/publisher/summary";
import {
  PUBLISHER_PAGE,
  PublisherPage as PublisherPageUrl,
} from "@phading/web_interface/main/publisher/page";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

let SEASONS: Array<SeasonSummary> = [
  {
    seasonId: "season1",
    name: "Re-Zero: Starting Life in Another World Season 1",
    coverImageUrl: coverImage,
    totalPublishedEpisodes: 25,
    averageRating: 4.52,
    ratingsCount: 12345,
    lastChangeTimeMs: new Date("2024-12-23T12:00:00Z").getTime(),
    grade: 1800,
  },
];
let SEASON_DETAILS: SeasonDetails = {
  name: "Re-Zero: Starting Life in Another World Season 1",
  description: "",
  state: SeasonState.DRAFT,
  grade: 1,
  nextGrade: {
    grade: 2,
  },
  totalPublishedEpisodes: 0,
  lastChangeTimeMs: new Date("2024-12-01T18:00:00Z").getTime(),
  createdTimeMs: new Date("2024-01-01T12:00:00Z").getTime(),
};

function createPublisherPage(): PublisherPage {
  let nowDate = new Date("2023-10-10T00:00:00Z");
  return new PublisherPage(
    () => new CreateSeasonPage(undefined),
    (seasonState) => new ListPageMock(SEASONS, () => nowDate, seasonState),
    (seasonState, query) =>
      new SearchPageMock(SEASONS, () => nowDate, seasonState, query),
    (appendBodies, seasonId) =>
      new SeasonDetailsPageMock(
        SEASON_DETAILS,
        () => nowDate,
        appendBodies,
        seasonId,
      ),
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
        let newUrl: PublisherPageUrl;
        this.cut.on("newUrl", (url) => (newUrl = url));

        // Execute
        this.cut.applyUrl();

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
        this.cut.listPage.emit("showSeason", "season1");

        // Verify
        assertThat(
          this.cut.seasonDetailsPage.seasonId,
          eq("season1"),
          "seasonDetailsPage.seasonId",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              seasonDetails: {
                seasonId: "season1",
              },
            },
            PUBLISHER_PAGE,
          ),
          "newUrl.seasonDetails",
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
          newUrl,
          eqMessage(
            {
              list: {
                seasonState: SeasonState.PUBLISHED,
              },
            },
            PUBLISHER_PAGE,
          ),
          "newUrl.list back from season details",
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
          newUrl,
          eqMessage(
            {
              list: {
                seasonState: SeasonState.DRAFT,
              },
            },
            PUBLISHER_PAGE,
          ),
          "newUrl.list after listSeasons",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_page_list_draft.png"),
          path.join(__dirname, "/golden/publisher_page_list_draft.png"),
          path.join(__dirname, "/publisher_page_list_draft_diff.png"),
        );

        // Execute
        this.cut.searchButton.val.click();

        // Verify
        assertThat(
          this.cut.searchPage.seasonState,
          eq(SeasonState.PUBLISHED),
          "searchPage.seasonState",
        );
        assertThat(this.cut.searchPage.query, eq(""), "searchPage.query");
        assertThat(
          newUrl,
          eqMessage(
            {
              search: {
                seasonState: SeasonState.PUBLISHED,
                query: "",
              },
            },
            PUBLISHER_PAGE,
          ),
          "newUrl.search",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_page_search.png"),
          path.join(__dirname, "/golden/publisher_page_search.png"),
          path.join(__dirname, "/publisher_page_search_diff.png"),
        );

        // Execute
        this.cut.searchPage.emit("showSeason", "season3");

        // Verify
        assertThat(
          this.cut.seasonDetailsPage.seasonId,
          eq("season3"),
          "seasonDetailsPage.seasonId after search",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              seasonDetails: {
                seasonId: "season3",
              },
            },
            PUBLISHER_PAGE,
          ),
          "newUrl.seasonDetails after search",
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
          newUrl,
          eqMessage(
            {
              search: {
                seasonState: SeasonState.DRAFT,
                query: "My Hero",
              },
            },
            PUBLISHER_PAGE,
          ),
          "newUrl.search after searchSeasons",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_page_search_after_search.png"),
          path.join(
            __dirname,
            "/golden/publisher_page_search_after_search.png",
          ),
          path.join(__dirname, "/publisher_page_search_after_search_diff.png"),
        );

        // Execute
        this.cut.createSeasonButton.val.click();

        // Verify
        assertThat(
          newUrl,
          eqMessage(
            {
              create: {},
            },
            PUBLISHER_PAGE,
          ),
          "newUrl.create",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_page_create.png"),
          path.join(__dirname, "/golden/publisher_page_create.png"),
          path.join(__dirname, "/publisher_page_create_diff.png"),
        );

        // Execute
        this.cut.createSeasonPage.emit("showSeason", "season2");

        // Verify
        assertThat(
          this.cut.seasonDetailsPage.seasonId,
          eq("season2"),
          "seasonDetailsPage.seasonId after create",
        );
        assertThat(
          newUrl,
          eqMessage(
            {
              seasonDetails: {
                seasonId: "season2",
              },
            },
            PUBLISHER_PAGE,
          ),
          "newUrl.seasonDetails",
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
          newUrl,
          eqMessage(
            {
              create: {},
            },
            PUBLISHER_PAGE,
          ),
          "newUrl.create back from season details after create",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/publisher_page_back_from_season_details_after_create.png",
          ),
          path.join(__dirname, "/golden/publisher_page_create.png"),
          path.join(
            __dirname,
            "/publisher_page_back_from_season_details_after_create_diff.png",
          ),
        );
      }
      public async beforeEach() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_Empty";
      private cut: PublisherPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createPublisherPage();

        // Execute
        this.cut.applyUrl({});

        // Verify
        assertThat(Boolean(this.cut.listPage), eq(true), "listPage");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_InvalidSearch";
      private cut: PublisherPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createPublisherPage();

        // Execute
        this.cut.applyUrl({
          search: {},
        });

        // Verify
        assertThat(Boolean(this.cut.listPage), eq(true), "listPage");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_InvalidSeasonDetails";
      private cut: PublisherPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createPublisherPage();

        // Execute
        this.cut.applyUrl({
          seasonDetails: {},
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
        "ApplyUrl_ListPage_SameStateSamePage_DifferentStateDifferentPage";
      private cut: PublisherPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createPublisherPage();

        // Execute
        this.cut.applyUrl({
          list: {
            seasonState: SeasonState.PUBLISHED,
          },
        });

        // Verify
        assertThat(Boolean(this.cut.listPage), eq(true), "listPage");

        // Prepare
        let page = this.cut.listPage;

        // Execute
        this.cut.applyUrl({
          list: {
            seasonState: SeasonState.PUBLISHED,
          },
        });

        // Verify
        assertThat(this.cut.listPage, eq(page), "listPage unchanged");

        // Execute
        this.cut.applyUrl({
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
        "ApplyUrl_SearchPage_SameStateSamePage_DifferentStateDifferentPage";
      private cut: PublisherPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createPublisherPage();

        // Execute
        this.cut.applyUrl({
          search: {
            seasonState: SeasonState.PUBLISHED,
          },
        });

        // Verify
        assertThat(Boolean(this.cut.searchPage), eq(true), "searchPage");

        // Prepare
        let page = this.cut.searchPage;

        // Execute
        this.cut.applyUrl({
          search: {
            seasonState: SeasonState.PUBLISHED,
            query: "",
          },
        });

        // Verify
        assertThat(this.cut.searchPage, eq(page), "searchPage unchanged");

        // Execute
        this.cut.applyUrl({
          search: {
            seasonState: SeasonState.DRAFT,
          },
        });

        // Verify
        assertThat(
          this.cut.searchPage.seasonState,
          eq(SeasonState.DRAFT),
          "searchPage.seasonState changed to DRAFT",
        );

        // Execute
        this.cut.applyUrl({
          search: {
            seasonState: SeasonState.DRAFT,
            query: "My Hero",
          },
        });

        // Verify
        assertThat(
          this.cut.searchPage.query,
          eq("My Hero"),
          "searchPage.query changed to 'My Hero'",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ApplyUrl_CreatePage_SameUrlSamePage";
      private cut: PublisherPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createPublisherPage();

        // Execute
        this.cut.applyUrl({
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
        this.cut.applyUrl({
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
      public name = "ApplyUrl_SeasonDetailsPage_SameUrlSamePage";
      private cut: PublisherPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createPublisherPage();

        // Execute
        this.cut.applyUrl({
          seasonDetails: {
            seasonId: "season1",
          }
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
          "seasonDetailsPage unchanged",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
