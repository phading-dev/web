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
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import { mouseClick } from "@selfage/puppeteer_test_executor_api";

normalizeBody();

TEST_RUNNER.run({
  name: "ListPage",
  cases: [
    new (class implements TestCase {
      public name =
        "TabletView_ListPublishedSeasons_ScrolledToLoadMore_ScrolledToBottomAndNoMore_DesktopView_PhoneView";
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
        } as ListSeasonsResponse;

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              state: SeasonState.PUBLISHED,
              limit: 10,
              lastChangeTimeCursor: 1000,
            },
            LIST_SEASONS_REQUEST_BODY,
          ),
          "RC body 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_tablet_published_scrolled.png"),
          path.join(
            __dirname,
            "/golden/list_page_tablet_published_scrolled.png",
          ),
          path.join(__dirname, "/list_page_tablet_published_scrolled_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/list_page_tablet_published_scrolled_bottom.png",
          ),
          path.join(
            __dirname,
            "/golden/list_page_tablet_published_scrolled_bottom.png",
          ),
          path.join(
            __dirname,
            "/list_page_tablet_published_scrolled_bottom_diff.png",
          ),
        );

        // Execute
        await setDesktopView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_desktop_published.png"),
          path.join(__dirname, "/golden/list_page_desktop_published.png"),
          path.join(__dirname, "/list_page_desktop_published_diff.png"),
        );

        // Execute
        await setPhoneView();
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_phone_published.png"),
          path.join(__dirname, "/golden/list_page_phone_published.png"),
          path.join(__dirname, "/list_page_phone_published_diff.png"),
        );

        // Prepare
        let seasonId: string;
        this.cut.on("showDetails", (id) => {
          seasonId = id;
        });

        // Execute
        await mouseClick(100, 200);

        // Verify
        assertThat(seasonId, eq("season4"), "seasonId");
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "TabletView_ListDraftSeasons_ScrolledToLoadMore_ScrolledToBottomAndNoMore_DesktopView_PhoneView";
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
        } as ListSeasonsResponse;

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              state: SeasonState.DRAFT,
              limit: 10,
              lastChangeTimeCursor: 1000,
            },
            LIST_SEASONS_REQUEST_BODY,
          ),
          "RC body 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_tablet_draft_scrolled.png"),
          path.join(__dirname, "/golden/list_page_tablet_draft_scrolled.png"),
          path.join(__dirname, "/list_page_tablet_draft_scrolled_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_tablet_draft_scrolled_bottom.png"),
          path.join(
            __dirname,
            "/golden/list_page_tablet_draft_scrolled_bottom.png",
          ),
          path.join(
            __dirname,
            "/list_page_tablet_draft_scrolled_bottom_diff.png",
          ),
        );

        // Execute
        await setDesktopView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_desktop_draft.png"),
          path.join(__dirname, "/golden/list_page_desktop_draft.png"),
          path.join(__dirname, "/list_page_desktop_draft_diff.png"),
        );

        // Execute
        await setPhoneView();
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_phone_draft.png"),
          path.join(__dirname, "/golden/list_page_phone_draft.png"),
          path.join(__dirname, "/list_page_phone_draft_diff.png"),
        );

        // Prepare
        let seasonId: string;
        this.cut.on("showDetails", (id) => {
          seasonId = id;
        });

        // Execute
        await mouseClick(100, 200);

        // Verify
        assertThat(seasonId, eq("season4"), "seasonId");
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "TabletView_ListArchivedSeasons_ScrolledToLoadMore_ScrolledToBottomAndNoMore_DesktopView_PhoneView";
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
        } as ListSeasonsResponse;

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              state: SeasonState.ARCHIVED,
              limit: 10,
              lastChangeTimeCursor: 1000,
            },
            LIST_SEASONS_REQUEST_BODY,
          ),
          "RC body 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_tablet_archived_scrolled.png"),
          path.join(
            __dirname,
            "/golden/list_page_tablet_archived_scrolled.png",
          ),
          path.join(__dirname, "/list_page_tablet_archived_scrolled_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/list_page_tablet_archived_scrolled_bottom.png",
          ),
          path.join(
            __dirname,
            "/golden/list_page_tablet_archived_scrolled_bottom.png",
          ),
          path.join(
            __dirname,
            "/list_page_tablet_archived_scrolled_bottom_diff.png",
          ),
        );

        // Execute
        await setDesktopView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_desktop_archived.png"),
          path.join(__dirname, "/golden/list_page_desktop_archived.png"),
          path.join(__dirname, "/list_page_desktop_archived_diff.png"),
        );

        // Execute
        await setPhoneView();
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/list_page_phone_archived.png"),
          path.join(__dirname, "/golden/list_page_phone_archived.png"),
          path.join(__dirname, "/list_page_phone_archived_diff.png"),
        );
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
  ],
});
