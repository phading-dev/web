import "../../../dev/env";
import coverImage = require("../common/test_data/cover_tall.jpg");
import coverImage2 = require("../common/test_data/cover_tall2.jpg");
import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../common/view_port";
import { ListPage } from "./body";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import {
  LIST_SEASONS,
  LIST_SEASONS_REQUEST_BODY,
  ListSeasonsResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { mouseClick, mouseMove } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "ListPage",
  cases: [
    new (class implements TestCase {
      public name =
        "TabletView_ListAllSeasons_ScrolledToLoadMore_ScrolledToBottomAndNoMore_DesktopView_PhoneView_ViewSeason_SearchSeasons_ListSeasons";
      private cut: ListPage;
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
              state: SeasonState.PUBLISHED,
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
              state: SeasonState.TAKEN_DOWN,
              lastChangeTimeMs: new Date("2024-12-22T12:00:00Z").getTime(),
              grade: 180,
            },
            {
              seasonId: "season3",
              name: "Demon Slayer: Kimetsu no Yaiba Season 3",
              state: SeasonState.DRAFT,
              lastChangeTimeMs: new Date("2024-12-21T12:00:00Z").getTime(),
              grade: 100,
            },
            {
              seasonId: "season4",
              name: "My Hero Academia Season 6",
              state: SeasonState.ARCHIVED,
              lastChangeTimeMs: new Date("2024-12-20T12:00:00Z").getTime(),
              grade: 500,
            },
          ],
          lastChangeTimeCursor: 1000,
        } as ListSeasonsResponse;
        this.cut = new ListPage(
          serviceClientMock,
          () => new Date("2024-12-23T12:00:00Z"),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(LIST_SEASONS),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              limit: 10,
            },
            LIST_SEASONS_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_tablet_all.png"),
          path.join(__dirname, "/golden/list_page_tablet_all.png"),
          path.join(__dirname, "/list_page_tablet_all_diff.png"),
        );

        // Prepare
        serviceClientMock.request = undefined;
        serviceClientMock.response = {
          seasons: [
            {
              seasonId: "season5",
              name: "One Piece Season 1",
              totalPublishedEpisodes: 100,
              averageRating: 4.0,
              ratingsCount: 100000,
              state: SeasonState.PUBLISHED,
              lastChangeTimeMs: new Date("2024-12-19T12:00:00Z").getTime(),
              grade: 1000,
            },
          ],
        } as ListSeasonsResponse;

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              limit: 10,
              lastChangeTimeCursor: 1000,
            },
            LIST_SEASONS_REQUEST_BODY,
          ),
          "RC body 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_tablet_all_scrolled.png"),
          path.join(__dirname, "/golden/list_page_tablet_all_scrolled.png"),
          path.join(__dirname, "/list_page_tablet_all_scrolled_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_tablet_all_scrolled_bottom.png"),
          path.join(
            __dirname,
            "/golden/list_page_tablet_all_scrolled_bottom.png",
          ),
          path.join(
            __dirname,
            "/list_page_tablet_all_scrolled_bottom_diff.png",
          ),
        );

        // Execute
        await setDesktopView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_desktop_all.png"),
          path.join(__dirname, "/golden/list_page_desktop_all.png"),
          path.join(__dirname, "/list_page_desktop_all_diff.png"),
        );

        // Execute
        await setPhoneView();
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_phone_all.png"),
          path.join(__dirname, "/golden/list_page_phone_all.png"),
          path.join(__dirname, "/list_page_phone_all_diff.png"),
        );

        // Prepare
        let seasonId: string;
        this.cut.on("viewSeason", (id) => {
          seasonId = id;
        });

        // Execute
        await mouseClick(100, 200);

        // Verify
        assertThat(seasonId, eq("season4"), "seasonId");

        // Prepare
        let searchQuery: string;
        let searchState: SeasonState;
        this.cut.on("searchSeasons", (query, state) => {
          searchQuery = query;
          searchState = state;
        });

        // Execute
        this.cut.searchInput.val.emit(
          "search",
          "some query",
          SeasonState.PUBLISHED,
        );

        // Verify
        assertThat(searchQuery, eq("some query"), "search query");
        assertThat(searchState, eq(SeasonState.PUBLISHED), "list published");

        // Prepare
        let listState: SeasonState;
        this.cut.on("listSeasons", (state) => {
          listState = state;
        });

        // Execute
        this.cut.searchInput.val.emit("list", SeasonState.PUBLISHED);

        // Verify
        assertThat(listState, eq(SeasonState.PUBLISHED), "list published");
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_ListPublishedSeasons";
      private cut: ListPage;
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
              state: SeasonState.PUBLISHED,
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
              state: SeasonState.PUBLISHED,
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
              state: SeasonState.PUBLISHED,
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
              state: SeasonState.PUBLISHED,
              lastChangeTimeMs: new Date("2024-12-20T12:00:00Z").getTime(),
              grade: 500,
            },
          ],
          lastChangeTimeCursor: 1000,
        } as ListSeasonsResponse;
        this.cut = new ListPage(
          serviceClientMock,
          () => new Date("2024-12-23T12:00:00Z"),
          SeasonState.PUBLISHED,
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(LIST_SEASONS),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              state: SeasonState.PUBLISHED,
              limit: 10,
            },
            LIST_SEASONS_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_tablet_published.png"),
          path.join(__dirname, "/golden/list_page_tablet_published.png"),
          path.join(__dirname, "/list_page_tablet_published_diff.png"),
        );
      }
      public async tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_ListDraftSeasons";
      private cut: ListPage;
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
              state: SeasonState.DRAFT,
              lastChangeTimeMs: new Date("2024-12-23T12:00:00Z").getTime(),
              grade: 1800,
            },
            {
              seasonId: "season2",
              name: "Attack on Titan Season 4",
              coverImageUrl: coverImage2,
              state: SeasonState.DRAFT,
              lastChangeTimeMs: new Date("2024-12-22T12:00:00Z").getTime(),
              grade: 180,
            },
            {
              seasonId: "season3",
              name: "Demon Slayer: Kimetsu no Yaiba Season 3",
              state: SeasonState.DRAFT,
              lastChangeTimeMs: new Date("2024-12-21T12:00:00Z").getTime(),
              grade: 100,
            },
            {
              seasonId: "season4",
              name: "My Hero Academia Season 6",
              state: SeasonState.DRAFT,
              lastChangeTimeMs: new Date("2024-12-20T12:00:00Z").getTime(),
              grade: 500,
            },
          ],
          lastChangeTimeCursor: 1000,
        } as ListSeasonsResponse;
        this.cut = new ListPage(
          serviceClientMock,
          () => new Date("2024-12-23T12:00:00Z"),
          SeasonState.DRAFT,
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(LIST_SEASONS),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              state: SeasonState.DRAFT,
              limit: 10,
            },
            LIST_SEASONS_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_tablet_draft.png"),
          path.join(__dirname, "/golden/list_page_tablet_draft.png"),
          path.join(__dirname, "/list_page_tablet_draft_diff.png"),
        );
      }
      public async tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_ListArchivedSeasons";
      private cut: ListPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          seasons: [
            {
              seasonId: "season1",
              name: "Re-Zero: Starting Life in Another World Season 1",
              state: SeasonState.ARCHIVED,
              lastChangeTimeMs: new Date("2024-12-23T12:00:00Z").getTime(),
              grade: 1800,
            },
            {
              seasonId: "season2",
              name: "Attack on Titan Season 4",
              state: SeasonState.ARCHIVED,
              lastChangeTimeMs: new Date("2024-12-22T12:00:00Z").getTime(),
              grade: 180,
            },
            {
              seasonId: "season3",
              name: "Demon Slayer: Kimetsu no Yaiba Season 3",
              state: SeasonState.ARCHIVED,
              lastChangeTimeMs: new Date("2024-12-21T12:00:00Z").getTime(),
              grade: 100,
            },
            {
              seasonId: "season4",
              name: "My Hero Academia Season 6",
              state: SeasonState.ARCHIVED,
              lastChangeTimeMs: new Date("2024-12-20T12:00:00Z").getTime(),
              grade: 500,
            },
          ],
          lastChangeTimeCursor: 1000,
        } as ListSeasonsResponse;
        this.cut = new ListPage(
          serviceClientMock,
          () => new Date("2024-12-23T12:00:00Z"),
          SeasonState.ARCHIVED,
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(LIST_SEASONS),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              state: SeasonState.ARCHIVED,
              limit: 10,
            },
            LIST_SEASONS_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_tablet_archived.png"),
          path.join(__dirname, "/golden/list_page_tablet_archived.png"),
          path.join(__dirname, "/list_page_tablet_archived_diff.png"),
        );
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_ListTakenDownSeasons";
      private cut: ListPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          seasons: [
            {
              seasonId: "season1",
              name: "Re-Zero: Starting Life in Another World Season 1",
              state: SeasonState.TAKEN_DOWN,
              lastChangeTimeMs: new Date("2024-12-23T12:00:00Z").getTime(),
              grade: 1800,
            },
            {
              seasonId: "season2",
              name: "Attack on Titan Season 4",
              state: SeasonState.TAKEN_DOWN,
              lastChangeTimeMs: new Date("2024-12-22T12:00:00Z").getTime(),
              grade: 180,
            },
            {
              seasonId: "season3",
              name: "Demon Slayer: Kimetsu no Yaiba Season 3",
              state: SeasonState.TAKEN_DOWN,
              lastChangeTimeMs: new Date("2024-12-21T12:00:00Z").getTime(),
              grade: 100,
            },
            {
              seasonId: "season4",
              name: "My Hero Academia Season 6",
              state: SeasonState.TAKEN_DOWN,
              lastChangeTimeMs: new Date("2024-12-20T12:00:00Z").getTime(),
              grade: 500,
            },
          ],
          lastChangeTimeCursor: 1000,
        } as ListSeasonsResponse;
        this.cut = new ListPage(
          serviceClientMock,
          () => new Date("2024-12-23T12:00:00Z"),
          SeasonState.TAKEN_DOWN,
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(LIST_SEASONS),
          "RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              state: SeasonState.TAKEN_DOWN,
              limit: 10,
            },
            LIST_SEASONS_REQUEST_BODY,
          ),
          "RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_tablet_taken_down.png"),
          path.join(__dirname, "/golden/list_page_tablet_taken_down.png"),
          path.join(__dirname, "/list_page_tablet_taken_down_diff.png"),
        );
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
  ],
});
