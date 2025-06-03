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
import { mouseClick, mouseMove } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

class SearchInputTestCase implements TestCase {
  public constructor(
    public name: string,
    private value: string,
    private clickOption: (cut: SearchPage) => void,
    private action: (cut: SearchPage) => void,
    private expectedSeasonState: SeasonState,
    private expectedQuery: string,
  ) {}
  public async execute() {
    // Prepare
    let cut = SearchPage.create(SeasonState.PUBLISHED, "");
    let seasonState: SeasonState;
    let query: string;
    cut.on("searchSeasons", (seasonState_, query_) => {
      seasonState = seasonState_;
      query = query_;
    });

    // Execute
    cut.searchInput.val.value = this.value;
    this.clickOption(cut);
    this.action(cut);

    // Verify
    assertThat(seasonState, eq(this.expectedSeasonState), "seasonState");
    assertThat(query, eq(this.expectedQuery), "query");
  }
}

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
              grade: 1800,
            },
            {
              seasonId: "season2",
              name: "Attack on Titan Season 4",
              coverImageUrl: coverImage2,
              totalPublishedEpisodes: 16,
              averageRating: 4.8,
              ratingsCount: 20000,
              lastChangeTimeMs: new Date("2024-12-22T12:00:00Z").getTime(),
              grade: 180,
            },
            {
              seasonId: "season3",
              name: "Demon Slayer: Kimetsu no Yaiba Season 3",
              coverImageUrl: coverImage,
              totalPublishedEpisodes: 11,
              averageRating: 4.9,
              ratingsCount: 15,
              lastChangeTimeMs: new Date("2024-12-21T12:00:00Z").getTime(),
              grade: 100,
            },
            {
              seasonId: "season4",
              name: "My Hero Academia Season 6",
              coverImageUrl: coverImage2,
              totalPublishedEpisodes: 25,
              averageRating: 4.7,
              ratingsCount: 5000,
              lastChangeTimeMs: new Date("2024-12-20T12:00:00Z").getTime(),
              grade: 500,
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
              grade: 1000,
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
        this.cut.on("showSeason", (id) => {
          seasonId = id;
        });

        // Execute
        await mouseClick(100, 100);

        // Verify
        assertThat(seasonId, eq("season3"), "seasonId");
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
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
              grade: 1800,
            },
            {
              seasonId: "season2",
              name: "Attack on Titan Season 4",
              coverImageUrl: coverImage2,
              lastChangeTimeMs: new Date("2024-12-22T12:00:00Z").getTime(),
              grade: 180,
            },
            {
              seasonId: "season3",
              name: "Demon Slayer: Kimetsu no Yaiba Season 3",
              lastChangeTimeMs: new Date("2024-12-21T12:00:00Z").getTime(),
              grade: 100,
            },
            {
              seasonId: "season4",
              name: "My Hero Academia Season 6",
              lastChangeTimeMs: new Date("2024-12-20T12:00:00Z").getTime(),
              grade: 500,
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
              grade: 1000,
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
        this.cut.on("showSeason", (id) => {
          seasonId = id;
        });

        // Execute
        await mouseClick(100, 100);

        // Verify
        assertThat(seasonId, eq("season3"), "seasonId");
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
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
              grade: 1800,
            },
            {
              seasonId: "season2",
              name: "Attack on Titan Season 4",
              lastChangeTimeMs: new Date("2024-12-22T12:00:00Z").getTime(),
              grade: 180,
            },
            {
              seasonId: "season3",
              name: "Demon Slayer: Kimetsu no Yaiba Season 3",
              lastChangeTimeMs: new Date("2024-12-21T12:00:00Z").getTime(),
              grade: 100,
            },
            {
              seasonId: "season4",
              name: "My Hero Academia Season 6",
              lastChangeTimeMs: new Date("2024-12-20T12:00:00Z").getTime(),
              grade: 500,
            },
            {
              seasonId: "season5",
              name: "One Piece Season 1",
              lastChangeTimeMs: new Date("2024-12-19T12:00:00Z").getTime(),
              grade: 1000,
            },
            {
              seasonId: "season6",
              name: "Naruto Shippuden Season 1",
              lastChangeTimeMs: new Date("2024-12-18T12:00:00Z").getTime(),
              grade: 900,
            },
            {
              seasonId: "season7",
              name: "Bleach: Thousand-Year Blood War",
              lastChangeTimeMs: new Date("2024-12-17T12:00:00Z").getTime(),
              grade: 850,
            },
            {
              seasonId: "season8",
              name: "Sword Art Online Season 3",
              lastChangeTimeMs: new Date("2024-12-16T12:00:00Z").getTime(),
              grade: 750,
            },
            {
              seasonId: "season9",
              name: "Dragon Ball Super",
              lastChangeTimeMs: new Date("2024-12-15T12:00:00Z").getTime(),
              grade: 950,
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
              grade: 700,
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
    new (class implements TestCase {
      public name = "TabletView_EmptyQuery";
      private cut: SearchPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = new SearchPage(
          undefined,
          () => new Date("2024-12-23T12:00:00Z"),
          SeasonState.PUBLISHED,
          "",
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/search_page_tablet_empty_query.png"),
          path.join(__dirname, "/golden/search_page_tablet_empty_query.png"),
          path.join(__dirname, "/search_page_tablet_empty_query_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new SearchInputTestCase(
      "SearchInput_Published_Enter",
      "some query",
      (cut) => cut.searchOptionPublished.val.click(),
      (cut) => cut.searchInput.val.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" })),
      SeasonState.PUBLISHED,
      "some query",
    ),
    new SearchInputTestCase(
      "SearchInput_Draft_ClickButton",
      "some query",
      (cut) => cut.searchOptionDraft.val.click(),
      (cut) => cut.searchActionButton.val.click(),
      SeasonState.DRAFT,
      "some query",
    ),
    new SearchInputTestCase(
      "SearchInput_Archived_ClickButton",
      "some query",
      (cut) => cut.searchOptionArchived.val.click(),
      (cut) => cut.searchActionButton.val.click(),
      SeasonState.ARCHIVED,
      "some query",
    ),
    new SearchInputTestCase(
      "SearchInput_Published_EmptyQuery",
      "",
      (cut) => cut.searchOptionPublished.val.click(),
      (cut) => cut.searchActionButton.val.click(),
      undefined,
      undefined,
    ),
  ],
});
