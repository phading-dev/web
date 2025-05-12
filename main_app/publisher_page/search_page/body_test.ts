import "../../../dev/env";
import coverImage = require("../common/test_data/cover_tall.jpg");
import coverImage2 = require("../common/test_data/cover_tall2.jpg");
import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { setTabletView } from "../../../common/view_port";
import { SearchPage } from "./body";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import {
  SEARCH_SEASONS,
  SEARCH_SEASONS_REQUEST_BODY,
  SearchSeasonsResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { mouseClick } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "SearchPage",
  cases: [
    new (class implements TestCase {
      public name =
        "TabletView_SearchPublishedSeasons_ScrolledToLoadMore_ScrolledToBottomAndNoMore";
      private cut: SearchPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          seasons: [
            {
              seasonId: "season1",
              name: "Re-Zero: Starting Life in Another World Season 1",
              coverImageUrl: coverImage,
              totalPublishedEpisodes: 25,
              averageRating: 4.52,
              ratingsCount: 12345,
              lastChangeTimeMs: new Date("2024-12-23T12:00:00Z").getTime(),
              grade: 180,
            },
            {
              seasonId: "season2",
              name: "Attack on Titan Season 4",
              coverImageUrl: coverImage2,
              totalPublishedEpisodes: 16,
              averageRating: 4.8,
              ratingsCount: 20000,
              lastChangeTimeMs: new Date("2024-12-22T12:00:00Z").getTime(),
              grade: 18,
            },
            {
              seasonId: "season3",
              name: "Demon Slayer: Kimetsu no Yaiba Season 3",
              coverImageUrl: coverImage,
              totalPublishedEpisodes: 11,
              averageRating: 4.9,
              ratingsCount: 15,
              lastChangeTimeMs: new Date("2024-12-21T12:00:00Z").getTime(),
              grade: 10,
            },
            {
              seasonId: "season4",
              name: "My Hero Academia Season 6",
              coverImageUrl: coverImage2,
              totalPublishedEpisodes: 25,
              averageRating: 4.7,
              ratingsCount: 5000,
              lastChangeTimeMs: new Date("2024-12-20T12:00:00Z").getTime(),
              grade: 50,
            },
          ],
          scoreCursor: 1.2,
          createdTimeCursor: 1000,
        } as SearchSeasonsResponse;
        this.cut = new SearchPage(
          serviceClientMock,
          () => new Date("2024-12-23T12:00:00Z"),
          SeasonState.PUBLISHED,
          "some query",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(SEARCH_SEASONS),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              state: SeasonState.PUBLISHED,
              query: "some query",
              limit: 10,
            },
            SEARCH_SEASONS_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/search_page_tablet_published.png"),
          path.join(__dirname, "/golden/search_page_tablet_published.png"),
          path.join(__dirname, "/search_page_tablet_published_diff.png"),
        );

        // Prepare
        serviceClientMock.request = undefined;
        serviceClientMock.response = {
          seasons: [
            {
              seasonId: "season5",
              name: "One Piece Season 1",
              coverImageUrl: coverImage,
              totalPublishedEpisodes: 100,
              averageRating: 4.0,
              ratingsCount: 100000,
              lastChangeTimeMs: new Date("2024-12-19T12:00:00Z").getTime(),
              grade: 100,
            },
          ],
        } as SearchSeasonsResponse;

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              state: SeasonState.PUBLISHED,
              query: "some query",
              limit: 10,
              scoreCursor: 1.2,
              createdTimeCursor: 1000,
            },
            SEARCH_SEASONS_REQUEST_BODY,
          ),
          "RC body 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/search_page_tablet_published_scrolled.png"),
          path.join(
            __dirname,
            "/golden/search_page_tablet_published_scrolled.png",
          ),
          path.join(
            __dirname,
            "/search_page_tablet_published_scrolled_diff.png",
          ),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/search_page_tablet_published_scrolled_bottom.png",
          ),
          path.join(
            __dirname,
            "/golden/search_page_tablet_published_scrolled_bottom.png",
          ),
          path.join(
            __dirname,
            "/search_page_tablet_published_scrolled_bottom_diff.png",
          ),
        );

        // Prepare
        let seasonId: string;
        this.cut.on("showDetails", (id) => {
          seasonId = id;
        });

        // Execute
        await mouseClick(100, 100);

        // Verify
        assertThat(seasonId, eq("season3"), "seasonId");
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "TabletView_SearchDraftSeasons_ScrolledToLoadMore_ScrolledToBottomAndNoMore";
      private cut: SearchPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          seasons: [
            {
              seasonId: "season1",
              name: "Re-Zero: Starting Life in Another World Season 1",
              coverImageUrl: coverImage,
              lastChangeTimeMs: new Date("2024-12-23T12:00:00Z").getTime(),
              grade: 180,
            },
            {
              seasonId: "season2",
              name: "Attack on Titan Season 4",
              coverImageUrl: coverImage2,
              lastChangeTimeMs: new Date("2024-12-22T12:00:00Z").getTime(),
              grade: 18,
            },
            {
              seasonId: "season3",
              name: "Demon Slayer: Kimetsu no Yaiba Season 3",
              lastChangeTimeMs: new Date("2024-12-21T12:00:00Z").getTime(),
              grade: 10,
            },
            {
              seasonId: "season4",
              name: "My Hero Academia Season 6",
              lastChangeTimeMs: new Date("2024-12-20T12:00:00Z").getTime(),
              grade: 50,
            },
          ],
          scoreCursor: 1.2,
          createdTimeCursor: 1000,
        } as SearchSeasonsResponse;
        this.cut = new SearchPage(
          serviceClientMock,
          () => new Date("2024-12-23T12:00:00Z"),
          SeasonState.DRAFT,
          "some query",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(SEARCH_SEASONS),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              state: SeasonState.DRAFT,
              query: "some query",
              limit: 10,
            },
            SEARCH_SEASONS_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/search_page_tablet_draft.png"),
          path.join(__dirname, "/golden/search_page_tablet_draft.png"),
          path.join(__dirname, "/search_page_tablet_draft_diff.png"),
        );

        // Prepare
        serviceClientMock.request = undefined;
        serviceClientMock.response = {
          seasons: [
            {
              seasonId: "season5",
              name: "One Piece Season 1",
              coverImageUrl: coverImage,
              lastChangeTimeMs: new Date("2024-12-19T12:00:00Z").getTime(),
              grade: 100,
            },
          ],
        } as SearchSeasonsResponse;

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              state: SeasonState.DRAFT,
              query: "some query",
              limit: 10,
              scoreCursor: 1.2,
              createdTimeCursor: 1000,
            },
            SEARCH_SEASONS_REQUEST_BODY,
          ),
          "RC body 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/search_page_tablet_draft_scrolled.png"),
          path.join(__dirname, "/golden/search_page_tablet_draft_scrolled.png"),
          path.join(__dirname, "/search_page_tablet_draft_scrolled_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/search_page_tablet_draft_scrolled_bottom.png"),
          path.join(
            __dirname,
            "/golden/search_page_tablet_draft_scrolled_bottom.png",
          ),
          path.join(
            __dirname,
            "/search_page_tablet_draft_scrolled_bottom_diff.png",
          ),
        );

        // Prepare
        let seasonId: string;
        this.cut.on("showDetails", (id) => {
          seasonId = id;
        });

        // Execute
        await mouseClick(100, 100);

        // Verify
        assertThat(seasonId, eq("season3"), "seasonId");
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "TabletView_SearchArchivedSeasons_ScrolledToLoadMore_ScrolledToBottomAndNoMore";
      private cut: SearchPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          seasons: [
            {
              seasonId: "season1",
              name: "Re-Zero: Starting Life in Another World Season 1",
              lastChangeTimeMs: new Date("2024-12-23T12:00:00Z").getTime(),
              grade: 180,
            },
            {
              seasonId: "season2",
              name: "Attack on Titan Season 4",
              lastChangeTimeMs: new Date("2024-12-22T12:00:00Z").getTime(),
              grade: 18,
            },
            {
              seasonId: "season3",
              name: "Demon Slayer: Kimetsu no Yaiba Season 3",
              lastChangeTimeMs: new Date("2024-12-21T12:00:00Z").getTime(),
              grade: 10,
            },
            {
              seasonId: "season4",
              name: "My Hero Academia Season 6",
              lastChangeTimeMs: new Date("2024-12-20T12:00:00Z").getTime(),
              grade: 50,
            },
            {
              seasonId: "season5",
              name: "One Piece Season 1",
              lastChangeTimeMs: new Date("2024-12-19T12:00:00Z").getTime(),
              grade: 100,
            },
            {
              seasonId: "season6",
              name: "Naruto Shippuden Season 1",
              lastChangeTimeMs: new Date("2024-12-18T12:00:00Z").getTime(),
              grade: 90,
            },
            {
              seasonId: "season7",
              name: "Bleach: Thousand-Year Blood War",
              lastChangeTimeMs: new Date("2024-12-17T12:00:00Z").getTime(),
              grade: 85,
            },
            {
              seasonId: "season8",
              name: "Sword Art Online Season 3",
              lastChangeTimeMs: new Date("2024-12-16T12:00:00Z").getTime(),
              grade: 75,
            },
            {
              seasonId: "season9",
              name: "Dragon Ball Super",
              lastChangeTimeMs: new Date("2024-12-15T12:00:00Z").getTime(),
              grade: 95,
            },
          ],
          scoreCursor: 1.2,
          createdTimeCursor: 1000,
        } as SearchSeasonsResponse;
        this.cut = new SearchPage(
          serviceClientMock,
          () => new Date("2024-12-23T12:00:00Z"),
          SeasonState.ARCHIVED,
          "some query",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(SEARCH_SEASONS),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              state: SeasonState.ARCHIVED,
              query: "some query",
              limit: 10,
            },
            SEARCH_SEASONS_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/search_page_tablet_archived.png"),
          path.join(__dirname, "/golden/search_page_tablet_archived.png"),
          path.join(__dirname, "/search_page_tablet_archived_diff.png"),
        );

        // Prepare
        serviceClientMock.request = undefined;
        serviceClientMock.response = {
          seasons: [
            {
              seasonId: "season10",
              name: "Tokyo Ghoul Season 1",
              lastChangeTimeMs: new Date("2024-12-14T12:00:00Z").getTime(),
              grade: 70,
            },
          ],
        } as SearchSeasonsResponse;

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              state: SeasonState.ARCHIVED,
              query: "some query",
              limit: 10,
              scoreCursor: 1.2,
              createdTimeCursor: 1000,
            },
            SEARCH_SEASONS_REQUEST_BODY,
          ),
          "RC body 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/search_page_tablet_archived_scrolled.png"),
          path.join(
            __dirname,
            "/golden/search_page_tablet_archived_scrolled.png",
          ),
          path.join(
            __dirname,
            "/search_page_tablet_archived_scrolled_diff.png",
          ),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/search_page_tablet_archived_scrolled_bottom.png",
          ),
          path.join(
            __dirname,
            "/golden/search_page_tablet_archived_scrolled_bottom.png",
          ),
          path.join(
            __dirname,
            "/search_page_tablet_archived_scrolled_bottom_diff.png",
          ),
        );
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
  ],
});
