import coverImage = require("./test_data/cover.jpg");
import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { ShowItem } from "./show_item";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "../../../../common/normalize_body";

function createRepeatedStrings(base: string, times: number): string {
  let arr = new Array<string>();
  for (let i = 0; i < times; i++) {
    arr.push(base);
  }
  return arr.join(" ");
}

TEST_RUNNER.run({
  name: "ShowItemTest",
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: ShowItem;
      public async execute() {
        // Prepare
        await setViewport(500, 400);

        // Execute
        this.cut = new ShowItem({
          showId: "id1",
          name: "This is a title",
          coverImagePath: coverImage,
          length: 12,
          publishedTime: 123456,
          publisher: {
            avatarSmallPath: userImage,
            naturalName: "First second",
          },
        });
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/show_item_default.png"),
          path.join(__dirname, "/golden/show_item_default.png"),
          path.join(__dirname, "/show_item_default_diff.png"),
          {
            fullPage: true,
          }
        );

        // Execute
        this.cut.hover();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/show_item_hover.png"),
          path.join(__dirname, "/golden/show_item_hover.png"),
          path.join(__dirname, "/show_item_hover_diff.png"),
          {
            fullPage: true,
          }
        );

        // Execute
        this.cut.leave();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/show_item_leave.png"),
          path.join(__dirname, "/golden/show_item_default.png"),
          path.join(__dirname, "/show_item_leave_diff.png"),
          {
            fullPage: true,
            threshold: 0.4
          }
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Long";
      private cut: ShowItem;
      public async execute() {
        // Prepare
        await setViewport(500, 400);

        // Execute
        this.cut = new ShowItem({
          showId: "id1",
          name: createRepeatedStrings("11 22 33 44 55 66", 15),
          coverImagePath: coverImage,
          length: 3789,
          publishedTime: 1234567890,
          publisher: {
            avatarSmallPath: userImage,
            naturalName: createRepeatedStrings("1 2 3 4 5 6", 8),
          },
        });
        document.body.append(this.cut.body);
        this.cut.hover();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/show_item_long.png"),
          path.join(__dirname, "/golden/show_item_long.png"),
          path.join(__dirname, "/show_item_long_diff.png"),
          {
            fullPage: true,
          }
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ClickUser_ClickItem";
      private cut: ShowItem;
      public async execute() {
        // Prepare
        await setViewport(500, 400);
        this.cut = new ShowItem({
          showId: "id1",
          name: "11 22 33 44 55 66",
          coverImagePath: coverImage,
          length: 3789,
          publishedTime: 1234567890,
          publisher: {
            accountId: "user 1",
            avatarSmallPath: userImage,
            naturalName: "1 2 3 4 5 6",
          },
        });
        document.body.append(this.cut.body);
        let playingShowId: string;
        this.cut.on("play", (showId) => (playingShowId = showId));
        let focusUserId: string;
        this.cut.on("focusUser", (accountId) => (focusUserId = accountId));

        // Execute
        this.cut.clickUser();

        // Verify
        assertThat(focusUserId, eq("user 1"), "focus user");
        assertThat(playingShowId, eq(undefined), "show not playing");

        // Execute
        this.cut.click();

        // Verify
        assertThat(playingShowId, eq("id1"), "show not playing");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
