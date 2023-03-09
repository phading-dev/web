import tallImage = require("./test_data/tall.webp");
import wideImage = require("./test_data/wide.jpeg");
import { normalizeBody } from "../../../../common/normalize_body";
import { ImageEditor } from "./image_editor";
import { E } from "@selfage/element/factory";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/test_runner";

normalizeBody();

TEST_RUNNER.run({
  name: "ImageEditorTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderWide";
      private container: HTMLDivElement;
      public async execute() {
        // Execute
        let cut = ImageEditor.create(wideImage);
        this.container = E.div({}, cut.body);
        document.body.append(this.container);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/image_editor_wide_render.png",
          __dirname + "/golden/image_editor_wide_render.png",
          __dirname + "/image_editor_wide_render_diff.png",
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderTall";
      private container: HTMLDivElement;
      public async execute() {
        // Execute
        let cut = await ImageEditor.create(tallImage);
        this.container = E.div({}, cut.body);
        document.body.append(this.container);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/image_editor_tall_render.png",
          __dirname + "/golden/image_editor_tall_render.png",
          __dirname + "/image_editor_tall_render_diff.png",
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
