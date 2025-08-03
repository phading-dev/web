import tallImage = require("./test_data/tall.jpg");
import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { normalizeBody } from "./normalize_body";
import { eCoverImage } from "./season_cover_image";
import { setTabletView } from "./view_port";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { TestCase } from "@selfage/test_runner";

normalizeBody();

TEST_RUNNER.run({
  name: "SliderTest",
  cases: [
    new (class implements TestCase {
      public name = "WithWideImage";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 400px;`,
        });
        document.body.append(this.container);

        // Execute
        this.container.append(eCoverImage("100%", wideImage));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_cover_image_wide_image.png"),
          path.join(__dirname, "/golden/season_cover_image_wide_image.png"),
          path.join(__dirname, "/season_cover_image_wide_image_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "WithTallImage";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 400px;`,
        });
        document.body.append(this.container);

        // Execute
        this.container.append(eCoverImage("100%", tallImage));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_cover_image_tall_image.png"),
          path.join(__dirname, "/golden/season_cover_image_tall_image.png"),
          path.join(__dirname, "/season_cover_image_tall_image_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "WithoutImage";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 400px;`,
        });
        document.body.append(this.container);

        // Execute
        this.container.append(eCoverImage("100%"));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_cover_image_without_image.png"),
          path.join(__dirname, "/golden/season_cover_image_without_image.png"),
          path.join(__dirname, "/season_cover_image_without_image_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "WithoutImageSmallContainer";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100px;`,
        });
        document.body.append(this.container);

        // Execute
        this.container.append(eCoverImage("100%"));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/season_cover_image_without_image_small.png"),
          path.join(__dirname, "/golden/season_cover_image_without_image_small.png"),
          path.join(__dirname, "/season_cover_image_without_image_small_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
