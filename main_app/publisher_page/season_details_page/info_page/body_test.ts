import "../../../../dev/env";
import coverImage = require("../../common/test_data/cover_tall.jpg");
import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../../common/view_port";
import { InfoPage } from "./body";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import {
  GET_SEASON,
  GET_SEASON_REQUEST_BODY,
  GetSeasonRequestBody,
  GetSeasonResponse,
  LIST_DRAFT_EPISODES,
  LIST_DRAFT_EPISODES_REQUEST_BODY,
  LIST_PUBLISHED_EPISODES,
  LIST_PUBLISHED_EPISODES_REQUEST_BODY,
  ListDraftEpisodesRequestBody,
  ListDraftEpisodesResponse,
  ListPublishedEpisodesRequestBody,
  ListPublishedEpisodesResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { assertThat, eq, isArray } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

class InfoPageServiceClientMock extends WebServiceClientMock {
  public getSeasonRequest: GetSeasonRequestBody;
  public getSeasonResponse: GetSeasonResponse;
  public listDraftEpisodesRequest: ListDraftEpisodesRequestBody;
  public listDraftEpisodesResponse: ListDraftEpisodesResponse;
  public listPublishedEpisodesRequests =
    new Array<ListPublishedEpisodesRequestBody>();
  public listPublishedEpisodesResponse: ListPublishedEpisodesResponse;

  public async send(request: ClientRequestInterface<any>): Promise<any> {
    switch (request.descriptor) {
      case GET_SEASON:
        this.getSeasonRequest = request.body;
        return this.getSeasonResponse;
      case LIST_DRAFT_EPISODES:
        this.listDraftEpisodesRequest = request.body;
        return this.listDraftEpisodesResponse;
      case LIST_PUBLISHED_EPISODES:
        this.listPublishedEpisodesRequests.push(request.body);
        return this.listPublishedEpisodesResponse;
      default:
        throw new Error(`Unknown request: ${request.descriptor.name}`);
    }
  }
}

TEST_RUNNER.run({
  name: "SeasonDetailsInfoPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "TabletView_DraftSeasonWithoutEpisodes_DesktopView_PhoneView_EditCoverImage_EditSeasonInfo_EditSeasonPricing_CreateDraftEpisode";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new InfoPageServiceClientMock();
        serviceClientMock.getSeasonResponse = {
          seasonDetails: {
            name: "Re-Zero: Starting Life in Another World Season 1",
            description: "",
            state: SeasonState.DRAFT,
            grade: 1,
            totalPublishedEpisodes: 0,
            lastChangeTimeMs: new Date("2024-12-01T18:00:00Z").getTime(),
            createdTimeMs: new Date("2024-01-01T12:00:00Z").getTime(),
          },
        };
        serviceClientMock.listDraftEpisodesResponse = {
          episodes: [],
        };
        this.cut = new InfoPage(
          serviceClientMock,
          () => new Date("2024-12-23T08:00:00Z"),
          "season1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          serviceClientMock.getSeasonRequest,
          eqMessage(
            {
              seasonId: "season1",
            },
            GET_SEASON_REQUEST_BODY,
          ),
          "GetSeasonRequestBody",
        );
        assertThat(
          serviceClientMock.listDraftEpisodesRequest,
          eqMessage(
            {
              seasonId: "season1",
            },
            LIST_DRAFT_EPISODES_REQUEST_BODY,
          ),
          "ListDraftEpisodesRequestBody",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_empty_draft.png"),
          path.join(__dirname, "/golden/info_page_tablet_empty_draft.png"),
          path.join(__dirname, "/info_page_tablet_empty_draft_diff.png"),
        );

        // Prepare
        serviceClientMock.listPublishedEpisodesRequests.length = 0;

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_empty_draft_scrolled.png"),
          path.join(
            __dirname,
            "/golden/info_page_tablet_empty_draft_scrolled.png",
          ),
          path.join(
            __dirname,
            "/info_page_tablet_empty_draft_scrolled_diff.png",
          ),
        );

        // Execute
        await setDesktopView();
        window.scrollTo(0, 0);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_desktop_empty_draft.png"),
          path.join(__dirname, "/golden/info_page_desktop_empty_draft.png"),
          path.join(__dirname, "/info_page_desktop_empty_draft_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_desktop_empty_draft_scrolled.png"),
          path.join(
            __dirname,
            "/golden/info_page_desktop_empty_draft_scrolled.png",
          ),
          path.join(
            __dirname,
            "/info_page_desktop_empty_draft_scrolled_diff.png",
          ),
        );

        // Execute
        await setPhoneView();
        window.scrollTo(0, 0);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_phone_empty_draft.png"),
          path.join(__dirname, "/golden/info_page_phone_empty_draft.png"),
          path.join(__dirname, "/info_page_phone_empty_draft_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_phone_empty_draft_scrolled.png"),
          path.join(
            __dirname,
            "/golden/info_page_phone_empty_draft_scrolled.png",
          ),
          path.join(
            __dirname,
            "/info_page_phone_empty_draft_scrolled_diff.png",
          ),
        );

        // Prepare
        let editCoverImage = false;
        this.cut.on("editCoverImage", () => (editCoverImage = true));

        // Execute
        this.cut.coverImageButton.val.click();

        // Verify
        assertThat(editCoverImage, eq(true), "Edit cover image");

        // Prepare
        let editSeasonInfo = false;
        this.cut.on("editSeasonInfo", () => (editSeasonInfo = true));

        // Execute
        this.cut.seasonInfoButton.val.click();

        // Verify
        assertThat(editSeasonInfo, eq(true), "Edit season info");

        // Prepare
        let editSeasonPricing = false;
        this.cut.on("editSeasonPricing", () => (editSeasonPricing = true));

        // Execute
        this.cut.seasonPricingButton.val.click();

        // Verify
        assertThat(editSeasonPricing, eq(true), "Edit season pricing");

        // Prepare
        let createDraftEpisode = false;
        this.cut.on("createDraftEpisode", () => (createDraftEpisode = true));

        // Execute
        this.cut.createDraftEpisodeButton.val.click();

        // Verify
        assertThat(createDraftEpisode, eq(true), "Create draft episode");
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "TabletView_PublishedSeasonWithDraftEpisodes_ScrolledToLoadMorePublishedEpisodes_DesktopView_PhoneView_ReloadPublishedEpisodesFromNewCursor_EditDraftEpisode_EditPublishedEpisode";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new InfoPageServiceClientMock();
        serviceClientMock.getSeasonResponse = {
          seasonDetails: {
            name: "Re-Zero: Starting Life in Another World Season 1",
            description:
              "A thrilling isekai anime following Subaru Natsuki as he navigates a world of magic, danger, and mystery, with the ability to return from death.",
            state: SeasonState.PUBLISHED,
            coverImageUrl: coverImage,
            grade: 59,
            totalPublishedEpisodes: 10,
            lastChangeTimeMs: new Date("2024-12-01T18:00:00Z").getTime(),
            createdTimeMs: new Date("2024-01-01T12:00:00Z").getTime(),
          },
        };
        serviceClientMock.listDraftEpisodesResponse = {
          episodes: [
            {
              episodeId: "episode1",
              name: "Episode 1",
              videoContainer: {
                version: 0,
              },
            },
            {
              episodeId: "episode2",
              name: "Episode 2",
              videoContainer: {
                version: 1,
              },
            },
          ],
        };
        serviceClientMock.listPublishedEpisodesResponse = {
          episodes: [
            {
              episodeId: "episode10",
              name: "Episode 10",
              index: 10,
              videoContainer: {
                version: 1,
              },
            },
            {
              episodeId: "episode9",
              name: "Episode 9",
              index: 9,
              videoContainer: {
                version: 12,
              },
            },
            {
              episodeId: "episode8",
              name: "Episode 8",
              index: 8,
              videoContainer: {
                version: 20,
              },
            },
          ],
          indexCursor: 8,
        };
        this.cut = new InfoPage(
          serviceClientMock,
          () => new Date("2024-12-23T08:00:00Z"),
          "season1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loadedPublishedEpisodes", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.listPublishedEpisodesRequests,
          isArray([
            eqMessage(
              {
                seasonId: "season1",
                limit: 10,
                next: true,
              },
              LIST_PUBLISHED_EPISODES_REQUEST_BODY,
            ),
          ]),
          "ListPublishedEpisodesRequestBody",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_published.png"),
          path.join(__dirname, "/golden/info_page_tablet_published.png"),
          path.join(__dirname, "/info_page_tablet_published_diff.png"),
        );

        // Execute
        window.scrollTo(0, 500);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_published_scrolled.png"),
          path.join(
            __dirname,
            "/golden/info_page_tablet_published_scrolled.png",
          ),
          path.join(__dirname, "/info_page_tablet_published_scrolled_diff.png"),
        );

        // Prepare
        serviceClientMock.listPublishedEpisodesRequests.length = 0;
        serviceClientMock.listPublishedEpisodesResponse = {
          episodes: [
            {
              episodeId: "episode7",
              name: "Episode 7",
              index: 7,
              videoContainer: {
                version: 5,
              },
            },
            {
              episodeId: "episode6",
              name: "Episode 6",
              index: 6,
              videoContainer: {
                version: 3,
              },
            },
          ],
        };

        // Execute
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise<void>((resolve) =>
          this.cut.once("loadedPublishedEpisodes", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.listPublishedEpisodesRequests,
          isArray([
            eqMessage(
              {
                seasonId: "season1",
                indexCursor: 8,
                limit: 10,
                next: true,
              },
              LIST_PUBLISHED_EPISODES_REQUEST_BODY,
            ),
          ]),
          "ListPublishedEpisodesRequestBody 2",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/info_page_tablet_published_scrolled_with_more.png",
          ),
          path.join(
            __dirname,
            "/golden/info_page_tablet_published_scrolled_with_more.png",
          ),
          path.join(
            __dirname,
            "/info_page_tablet_published_scrolled_with_more_diff.png",
          ),
        );

        // Prepare
        await setDesktopView();
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_desktop_published_scrolled.png"),
          path.join(
            __dirname,
            "/golden/info_page_desktop_published_scrolled.png",
          ),
          path.join(
            __dirname,
            "/info_page_desktop_published_scrolled_diff.png",
          ),
        );

        // Execute
        await setPhoneView();
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_phone_published_scrolled.png"),
          path.join(
            __dirname,
            "/golden/info_page_phone_published_scrolled.png",
          ),
          path.join(__dirname, "/info_page_phone_published_scrolled_diff.png"),
        );

        // Prepare
        serviceClientMock.listPublishedEpisodesRequests.length = 0;
        serviceClientMock.listPublishedEpisodesResponse = {
          episodes: [
            {
              episodeId: "episode5",
              name: "Episode 5",
              index: 5,
              videoContainer: {
                version: 1,
              },
            },
          ],
        };

        // Execute
        this.cut.listPublishedEpisodeIndexCursorInput.val.value = "5";
        this.cut.listPublishedEpisodeIndexCursorInput.val.dispatchEvent(
          new Event("change"),
        );

        // Verify
        assertThat(
          serviceClientMock.listPublishedEpisodesRequests,
          isArray([
            eqMessage(
              {
                seasonId: "season1",
                indexCursor: 6,
                limit: 10,
                next: true,
              },
              LIST_PUBLISHED_EPISODES_REQUEST_BODY,
            ),
          ]),
          "ListPublishedEpisodesRequestBody 3",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_phone_published_reloaded.png"),
          path.join(
            __dirname,
            "/golden/info_page_phone_published_reloaded.png",
          ),
          path.join(__dirname, "/info_page_phone_published_reloaded_diff.png"),
        );

        // Prepare
        let editDraftEpisodeId: string;
        this.cut.on("editDraftEpisode", (episodeId: string) => {
          editDraftEpisodeId = episodeId;
        });

        // Execute
        this.cut.draftEpisodeElements[0].click();

        // Verify
        assertThat(editDraftEpisodeId, eq("episode1"), "Edit draft episode id");

        // Prepare
        let editPublishedEpisodeId: string;
        this.cut.on("editPublishedEpisode", (episodeId: string) => {
          editPublishedEpisodeId = episodeId;
        });

        // Execute
        this.cut.publishedEpisodeElements[0].click();

        // Verify
        assertThat(
          editPublishedEpisodeId,
          eq("episode5"),
          "Edit published episode id",
        );
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_NextGrade";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new InfoPageServiceClientMock();
        serviceClientMock.getSeasonResponse = {
          seasonDetails: {
            name: "Re-Zero: Starting Life in Another World Season 1",
            description:
              "A thrilling isekai anime following Subaru Natsuki as he navigates a world of magic, danger, and mystery, with the ability to return from death.",
            state: SeasonState.PUBLISHED,
            coverImageUrl: coverImage,
            grade: 59,
            nextGrade: {
              grade: 49,
              effectiveDate: "2025-02-01",
            },
            totalPublishedEpisodes: 10,
            lastChangeTimeMs: new Date("2024-12-01T18:00:00Z").getTime(),
            createdTimeMs: new Date("2024-01-01T12:00:00Z").getTime(),
          },
        };
        serviceClientMock.listDraftEpisodesResponse = {
          episodes: [],
        };
        serviceClientMock.listPublishedEpisodesResponse = {
          episodes: [],
        };
        this.cut = new InfoPage(
          serviceClientMock,
          () => new Date("2024-12-23T08:00:00Z"),
          "season1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loadedPublishedEpisodes", resolve),
        );
        window.scrollTo(0, 500);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_next_grade.png"),
          path.join(__dirname, "/golden/info_page_tablet_next_grade.png"),
          path.join(__dirname, "/info_page_tablet_next_grade_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_ArchivedSeason";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new InfoPageServiceClientMock();
        serviceClientMock.getSeasonResponse = {
          seasonDetails: {
            name: "Re-Zero: Starting Life in Another World Season 1",
            description:
              "A thrilling isekai anime following Subaru Natsuki as he navigates a world of magic, danger, and mystery, with the ability to return from death.",
            state: SeasonState.ARCHIVED,
            grade: 59,
            totalPublishedEpisodes: 0,
            lastChangeTimeMs: new Date("2024-12-01T18:00:00Z").getTime(),
            createdTimeMs: new Date("2024-01-01T12:00:00Z").getTime(),
          },
        };
        serviceClientMock.listDraftEpisodesResponse = {
          episodes: [],
        };
        serviceClientMock.listPublishedEpisodesResponse = {
          episodes: [],
        };
        this.cut = new InfoPage(
          serviceClientMock,
          () => new Date("2024-12-23T08:00:00Z"),
          "season1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_archived.png"),
          path.join(__dirname, "/golden/info_page_tablet_archived.png"),
          path.join(__dirname, "/info_page_tablet_archived_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
