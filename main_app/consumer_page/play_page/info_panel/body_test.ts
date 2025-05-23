import "../../../../dev/env";
import coverImage = require("../../common/test_data/cover_tall.jpg");
import path = require("path");
import { SCHEME } from "../../../../common/color_scheme";
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { InfoPanel } from "./body";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "InfoPanelTest",
  cases: [
    new (class implements TestCase {
      public name = "FirstTimeWatching";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 35rem; background-color: ${SCHEME.neutral4}; padding: 1rem;`,
        });
        document.body.append(this.container);
        let cut = new InfoPanel(
          () => new Date("2024-02-01T08:00:00Z"),
          "width: 100%;",
          {
            episodeId: "episode1",
            name: "Episode 1: The Beginning",
            premiereTimeMs: new Date("2024-01-01T08:00:00Z").getTime(),
          },
          {
            seasonId: "season1",
            name: "Re-Zero: Starting Life in Another World",
            grade: 90,
            coverImageUrl: coverImage,
            totalEpisodes: 25,
          },
          {
            episodeId: "episode2",
            name: "Episode 2: The Continuation",
            premiereTimeMs: new Date("2024-01-08T08:00:00Z").getTime(),
            videoDurationSec: 24 * 60,
          },
        );

        // Execute
        this.container.appendChild(cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./info_panel_1st_time.png"),
          path.join(__dirname, "./golden/info_panel_1st_time.png"),
          path.join(__dirname, "./info_panel_1st_time_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        cut.updateMeterReading(900000);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./info_panel_1st_time_updated_metering.png"),
          path.join(
            __dirname,
            "./golden/info_panel_1st_time_updated_metering.png",
          ),
          path.join(
            __dirname,
            "./info_panel_1st_time_updated_metering_diff.png",
          ),
          {
            fullPage: true,
          },
        );

        // Execute
        cut.meteringQuestionMark.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./info_panel_1st_time_metering_explained.png"),
          path.join(
            __dirname,
            "./golden/info_panel_1st_time_metering_explained.png",
          ),
          path.join(
            __dirname,
            "./info_panel_1st_time_metering_explained_diff.png",
          ),
          {
            fullPage: true,
          },
        );

        // Execute
        this.container.style.width = "60rem";

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./info_panel_1st_time_wide.png"),
          path.join(__dirname, "./golden/info_panel_1st_time_wide.png"),
          path.join(__dirname, "./info_panel_1st_time_wide_diff.png"),
          {
            fullPage: true,
          },
        );

        // Prepare
        let playSeasonId: string;
        let playEpisodeId: string;
        cut.on("play", (seasonId, episodeId) => {
          playSeasonId = seasonId;
          playEpisodeId = episodeId;
        });

        // Execute
        cut.nextEpisodeButton.val.click();

        // Verify
        assertThat(playSeasonId, eq("season1"), "play season id");
        assertThat(playEpisodeId, eq("episode2"), "play episode id");
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "OneEpisodeOnly";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 35rem; background-color: ${SCHEME.neutral4}; padding: 1rem;`,
        });
        document.body.append(this.container);
        let cut = new InfoPanel(
          () => new Date("2024-02-01T08:00:00Z"),
          "width: 100%;",
          {
            name: "Episode 1: The Beginning",
            premiereTimeMs: new Date("2024-01-01T08:00:00Z").getTime(),
          },
          {
            name: "Re-Zero: Starting Life in Another World",
            grade: 90,
            coverImageUrl: coverImage,
            totalEpisodes: 1,
          },
        );

        // Execute
        this.container.appendChild(cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./info_panel_one_episode_only.png"),
          path.join(__dirname, "./golden/info_panel_one_episode_only.png"),
          path.join(__dirname, "./info_panel_one_episode_only_diff.png"),
          {
            fullPage: true,
          },
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "NextEpisodeNotPremiered";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 35rem; background-color: ${SCHEME.neutral4}; padding: 1rem;`,
        });
        document.body.append(this.container);
        let cut = new InfoPanel(
          () => new Date("2024-02-01T08:00:00Z"),
          "width: 100%;",
          {
            name: "Episode 1: The Beginning",
            premiereTimeMs: new Date("2024-01-01T08:00:00Z").getTime(),
          },
          {
            name: "Re-Zero: Starting Life in Another World",
            grade: 90,
            coverImageUrl: coverImage,
            totalEpisodes: 25,
          },
          {
            name: "Episode 2: The Continuation",
            premiereTimeMs: new Date("2024-02-08T08:00:00Z").getTime(),
            videoDurationSec: 24 * 60,
          },
        );

        // Execute
        this.container.appendChild(cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./info_panel_next_episode_not_premiered.png"),
          path.join(
            __dirname,
            "./golden/info_panel_next_episode_not_premiered.png",
          ),
          path.join(
            __dirname,
            "./info_panel_next_episode_not_premiered_diff.png",
          ),
          {
            fullPage: true,
          },
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
