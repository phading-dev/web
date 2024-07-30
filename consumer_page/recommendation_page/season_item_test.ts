import coverImage = require("./test_data/cover.jpg");
import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { SeasonItem } from "./season_item";
import { E } from "@selfage/element/factory";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "../../common/normalize_body";

function createRepeatedStrings(base: string, times: number): string {
  let arr = new Array<string>();
  for (let i = 0; i < times; i++) {
    arr.push(base);
  }
  return arr.join(" ");
}

let container: HTMLDivElement;

TEST_RUNNER.run({
  name: "SeasonItemTest",
  environment: {
    setUp() {
      container = E.div({
        style: `width: 24.2rem;`,
      });
      document.body.append(container);
    },
    tearDown() {
      container.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: SeasonItem;
      public async execute() {
        // Prepare
        await setViewport(500, 400);

        // Execute
        this.cut = new SeasonItem({
          seasonId: "id1",
          name: "This is a title",
          coverImagePath: coverImage,
          grade: 1,
          continueEpisode: {
            episodeId: "ep1",
            name: "Episode 1",
            length: 12,
            publishedTime: 123456,
          },
          publisher: {
            avatarSmallPath: userImage,
            naturalName: "First second",
          },
        });
        container.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_item_default.png"),
          path.join(__dirname, "/golden/season_item_default.png"),
          path.join(__dirname, "/season_item_default_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        this.cut.hover();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_item_hover.png"),
          path.join(__dirname, "/golden/season_item_hover.png"),
          path.join(__dirname, "/season_item_hover_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        this.cut.leave();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_item_leave.png"),
          path.join(__dirname, "/golden/season_item_default.png"),
          path.join(__dirname, "/season_item_leave_diff.png"),
          {
            fullPage: true,
            threshold: 0.4,
          },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Long";
      private cut: SeasonItem;
      public async execute() {
        // Prepare
        await setViewport(500, 400);

        // Execute
        this.cut = new SeasonItem({
          seasonId: "id1",
          name: createRepeatedStrings("11 22 33 44 55", 20),
          coverImagePath: coverImage,
          grade: 1,
          continueEpisode: {
            episodeId: "ep1",
            name: createRepeatedStrings("00 99 88 77 66", 20),
            length: 3600,
            publishedTime: 123456,
          },
          publisher: {
            avatarSmallPath: userImage,
            naturalName: createRepeatedStrings("1 2 3 4 5 6", 8),
          },
        });
        container.append(this.cut.body);
        this.cut.hover();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_item_long.png"),
          path.join(__dirname, "/golden/season_item_long.png"),
          path.join(__dirname, "/season_item_long_diff.png"),
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
      public name = "ClickUser_ClickItem";
      private cut: SeasonItem;
      public async execute() {
        // Prepare
        await setViewport(500, 400);
        this.cut = new SeasonItem({
          seasonId: "id1",
          name: "11 22 33 44 55 66",
          coverImagePath: coverImage,
          grade: 1,
          continueEpisode: {
            episodeId: "ep1",
            name: "Episode 1",
            length: 12,
            publishedTime: 123456,
          },
          publisher: {
            accountId: "user 1",
            avatarSmallPath: userImage,
            naturalName: "1 2 3 4 5 6",
          },
        });
        container.append(this.cut.body);
        let toPlayEpisodeId: string;
        this.cut.on("play", (episodeId) => (toPlayEpisodeId = episodeId));
        let focusAccountId: string;
        this.cut.on(
          "focusAccount",
          (accountId) => (focusAccountId = accountId),
        );

        // Execute
        this.cut.clickAccount();

        // Verify
        assertThat(focusAccountId, eq("user 1"), "focus account");
        assertThat(toPlayEpisodeId, eq(undefined), "episode not to play");

        // Execute
        this.cut.click();

        // Verify
        assertThat(toPlayEpisodeId, eq("ep1"), "episode to play");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
