import path = require("path");
import { normalizeBody } from "./normalize_body";
import { eColumnBoxWithArrow, eLabelAndText } from "./value_box";
import { setTabletView } from "./view_port";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "ValueBoxTest",
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = eColumnBoxWithArrow([
          eLabelAndText("Name", "first name"),
          eLabelAndText("Email"),
        ]);

        // Execute
        document.body.append(this.cut);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/column_box_with_arrow_default.png"),
          path.join(__dirname, "/golden/column_box_with_arrow_default.png"),
          path.join(__dirname, "/column_box_with_arrow_default_diff.png"),
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
        this.cut = eColumnBoxWithArrow(
          [eLabelAndText("Name", "first name"), eLabelAndText("Email")],
          {
            clickable: false,
          },
        );

        // Execute
        document.body.append(this.cut);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/column_box_with_arrow_not_clickable.png"),
          path.join(__dirname, "/golden/column_box_with_arrow_not_clickable.png"),
          path.join(__dirname, "/column_box_with_arrow_not_clickable_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
