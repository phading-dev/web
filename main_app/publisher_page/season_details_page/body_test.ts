import "../../../dev/env";
import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { setTabletView } from "../../../common/view_port";
import { SeasonDetailsPage } from "./body";
import { CreateEpisodePage } from "./create_episode_page/body";
import { DraftStatePage } from "./draft_state_page/body";
import { InfoPageMock } from "./info_page/body_mock";
import { PublishedStatePage } from "./published_state_page/body";
import { UpdateCoverImagePage } from "./update_cover_image_page/body";
import { UpdateDraftPricingPage } from "./update_draft_pricing_page/body";
import { UpdateInfoPage } from "./update_info_page/body";
import { UpdatePublishedPricingPage } from "./update_published_pricing_page/body";
import { MAX_COVER_IMAGE_BUFFER_SIZE } from "@phading/constants/show";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { SeasonDetails } from "@phading/product_service_interface/show/web/publisher/details";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "SeasonDetailsPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Navigation";
      private cut: SeasonDetailsPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let seasonDetails: SeasonDetails = {
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
        let nowDate = new Date("2023-10-10T00:00:00Z");

        // Execute
        this.cut = new SeasonDetailsPage(
          (seasonId) => new InfoPageMock(() => nowDate, seasonId),
          (seasonId, season) =>
            new UpdateCoverImagePage(
              undefined,
              MAX_COVER_IMAGE_BUFFER_SIZE,
              seasonId,
              season,
            ),
          (seasonId, season) => new UpdateInfoPage(undefined, seasonId, season),
          (seasonId, grade) =>
            new UpdateDraftPricingPage(
              undefined,
              () => nowDate,
              seasonId,
              grade,
            ),
          (seasonId, grade, nextGrade) =>
            new UpdatePublishedPricingPage(
              undefined,
              () => nowDate,
              seasonId,
              grade,
              nextGrade,
            ),
          (seasonId) => new DraftStatePage(undefined, seasonId),
          (seasonId) => new PublishedStatePage(undefined, seasonId),
          (seasonId) => new CreateEpisodePage(undefined, seasonId),
          (...bodies) => document.body.append(...bodies),
          "season1",
        );

        // Verify
        assertThat(
          this.cut.infoPage.seasonId,
          eq("season1"),
          "infoPage.seasonId",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_details_page_default.png"),
          path.join(__dirname, "/golden/season_details_page_default.png"),
          path.join(__dirname, "/season_details_page_default_diff.png"),
        );

        // Prepare
        let back = false;
        this.cut.on("back", () => {
          back = true;
        });

        // Execute
        this.cut.infoPage.emit("back");

        // Verify
        assertThat(back, eq(true), "back");

        // Execute
        this.cut.infoPage.emit("editCoverImage", seasonDetails);

        // Verify
        assertThat(
          this.cut.updateCoverImagePage.seasonId,
          eq("season1"),
          "updateCoverImagePage.seasonId",
        );
        assertThat(
          this.cut.updateCoverImagePage.season.name,
          eq(seasonDetails.name),
          "updateCoverImagePage.season.name",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_details_page_update_cover_image.png"),
          path.join(
            __dirname,
            "/golden/season_details_page_update_cover_image.png",
          ),
          path.join(
            __dirname,
            "/season_details_page_update_cover_image_diff.png",
          ),
        );

        // Execute
        this.cut.updateCoverImagePage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/season_details_page_back_from_cover_image.png",
          ),
          path.join(__dirname, "/golden/season_details_page_default.png"),
          path.join(
            __dirname,
            "/season_details_page_back_from_cover_image_diff.png",
          ),
        );

        // Execute
        this.cut.infoPage.emit("editSeasonInfo", seasonDetails);

        // Verify
        assertThat(
          this.cut.updateInfoPage.seasonId,
          eq("season1"),
          "updateInfoPage.seasonId",
        );
        assertThat(
          this.cut.updateInfoPage.season.name,
          eq(seasonDetails.name),
          "updateInfoPage.season.name",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_details_page_update_info.png"),
          path.join(__dirname, "/golden/season_details_page_update_info.png"),
          path.join(__dirname, "/season_details_page_update_info_diff.png"),
        );

        // Execute
        this.cut.updateInfoPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_details_page_back_from_info.png"),
          path.join(__dirname, "/golden/season_details_page_default.png"),
          path.join(__dirname, "/season_details_page_back_from_info_diff.png"),
        );

        // Execute
        this.cut.infoPage.emit("editSeasonDraftPricing", seasonDetails);

        // Verify
        assertThat(
          this.cut.updateDraftPricingPage.seasonId,
          eq("season1"),
          "updateDraftPricingPage.seasonId",
        );
        assertThat(
          this.cut.updateDraftPricingPage.grade,
          eq(seasonDetails.grade),
          "updateDraftPricingPage.grade",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_details_page_update_draft_pricing.png"),
          path.join(
            __dirname,
            "/golden/season_details_page_update_draft_pricing.png",
          ),
          path.join(
            __dirname,
            "/season_details_page_update_draft_pricing_diff.png",
          ),
        );

        // Execute
        this.cut.updateDraftPricingPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/season_details_page_back_from_draft_pricing.png",
          ),
          path.join(__dirname, "/golden/season_details_page_default.png"),
          path.join(
            __dirname,
            "/season_details_page_back_from_draft_pricing_diff.png",
          ),
        );

        // Execute
        this.cut.infoPage.emit("editSeasonPublishedPricing", seasonDetails);

        // Verify
        assertThat(
          this.cut.updatePublishedPricingPage.seasonId,
          eq("season1"),
          "updatePublishedPricingPage.seasonId",
        );
        assertThat(
          this.cut.updatePublishedPricingPage.grade,
          eq(seasonDetails.grade),
          "updatePublishedPricingPage.grade",
        );
        assertThat(
          this.cut.updatePublishedPricingPage.nextGrade.grade,
          eq(seasonDetails.nextGrade.grade),
          "updatePublishedPricingPage.nextGrade.grade",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/season_details_page_update_published_pricing.png",
          ),
          path.join(
            __dirname,
            "/golden/season_details_page_update_published_pricing.png",
          ),
          path.join(
            __dirname,
            "/season_details_page_update_published_pricing_diff.png",
          ),
        );

        // Execute
        this.cut.updatePublishedPricingPage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/season_details_page_back_from_published_pricing.png",
          ),
          path.join(__dirname, "/golden/season_details_page_default.png"),
          path.join(
            __dirname,
            "/season_details_page_back_from_published_pricing_diff.png",
          ),
        );

        // Execute
        this.cut.infoPage.emit("editSeasonDraftState");

        // Verify
        assertThat(
          this.cut.draftStatePage.seasonId,
          eq("season1"),
          "draftStatePage.seasonId",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_details_page_draft_state.png"),
          path.join(__dirname, "/golden/season_details_page_draft_state.png"),
          path.join(__dirname, "/season_details_page_draft_state_diff.png"),
        );

        // Prepare
        back = false;

        // Execute
        this.cut.draftStatePage.emit("delete");

        // Verify
        assertThat(back, eq(true), "back when deleted");

        // Execute
        this.cut.draftStatePage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/season_details_page_back_from_draft_state.png",
          ),
          path.join(__dirname, "/golden/season_details_page_default.png"),
          path.join(
            __dirname,
            "/season_details_page_back_from_draft_state_diff.png",
          ),
        );

        // Execute
        this.cut.infoPage.emit("editSeasonPublishedState");

        // Verify
        assertThat(
          this.cut.publishedStatePage.seasonId,
          eq("season1"),
          "publishedStatePage.seasonId",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_details_page_published_state.png"),
          path.join(
            __dirname,
            "/golden/season_details_page_published_state.png",
          ),
          path.join(__dirname, "/season_details_page_published_state_diff.png"),
        );

        // Execute
        this.cut.publishedStatePage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/season_details_page_back_from_published_state.png",
          ),
          path.join(__dirname, "/golden/season_details_page_default.png"),
          path.join(
            __dirname,
            "/season_details_page_back_from_published_state_diff.png",
          ),
        );

        // Execute
        this.cut.infoPage.emit("createDraftEpisode");

        // Verify
        assertThat(
          this.cut.createEpisodePage.seasonId,
          eq("season1"),
          "createEpisodePage.seasonId",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_details_page_create_episode.png"),
          path.join(
            __dirname,
            "/golden/season_details_page_create_episode.png",
          ),
          path.join(__dirname, "/season_details_page_create_episode_diff.png"),
        );

        // Execute
        this.cut.createEpisodePage.emit("back");

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/season_details_page_back_from_create_episode.png",
          ),
          path.join(__dirname, "/golden/season_details_page_default.png"),
          path.join(
            __dirname,
            "/season_details_page_back_from_create_episode_diff.png",
          ),
        );

        // Prepare
        let seasonId: string;
        let episodeId: string;
        this.cut.on("viewEpisode", (seasonId_, episodeId_) => {
          seasonId = seasonId_;
          episodeId = episodeId_;
        });

        // Execute
        this.cut.infoPage.emit("viewEpisode", "episode1");

        // Verify
        assertThat(
          seasonId,
          eq("season1"),
          "viewEpisode seasonId",
        );
        assertThat(
          episodeId,
          eq("episode1"),
          "viewEpisode episodeId",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
