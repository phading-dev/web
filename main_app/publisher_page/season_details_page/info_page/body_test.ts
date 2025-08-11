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
import { SeasonDetails } from "@phading/product_service_interface/show/web/publisher/details";
import {
  GET_SEASON,
  GET_SEASON_REQUEST_BODY,
  GetSeasonRequestBody,
  GetSeasonResponse,
  LIST_DRAFT_EPISODES,
  LIST_DRAFT_EPISODES_REQUEST_BODY,
  ListDraftEpisodesRequestBody,
  ListDraftEpisodesResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

class InfoPageServiceClientMock extends WebServiceClientMock {
  public getSeasonRequest: GetSeasonRequestBody;
  public getSeasonResponse: GetSeasonResponse;
  public listDraftEpisodesRequest: ListDraftEpisodesRequestBody;
  public listDraftEpisodesResponse: ListDraftEpisodesResponse;

  public async send(request: ClientRequestInterface<any>): Promise<any> {
    switch (request.descriptor) {
      case GET_SEASON:
        this.getSeasonRequest = request.body;
        return this.getSeasonResponse;
      case LIST_DRAFT_EPISODES:
        this.listDraftEpisodesRequest = request.body;
        return this.listDraftEpisodesResponse;
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
        "TabletView_DraftSeasonWithoutEpisodes_DesktopView_PhoneView_EditCoverImage_EditSeasonInfo_EditSeasonPricing_CreateDraftEpisode_ViewEpisodes_EditSeasonState_Back";
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
        // await new Promise((resolve) => setTimeout(resolve, 1000000));

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
          {
            fullPage: true,
          },
        );

        // Execute
        await setDesktopView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_desktop_empty_draft.png"),
          path.join(__dirname, "/golden/info_page_desktop_empty_draft.png"),
          path.join(__dirname, "/info_page_desktop_empty_draft_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_phone_empty_draft.png"),
          path.join(__dirname, "/golden/info_page_phone_empty_draft.png"),
          path.join(__dirname, "/info_page_phone_empty_draft_diff.png"),
          {
            fullPage: true,
          },
        );

        // Prepare
        let seasonCaptured: SeasonDetails;
        this.cut.on("editCoverImage", (season) => {
          seasonCaptured = season;
        });

        // Execute
        this.cut.coverImageButton.val.click();

        // Verify
        assertThat(seasonCaptured.grade, eq(1), "Edit cover image season");

        // Prepare
        seasonCaptured = undefined;
        this.cut.on("editSeasonInfo", (season) => {
          seasonCaptured = season;
        });

        // Execute
        this.cut.seasonInfoButton.val.click();

        // Verify
        assertThat(seasonCaptured.grade, eq(1), "Edit season info season");

        // Prepare
        seasonCaptured = undefined;
        this.cut.on("editSeasonDraftPricing", (season) => {
          seasonCaptured = season;
        });

        // Execute
        this.cut.seasonPricingButton.val.click();

        // Verify
        assertThat(
          seasonCaptured.grade,
          eq(1),
          "Edit season draft pricing season",
        );

        // Prepare
        let createDraftEpisode = false;
        this.cut.on("createDraftEpisode", () => (createDraftEpisode = true));

        // Execute
        this.cut.createDraftEpisodeButton.val.click();

        // Verify
        assertThat(createDraftEpisode, eq(true), "Create draft episode");

        // Prepare
        seasonCaptured = undefined;
        this.cut.on("viewDraftEpisodes", (season) => {
          seasonCaptured = season;
        });

        // Execute
        this.cut.draftEpisodesListButton.val.click();

        // Verify
        assertThat(
          seasonCaptured.grade,
          eq(1),
          "View draft episodes season grade",
        );

        // Prepare
        seasonCaptured = undefined;
        this.cut.on("viewPublishedEpisodes", (season) => {
          seasonCaptured = season;
        });

        // Execute
        this.cut.publishedEpisodesListButton.val.click();

        // Verify
        assertThat(
          seasonCaptured.grade,
          eq(1),
          "View published episodes season grade",
        );
        // Prepare
        let publishSeason: SeasonDetails;
        this.cut.on("publishSeason", (season) => (publishSeason = season));

        // Execute
        this.cut.seasonStateButton.val.click();

        // Verify
        assertThat(publishSeason.grade, eq(1), "Publish season grade");

        // Prepare
        let deleteSeason: SeasonDetails;
        this.cut.on("deleteSeason", (season) => (deleteSeason = season));

        // Execute
        this.cut.dangerZoneButton.val.click();

        // Verify
        assertThat(deleteSeason.grade, eq(1), "Delete season grade");

        // Prepare
        let back = false;
        this.cut.on("back", () => (back = true));

        // Execute
        this.cut.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "Back");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "TabletView_PublishedSeasonWithDraftEpisodes_DesktopView_PhoneView_EditSeasonPricing_EditSeasonState";
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
            grade: 599,
            totalPublishedEpisodes: 10,
            lastChangeTimeMs: new Date("2024-12-01T18:00:00Z").getTime(),
            createdTimeMs: new Date("2024-01-01T12:00:00Z").getTime(),
          },
        };
        serviceClientMock.listDraftEpisodesResponse = {
          episodes: [
            {
              episodeId: "episode1",
            },
            {
              episodeId: "episode2",
            },
          ],
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
          path.join(__dirname, "/info_page_tablet_published.png"),
          path.join(__dirname, "/golden/info_page_tablet_published.png"),
          path.join(__dirname, "/info_page_tablet_published_diff.png"),
          {
            fullPage: true,
          },
        );

        // Prepare
        await setDesktopView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_desktop_published.png"),
          path.join(__dirname, "/golden/info_page_desktop_published.png"),
          path.join(__dirname, "/info_page_desktop_published_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_phone_published.png"),
          path.join(__dirname, "/golden/info_page_phone_published.png"),
          path.join(__dirname, "/info_page_phone_published_diff.png"),
          {
            fullPage: true,
          },
        );

        // Prepare
        let seasonCaptured: SeasonDetails;
        this.cut.on("editSeasonPublishedPricing", (season) => {
          seasonCaptured = season;
        });

        // Execute
        this.cut.seasonPricingButton.val.click();

        // Verify
        assertThat(
          seasonCaptured.grade,
          eq(599),
          "Edit season published pricing season",
        );

        // Prepare
        let archiveSeason: SeasonDetails;
        this.cut.on("archiveSeason", (season) => (archiveSeason = season));

        // Execute
        this.cut.dangerZoneButton.val.click();

        // Verify
        assertThat(archiveSeason.grade, eq(599), "Archive season grade");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_NextGrade_PhoneView";
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
            grade: 599,
            nextGrade: {
              grade: 499,
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
        this.cut = new InfoPage(
          serviceClientMock,
          () => new Date("2024-12-23T08:00:00Z"),
          "season1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        // Somehow need to await again for the body to be fully loaded
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_next_grade.png"),
          path.join(__dirname, "/golden/info_page_tablet_next_grade.png"),
          path.join(__dirname, "/info_page_tablet_next_grade_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_phone_next_grade.png"),
          path.join(__dirname, "/golden/info_page_phone_next_grade.png"),
          path.join(__dirname, "/info_page_phone_next_grade_diff.png"),
          {
            fullPage: true,
          },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_TakenDown_PhoneView";
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
            state: SeasonState.TAKEN_DOWN,
            takenDownReason: "Violation of community guidelines",
            coverImageUrl: coverImage,
            grade: 599,
            totalPublishedEpisodes: 10,
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
        // Somehow need to await again for the body to be fully loaded
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_taken_down.png"),
          path.join(__dirname, "/golden/info_page_tablet_taken_down.png"),
          path.join(__dirname, "/info_page_tablet_taken_down_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_phone_taken_down.png"),
          path.join(__dirname, "/golden/info_page_phone_taken_down.png"),
          path.join(__dirname, "/info_page_phone_taken_down_diff.png"),
          {
            fullPage: true,
          },
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
            grade: 599,
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
