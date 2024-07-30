import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { CommentEntry } from "./comment_entry";
import { E } from "@selfage/element/factory";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import "../../../common/normalize_body";

let container: HTMLDivElement;

TEST_RUNNER.run({
  name: "CommentEntryTest",
  environment: {
    setUp() {
      container = E.div({
        style: `margin-top: 5rem;`,
      });
      document.body.append(container);
    },
    tearDown() {
      container.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Default_ShowActions_ShowTooltip_Dislike";
      private cut: CommentEntry;
      public async execute() {
        // Prepare
        await setViewport(300, 200);
        this.cut = new CommentEntry({
          commentId: "id1",
          author: {
            naturalName: "First Second",
            avatarSmallPath: userImage,
          },
          content: "Some some content",
        });

        // Execute
        container.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comment_entry_default.png"),
          path.join(__dirname, "/golden/comment_entry_default.png"),
          path.join(__dirname, "/comment_entry_default_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "LongContentAsPublisher";
      private cut: CommentEntry;
      public async execute() {
        // Prepare
        await setViewport(300, 200);
        this.cut = new CommentEntry({
          author: {
            naturalName:
              "First Second First Second First Second First Second First Second",
            avatarSmallPath: userImage,
          },
          content:
            "Some some content Some some content Some some content Some some content Some some content",
          isThePublisher: true,
        });

        // Execute
        container.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/comment_entry_long.png"),
          path.join(__dirname, "/golden/comment_entry_long.png"),
          path.join(__dirname, "/comment_entry_long_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
