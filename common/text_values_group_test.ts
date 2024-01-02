import path = require("path");
import { TextValuesGroup } from "./text_values_group";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "./normalize_body";

TEST_RUNNER.run({
  name: "TextValuesGroupTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_Click";
      private cut: TextValuesGroup;
      public async execute() {
        // Prepare
        await setViewport(800, 600);
        this.cut = new TextValuesGroup(
          [
            {
              label: "Name",
              value: "first name",
            },
            {
              label: "Email",
            },
          ],
          ""
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_values_group_default.png"),
          path.join(__dirname, "/golden/text_values_group_default.png"),
          path.join(__dirname, "/text_values_group_default_diff.png")
        );

        // Prepare
        let acted = false;
        this.cut.on("action", () => (acted = true));

        // Execute
        this.cut.click();

        // Verify
        assertThat(acted, eq(true), "Action");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
