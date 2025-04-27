import userImage = require("../../common/test_data/user_image.jpg");
import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { CommentEntry } from "./comment_entry";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "CommentEntryTest",
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: CommentEntry;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = new CommentEntry({
          comment: {
            content: "Some some content",
          },
          author: {
            naturalName: "First Second",
            avatarSmallUrl: userImage,
          },
        });

        // Execute
        document.body.append(this.cut.body);

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
        await setTabletView();
        this.cut = new CommentEntry({
          comment: {
            content:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          },
          author: {
            naturalName:
              "First Second First Second First Second First Second First Second",
            avatarSmallUrl: userImage,
          },
        });

        // Execute
        document.body.append(this.cut.body);

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
