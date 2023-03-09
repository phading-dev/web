import { normalizeBody } from "./normalize_body";
import { VerticalTextInputWithErrorMsg } from "./text_input";
import { E } from "@selfage/element/factory";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/test_runner";

normalizeBody();

TEST_RUNNER.run({
  name: "TextInputTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderVerticalTextInput";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = VerticalTextInputWithErrorMsg.create(
          "Input",
          "width: 50rem;"
        );

        // Execute
        this.container = E.div(
          {},
          cut.body,
          E.div(
            {
              style: `font-size: 1.4rem; color: black;`,
            },
            E.text("following lines....")
          )
        );
        document.body.append(this.container);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/vertical_text_input_render.png",
          __dirname + "/golden/vertical_text_input_render.png",
          __dirname + "/vertical_text_input_render_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.showError("Failed to validate.");

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/vertical_text_input_with_error.png",
          __dirname + "/golden/vertical_text_input_with_error.png",
          __dirname + "/vertical_text_input_with_error_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.hideError();

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/vertical_text_input_hide_error.png",
          __dirname + "/golden/vertical_text_input_render.png",
          __dirname + "/vertical_text_input_hide_error_diff.png",
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
