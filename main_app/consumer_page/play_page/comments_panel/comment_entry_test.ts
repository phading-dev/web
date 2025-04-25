import "../../../../common/normalize_body";
import userImage = require("../../common/test_data/user_image.jpg");
import path = require("path");
import { SCHEME } from "../../../../common/color_scheme";
import { CommentEntry } from "./comment_entry";
import { E } from "@selfage/element/factory";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

let container: HTMLDivElement;

TEST_RUNNER.run({
  name: "CommentEntryTest",
  environment: {
    setUp() {
      container = E.div({
        style: `margin-top: 5rem; background-color: ${SCHEME.neutral4};`,
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
      private cut: CommentEntry;
      public async execute() {
        // Prepare
        await setViewport(300, 200);
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
        await setViewport(600, 400);
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
