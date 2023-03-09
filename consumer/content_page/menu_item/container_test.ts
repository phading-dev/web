import { SCHEME } from "../../common/color_scheme";
import { createHomeIcon } from "../../common/icons";
import { normalizeBody } from "../../common/normalize_body";
import { MenuItem } from "./container";
import { E } from "@selfage/element/factory";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/test_runner";
import "@selfage/puppeteer_test_executor_api";

normalizeBody();

TEST_RUNNER.run({
  name: "MenuItemTest",
  cases: [
    new (class implements TestCase {
      public name = "Render";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new MenuItem(
          createHomeIcon(SCHEME.neutral1),
          `1rem`,
          "A long long test label"
        ).show();
        this.container = E.div({}, cut.body);

        // Execute
        document.body.append(this.container);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/menu_item_render.png",
          __dirname + "/golden/menu_item_render.png",
          __dirname + "/menu_item_render_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.body.dispatchEvent(new MouseEvent("mouseover"));
        await new Promise<void>((resolve) =>
          cut.once("transitionEnded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/menu_item_hover.png",
          __dirname + "/golden/menu_item_hover.png",
          __dirname + "/menu_item_hover_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.body.dispatchEvent(new MouseEvent("mouseleave"));
        await new Promise<void>((resolve) =>
          cut.once("transitionEnded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/menu_item_collapsed.png",
          __dirname + "/golden/menu_item_render.png",
          __dirname + "/menu_item_collapsed_diff.png",
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
