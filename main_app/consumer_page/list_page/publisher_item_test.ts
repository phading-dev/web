import "../../../common/normalize_body";
import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { SCHEME } from "../../../common/color_scheme";
import { PublisherItem } from "./publisher_item";
import { E } from "@selfage/element/factory";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

TEST_RUNNER.run({
  name: "PublisherItemTest",
  cases: [
    new (class implements TestCase {
      public name = "LongName";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setViewport(200, 400);
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4};`,
        });
        document.body.append(this.container);
        let cut = new PublisherItem({
          accountId: "xvadxvad-accd-axvf-cads-xvadxvadxvad",
          avatarSmallUrl: userImage,
          naturalName:
            "Suuuuuuuuuuper long name that is longer than the width of the screen",
        });

        // Execute
        this.container.append(cut.body);

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
      public name = "ShortName";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setViewport(200, 400);
        this.container = E.div({
          style: `background-color: ${SCHEME.neutral4};`,
        });
        document.body.append(this.container);
        let cut = new PublisherItem({
          accountId: "xvadxvad-accd-axvf-cads-xvadxvadxvad",
          avatarSmallUrl: userImage,
          naturalName:
            "Ha",
        });

        // Execute
        this.container.append(cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/publisher_item_short.png"),
          path.join(__dirname, "/golden/publisher_item_short.png"),
          path.join(__dirname, "/publisher_item_short_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
