import "../../../common/normalize_body";
import coverImage = require("./test_data/cover_tall.jpg");
import path = require("path");
import { SCHEME } from "../../../common/color_scheme";
import { setPhoneView, setTabletView } from "../../../common/view_port";
import { ContinueEpisodeItem } from "./continue_episode_item";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

TEST_RUNNER.run({
  name: "ContinueEpisodeItemTest",
  cases: [
    new (class implements TestCase {
      public name = "Render";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4}; display: inline-block;`,
        });
        document.body.append(this.container);
        let cut = new ContinueEpisodeItem(
          {
            seasonId: "season1",
            name: "Re:Zero -Starting Life in Another World-",
            coverImageUrl: coverImage,
            grade: 18,
          },
          {
            episodeId: "episode1",
            name: "Episode 1",
            continueTimeMs: 0,
            videoDurationSec: 3600,
          },
          "width: 580px;"
        );

        // Execute
        this.container.append(cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/continue_episode_item_large.png"),
          path.join(__dirname, "/golden/continue_episode_item_large.png"),
          path.join(__dirname, "/continue_episode_item_large_diff.png"),
        );

        // Execute
        await setPhoneView();
        cut.body.style.width = "340px";

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/continue_episode_item_small.png"),
          path.join(__dirname, "/golden/continue_episode_item_small.png"),
          path.join(__dirname, "/continue_episode_item_small_diff.png"),
        );

        // Prepare
        let seasonIdCaptured = "";
        let episodeIdCaptured = "";
        cut.on("play", (seasonId, episodeId) => {
          seasonIdCaptured = seasonId;
          episodeIdCaptured = episodeId;
        });

        // Execute
        cut.body.click();

        // Verify
        assertThat(seasonIdCaptured, eq("season1"), "played seasonId");
        assertThat(episodeIdCaptured, eq("episode1"), "played episodeId");
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Long";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setPhoneView();
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4}; display: inline-block;`,
        });
        document.body.append(this.container);
        let cut = new ContinueEpisodeItem(
          {
            seasonId: "season1",
            name: "Re:Zero -Starting Life in Another World- Re:Zero -Starting Life in Another World- Re:Zero -Starting Life in Another World- Re:Zero -Starting Life in Another World-",
            coverImageUrl: coverImage,
            grade: 18,
          },
          {
            episodeId: "episode1",
            name: "S3 E54 - Operation: Take Back the Government Office S3 E54 - Operation: Take Back the Government Office",
            continueTimeMs: 3600000,
            videoDurationSec: 3600,
          },
          "width: 340px;"
        );

        // Execute
        this.container.append(cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/continue_episode_item_long.png"),
          path.join(__dirname, "/golden/continue_episode_item_long.png"),
          path.join(__dirname, "/continue_episode_item_long_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
