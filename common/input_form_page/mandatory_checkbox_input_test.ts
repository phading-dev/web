import path = require("path");
import { normalizeBody } from "../normalize_body";
import { setTabletView } from "../view_port";
import { MandatoryCheckboxInput } from "./mandatory_checkbox_input";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "MandatoryCheckboxInputTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_InvalidWithErrors_Valid_InvalidWithoutErrors";
      private cut: MandatoryCheckboxInput;
      public async execute() {
        // Execute
        await setTabletView();
        this.cut = new MandatoryCheckboxInput(
          "",
          E.text("Something something label"),
        );
        let refreshed = false;
        this.cut.on("refresh", () => (refreshed = true));
        this.cut.validate();
        document.body.append(this.cut.body);

        // Verify
        assertThat(
          this.cut.isValid,
          eq(false),
          "Initial empty input is invalid",
        );
        assertThat(refreshed, eq(false), "No refresh for initialization");
        await asyncAssertScreenshot(
          path.join(__dirname, "/mandatory_checkbox_input_default.png"),
          path.join(__dirname, "/golden/mandatory_checkbox_input_default.png"),
          path.join(__dirname, "/mandatory_checkbox_input_default_diff.png"),
          { fullPage: true },
        );

        // Execute
        this.cut.click();

        // Verify
        assertThat(
          this.cut.isValid,
          eq(true),
          "Valid",
        );
        assertThat(refreshed, eq(true), "Refresh after click");
        await asyncAssertScreenshot(
          path.join(__dirname, "/mandatory_checkbox_input_valid.png"),
          path.join(__dirname, "/golden/mandatory_checkbox_input_valid.png"),
          path.join(__dirname, "/mandatory_checkbox_input_valid_diff.png"),
          { fullPage: true },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
