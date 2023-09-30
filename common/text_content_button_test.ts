import path = require("path");
import { TextContentButton } from "./text_content_button";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "./normalize_body";

TEST_RUNNER.run({
  name: "TextContentButtonTest",
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: TextContentButton;
      public async execute() {
        // Execute
        this.cut = new TextContentButton("Label", "Value", "width: 400px;");
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_content_button_default.png"),
          path.join(__dirname, "/golden/text_content_button_default.png"),
          path.join(__dirname, "/text_content_button_default_diff.png"),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Long";
      private cut: TextContentButton;
      public async execute() {
        // Execute
        this.cut = new TextContentButton(
          "Label",
          "Long Long Long Long Long Long Long Long Long Long Long Long Long Long Long Long Long",
          "width: 400px;"
        );
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_content_button_long.png"),
          path.join(__dirname, "/golden/text_content_button_long.png"),
          path.join(__dirname, "/text_content_button_long_diff.png"),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Click";
      private cut: TextContentButton;
      public async execute() {
        // Prepare
        this.cut = new TextContentButton("Label", "Value", "width: 400px;");
        let clicked = false;
        this.cut.on("action", () => (clicked = true));

        // Execute
        this.cut.clickable.click();

        // Verify
        assertThat(clicked, eq(true), "clicked");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
