import "../../../common/normalize_body";
import coverImage = require("./test_data/cover.jpg");
import path = require("path");
import { SCHEME } from "../../../common/color_scheme";
import { SeasonItem } from "./season_item";
import { E } from "@selfage/element/factory";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

TEST_RUNNER.run({
  name: "SeasonItemTest",
  cases: [
    new (class implements TestCase {
      public name = "Large";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setViewport(302, 600);
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4};`,
        });
        document.body.append(this.container);
        let cut = new SeasonItem(
          {
            seasonId: "season1",
            coverImageUrl: coverImage,
            grade: 18,
            averageRating: 4,
          },
          {
            episodeId: "episode1",
            index: 1,
            name: "The beginning of a suuuuuuuuuuper long title",
            videoDurationSec: 24 * 60,
            continueTimeMs: (10 * 60 + 24) * 1000,
          },
          new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1,
          }),
          new Intl.NumberFormat("en-US", {
            notation: "compact",
            compactDisplay: "short",
          }),
          1,
          100,
          new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }),
        );

        // Execute
        this.container.append(cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_item_large.png"),
          path.join(__dirname, "/golden/season_item_large.png"),
          path.join(__dirname, "/season_item_large_diff.png"),
        );

        // Execute
        await setViewport(202, 600);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_item_small.png"),
          path.join(__dirname, "/golden/season_item_small.png"),
          path.join(__dirname, "/season_item_small_diff.png"),
        );

        // Prepare
        let detailsSeason: string;
        cut.on("details", (seasonId) => {
          detailsSeason = seasonId;
        });
        let playSeason: string;
        let playEpisode: string;
        cut.on("play", (seasonId, episodeId) => {
          playSeason = seasonId;
          playEpisode = episodeId;
        });

        // Execute
        cut.seasonInfo.val.click();

        // Verify
        assertThat(detailsSeason, eq("season1"), "details with seasonId");

        // Execute
        cut.episodeInfo.val.click();

        // Verify
        assertThat(playSeason, eq("season1"), "play with seasonId");
        assertThat(playEpisode, eq("episode1"), "play with episodeId");
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
