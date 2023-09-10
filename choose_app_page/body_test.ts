import path = require("path");
import { AppType } from "../app_type";
import { ChooseAppPage } from "./body";
import { E } from "@selfage/element/factory";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "../common/normalize_body";

let menuContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "ChooseAppPage",
  environment: {
    setUp: () => {
      menuContainer = E.div({ style: `position: fixed; left: 0; top: 0;` });
      document.body.append(menuContainer);
    },
    tearDown: () => {
      menuContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: ChooseAppPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);

        // Execute
        this.cut = new ChooseAppPage();
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.menuBody);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/choose_app_page_default.png"),
          path.join(__dirname, "/golden/choose_app_page_default.png"),
          path.join(__dirname, "/choose_app_page_default_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Back";
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let cut = new ChooseAppPage();
        let backCalled: boolean;
        cut.on("back", () => (backCalled = true));

        // Execute
        cut.backMenuItem.click();

        // Verify
        assertThat(backCalled, eq(true), "back called");
      }
    })(),
    new (class implements TestCase {
      public name = "ChooseChat";
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let cut = new ChooseAppPage();
        let appTypeCaptured: AppType;
        cut.on("chosen", (appType) => (appTypeCaptured = appType));

        // Execute
        cut.chatAppCard.click();

        // Verify
        assertThat(appTypeCaptured, eq(AppType.Chat), "chat app chosen");
      }
    })(),
    new (class implements TestCase {
      public name = "Back";
      public async execute() {
        // Prepare
        await setViewport(1000, 800);
        let cut = new ChooseAppPage();
        let appTypeCaptured: AppType;
        cut.on("chosen", (appType) => (appTypeCaptured = appType));

        // Execute
        cut.showAppCard.click();

        // Verify
        assertThat(appTypeCaptured, eq(AppType.Show), "show app chosen");
      }
    })(),
  ],
});
