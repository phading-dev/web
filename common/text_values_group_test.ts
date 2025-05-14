import path = require("path");
import { normalizeBody } from "./normalize_body";
import { eTextValue, eValuesGroup } from "./text_values_group";
import { setTabletView } from "./view_port";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "TextValuesGroupTest",
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = eValuesGroup(
          [eTextValue("Name", "first name"), eTextValue("Email")],
          true,
        );

        // Execute
        document.body.append(this.cut);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_values_group_default.png"),
          path.join(__dirname, "/golden/text_values_group_default.png"),
          path.join(__dirname, "/text_values_group_default_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "NotEditable";
      private cut: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = eValuesGroup(
          [eTextValue("Name", "first name"), eTextValue("Email")],
          false,
          "",
        );

        // Execute
        document.body.append(this.cut);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/text_values_group_not_editable.png"),
          path.join(__dirname, "/golden/text_values_group_not_editable.png"),
          path.join(__dirname, "/text_values_group_not_editable_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
