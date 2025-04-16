import "../../../dev/env";
import "../../../common/normalize_body";
import coverImage = require("./test_data/cover_tall.jpg");
import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { SCHEME } from "../../../common/color_scheme";
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../common/view_port";
import {
  eContinueEpisodeItem,
  ePublisherContextItem,
  ePublisherItem,
  eSeasonItem,
} from "./elements";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

TEST_RUNNER.run({
  name: "ElementsTest",
  cases: [
    new (class implements TestCase {
      public name = "ContinueEpisodeItem";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4}; display: inline-block;`,
        });
        document.body.append(this.container);
        let cut = eContinueEpisodeItem(
          {
            seasonId: "season1",
            name: "Re:Zero -Starting Life in Another World-",
            coverImageUrl: coverImage,
            grade: 18,
          },
          {
            episodeId: "episode1",
            name: "Episode 1",
            videoDurationSec: 3600,
          },
          0,
          "width: 580px;",
        );

        // Execute
        this.container.append(cut);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/continue_episode_item_large.png"),
          path.join(__dirname, "/golden/continue_episode_item_large.png"),
          path.join(__dirname, "/continue_episode_item_large_diff.png"),
        );

        // Execute
        await setPhoneView();
        cut.style.width = "340px";

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/continue_episode_item_small.png"),
          path.join(__dirname, "/golden/continue_episode_item_small.png"),
          path.join(__dirname, "/continue_episode_item_small_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ContinueEpisodeItemLong";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setPhoneView();
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4}; display: inline-block;`,
        });
        document.body.append(this.container);
        let cut = eContinueEpisodeItem(
          {
            seasonId: "season1",
            name: "Re:Zero -Starting Life in Another World- Re:Zero -Starting Life in Another World- Re:Zero -Starting Life in Another World- Re:Zero -Starting Life in Another World-",
            coverImageUrl: coverImage,
            grade: 18,
          },
          {
            episodeId: "episode1",
            name: "S3 E54 - Operation: Take Back the Government Office S3 E54 - Operation: Take Back the Government Office",
            videoDurationSec: 3600,
          },
          3600000,
          "width: 340px;",
        );

        // Execute
        this.container.append(cut);

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
    new (class implements TestCase {
      public name = "SeasonItem";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4}; display: inline-block;`,
        });
        document.body.append(this.container);
        let cut = eSeasonItem(
          {
            seasonId: "season1",
            name: "Re:Zero -Starting Life in Another World-",
            coverImageUrl: coverImage,
            grade: 18,
            ratingsCount: 12345,
            averageRating: 4.09,
          },
          "width: 300px;",
        );

        // Execute
        this.container.append(cut);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_item_large.png"),
          path.join(__dirname, "/golden/season_item_large.png"),
          path.join(__dirname, "/season_item_large_diff.png"),
        );

        // Execute
        await setPhoneView();
        cut.style.width = "165px";

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_item_small.png"),
          path.join(__dirname, "/golden/season_item_small.png"),
          path.join(__dirname, "/season_item_small_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SeasonItemLong";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setPhoneView();
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4}; display: inline-block;`,
        });
        document.body.append(this.container);
        let cut = eSeasonItem(
          {
            seasonId: "season1",
            name: "Re:Zero -Starting Life in Another World- Re:Zero -Starting Life in Another World-",
            coverImageUrl: coverImage,
            grade: 1000,
            ratingsCount: 0,
            averageRating: 0,
          },
          "width: 165px;",
        );

        // Execute
        this.container.append(cut);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_item_long.png"),
          path.join(__dirname, "/golden/season_item_long.png"),
          path.join(__dirname, "/season_item_long_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "PublisherItem";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4}; display: inline-block;`,
        });
        document.body.append(this.container);
        let cut = ePublisherItem(
          {
            accountId: "publisher1",
            naturalName: "Publisher Name",
            avatarLargeUrl: userImage,
            description: "A simple person with a simple description.",
          },
          "width: 580px;",
        );

        // Execute
        this.container.append(cut);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_item_large.png"),
          path.join(__dirname, "/golden/publisher_item_large.png"),
          path.join(__dirname, "/publisher_item_large_diff.png"),
        );

        // Execute
        await setPhoneView();
        cut.style.width = "340px";

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_item_small.png"),
          path.join(__dirname, "/golden/publisher_item_small.png"),
          path.join(__dirname, "/publisher_item_small_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "PublisherItemLong";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setPhoneView();
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4}; display: inline-block;`,
        });
        document.body.append(this.container);
        let cut = ePublisherItem(
          {
            accountId: "123e4567-e89b-12d3-a456-426614174000",
            naturalName:
              "Publisher Name That Is Extremely Long And Keeps Going To Test The Layout Handling Of Very Long Names In A Constrained Space",
            avatarLargeUrl: userImage,
            description:
              "This is a very long description that goes on and on and on to test how the layout handles extremely verbose text in a constrained space.",
          },
          "width: 340px;",
        );

        // Execute
        this.container.append(cut);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_item_long.png"),
          path.join(__dirname, "/golden/publisher_item_long.png"),
          path.join(__dirname, "/publisher_item_long_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "PublisherContextItemLong_Wide";
      private cut: HTMLDivElement;
      public async execute() {
        // Prepare
        await setPhoneView();
        this.cut = ePublisherContextItem(
          {
            accountId: "123e4567-e89b-12d3-a456-426614174000",
            naturalName:
              "Publisher Name That Is Extremely Long And Keeps Going To Test The Layout Handling Of Very Long Names In A Constrained Space",
            avatarLargeUrl: userImage,
            description:
              "This is a very long description that goes on and on and on to test how the layout handles extremely verbose text in a constrained space.",
          },
          `background-color: ${SCHEME.neutral4};`,
        );

        // Execute
        document.body.append(this.cut);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_context_item_long.png"),
          path.join(__dirname, "/golden/publisher_context_item_long.png"),
          path.join(__dirname, "/publisher_context_item_long_diff.png"),
        );

        // Execute
        await setDesktopView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_context_item_wide.png"),
          path.join(__dirname, "/golden/publisher_context_item_wide.png"),
          path.join(__dirname, "/publisher_context_item_wide_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
