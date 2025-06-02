import "../../../dev/env";
import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { setTabletView } from "../../../common/view_port";
import { SeasonDetailsPage } from "./body";
import { CreateEpisodePage } from "./create_episode_page/body";
import { DraftStatePage } from "./draft_state_page/body";
import { EpisodeDetailsPageMock } from "./episode_details_page/body_mock";
import { InfoPageMock } from "./info_page/body_mock";
import { PublishedStatePage } from "./published_state_page/body";
import { UpdateCoverImagePage } from "./update_cover_image_page/body";
import { UpdateDraftPricingPage } from "./update_draft_pricing_page/body";
import { UpdateInfoPage } from "./update_info_page/body";
import { UpdatePublishedPricingPage } from "./update_published_pricing_page/body";
import { EpisodeState } from "@phading/product_service_interface/show/episode_state";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import {
  EpisodeDetails,
  SeasonDetails,
} from "@phading/product_service_interface/show/web/publisher/details";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

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
          totalPublishedEpisodes: 0,
          lastChangeTimeMs: new Date("2024-12-01T18:00:00Z").getTime(),
          createdTimeMs: new Date("2024-01-01T12:00:00Z").getTime(),
        };
        let episode: EpisodeDetails = {
          seasonName: "Re-Zero: Starting Life in Another World",
          episodeName: "The End of the Beginning and the Beginning of the End",
          state: EpisodeState.DRAFT,
          videoContainer: {
            masterPlaylist: {
              synced: {
                version: 1,
              },
            },
            videos: [],
            audios: [],
            subtitles: [],
          },
        };
        let nowDate = new Date("2023-10-10T00:00:00Z");

        // Execute
        this.cut = new SeasonDetailsPage(
          (seasonId) =>
            new InfoPageMock(seasonDetails, () => nowDate, seasonId),
          (seasonId, season) =>
            new UpdateCoverImagePage(undefined, seasonId, season),
          (seasonId, season) => new UpdateInfoPage(undefined, seasonId, season),
          (seasonId, season) =>
            new UpdateDraftPricingPage(
              undefined,
              () => nowDate,
              seasonId,
              season,
            ),
          (seasonId, season) =>
            new UpdatePublishedPricingPage(
              undefined,
              () => nowDate,
              seasonId,
              season,
            ),
          (seasonId) => new DraftStatePage(undefined, seasonId),
          (seasonId) => new PublishedStatePage(undefined, seasonId),
          (seasonId) => new CreateEpisodePage(undefined, seasonId),
          (appendBodes, seasonId, episodeId) =>
            new EpisodeDetailsPageMock(
              episode,
              () => nowDate,
              appendBodes,
              seasonId,
              episodeId,
            ),
          (...bodies) => document.body.append(...bodies),
          "season1",
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_details_page_default.png"),
          path.join(__dirname, "/golden/season_details_page_default.png"),
          path.join(__dirname, "/season_details_page_default_diff.png"),
        );

        // Execute
        this.cut.infoPage.emit("editCoverImage", seasonDetails);

        // Verify
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
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_details_page_draft_state.png"),
          path.join(__dirname, "/golden/season_details_page_draft_state.png"),
          path.join(__dirname, "/season_details_page_draft_state_diff.png"),
        );

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

        // Execute
        this.cut.infoPage.emit("editEpisode", "episode1");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_details_page_episode_details.png"),
          path.join(
            __dirname,
            "/golden/season_details_page_episode_details.png",
          ),
          path.join(__dirname, "/season_details_page_episode_details_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
