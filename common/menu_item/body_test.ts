import path = require("path");
import { SCHEME } from "../color_scheme";
import { createHomeIcon } from "../icons";
import { MenuItem } from "./body";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import "../normalize_body";

TEST_RUNNER.run({
  name: "MenuItemTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_Hover_Leave";
      private cut: MenuItem;
      public async execute() {
        // Prepare
        this.cut = new MenuItem(
          createHomeIcon(SCHEME.neutral1),
          `1rem`,
          "A long long test label"
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/menu_item_default.png"),
          path.join(__dirname, "/golden/menu_item_default.png"),
          path.join(__dirname, "/menu_item_default_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.body.dispatchEvent(new MouseEvent("mouseover"));
        await new Promise<void>((resolve) =>
          this.cut.once("transitionEnded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/menu_item_hover.png"),
          path.join(__dirname, "/golden/menu_item_hover.png"),
          path.join(__dirname, "/menu_item_hover_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.body.dispatchEvent(new MouseEvent("mouseleave"));
        await new Promise<void>((resolve) =>
          this.cut.once("transitionEnded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/menu_item_collapsed.png"),
          path.join(__dirname, "/golden/menu_item_default.png"),
          path.join(__dirname, "/menu_item_collapsed_diff.png"),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
