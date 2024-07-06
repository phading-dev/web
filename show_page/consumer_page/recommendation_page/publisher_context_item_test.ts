import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { PublisherContextItem } from "./publisher_context_item";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import "../../../common/normalize_body";

TEST_RUNNER.run({
  name: "PublisherContextItemTest",
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: PublisherContextItem;
      public async execute() {
        // Prepare
        await setViewport(600, 500);
        this.cut = new PublisherContextItem({
          accountId: "account 1",
          naturalName: "First Second",
          avatarLargePath: userImage,
        });

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_context_item_default.png"),
          path.join(__dirname, "/golden/publisher_context_item_default.png"),
          path.join(__dirname, "/publisher_context_item_default_diff.png"),
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
      public name = "Long";
      private cut: PublisherContextItem;
      public async execute() {
        // Prepare
        await setViewport(600, 500);
        this.cut = new PublisherContextItem({
          accountId: "account 1 2 3 4 5 6 7 8 9 10",
          naturalName:
            "First Second First Second First Second First Second First Second First Second First Second First Second First Second First Second First Second First Second First Second First Second",
          avatarLargePath: userImage,
          description:
            "some long long description some long long description some long long description some long long descriptionsome long long descriptionsome long long description some long long description some long long description some long long descriptionsome long long description some long long description",
        });

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_context_item_long.png"),
          path.join(__dirname, "/golden/publisher_context_item_long.png"),
          path.join(__dirname, "/publisher_context_item_long_diff.png"),
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
      public name = "Wide";
      private cut: PublisherContextItem;
      public async execute() {
        // Prepare
        await setViewport(1600, 500);
        this.cut = new PublisherContextItem({
          accountId: "account 1",
          naturalName: "First Second",
          avatarLargePath: userImage,
        });

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_context_item_wide.png"),
          path.join(__dirname, "/golden/publisher_context_item_wide.png"),
          path.join(__dirname, "/publisher_context_item_wide_diff.png"),
          {
            fullPage: true,
          },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
