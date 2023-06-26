import tallImage = require("./test_data/tall.webp");
import wideImage = require("./test_data/wide.jpeg");
import { ImagePreviewer } from "./image_previewer";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import "../../../../common/normalize_body";

TEST_RUNNER.run({
  name: "ImagePreviewerTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderWide";
      private cut: ImagePreviewer;
      public async execute() {
        // Execute
        this.cut = ImagePreviewer.create(wideImage);
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/image_previewer_wide_render.png",
          __dirname + "/golden/image_previewer_wide_render.png",
          __dirname + "/image_previewer_wide_render_diff.png",
          { fullPage: true }
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderTall";
      private cut: ImagePreviewer;
      public async execute() {
        // Execute
        this.cut = await ImagePreviewer.create(tallImage);
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/image_previewer_tall_render.png",
          __dirname + "/golden/image_previewer_tall_render.png",
          __dirname + "/image_previewer_tall_render_diff.png",
          { fullPage: true }
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
