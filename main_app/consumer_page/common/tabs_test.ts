import path = require("path");
import { normalizeBody } from "../../../common/normalize_body";
import { setDesktopView, setPhoneView, setTabletView } from "../../../common/view_port";
import { ActivityTab, ActivityTabsOption } from "./tabs";
import { E } from "@selfage/element/factory";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "TabsTest",
  cases: [
    new (class implements TestCase {
      public name = "Tablet";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%;`,
        });
        document.body.append(this.container);
        let tabs = new ActivityTabsOption().setValue(ActivityTab.HISTORY);

        // Execute
        this.container.append(tabs.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/activity_tabs_tablet.png"),
          path.join(__dirname, "/golden/activity_tabs_tablet.png"),
          path.join(__dirname, "/activity_tabs_tablet_diff.png"),
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/activity_tabs_phone.png"),
          path.join(__dirname, "/golden/activity_tabs_phone.png"),
          path.join(__dirname, "/activity_tabs_phone_diff.png"),
        );

        // Execute
        await setDesktopView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/activity_tabs_desktop.png"),
          path.join(__dirname, "/golden/activity_tabs_desktop.png"),
          path.join(__dirname, "/activity_tabs_desktop_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
