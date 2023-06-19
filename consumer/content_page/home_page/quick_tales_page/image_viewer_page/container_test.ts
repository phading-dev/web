import sampleImage = require("./test_data/sample.jpg");
import tallImage = require("./test_data/tall.webp");
import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { ImagesViewerPage } from "./container";
import { E } from "@selfage/element/factory";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import "../../../../common/normalize_body";

let menuContainer: HTMLDivElement;
let controllerContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "ImagesViewerPageTest",
  environment: {
    setUp: () => {
      menuContainer = E.div({
        style: `position: fixed; left: 0; top: 0;`,
      });
      controllerContainer = E.div({
        style: `position: fixed; right: 0; top: 0;`,
      });
      document.body.append(menuContainer, controllerContainer);
    },
    tearDown: () => {
      menuContainer.remove();
      controllerContainer.remove();      
    }
  },
  cases: [
    new (class implements TestCase {
      public name = "RenderAndNavigate";
      private cut: ImagesViewerPage;
      public async execute() {
        // Prepare
        await setViewport(400, 400);

        // Execute
        this.cut = new ImagesViewerPage(
          (...bodies) => document.body.append(...bodies),
          (...menuBodies) => menuContainer.append(...menuBodies),
          (...controllerBodies) =>
            controllerContainer.append(...controllerBodies),
          [wideImage, tallImage, sampleImage],
          0
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/images_viewer_page_render.png"),
          path.join(__dirname, "/golden/images_viewer_page_render.png"),
          path.join(__dirname, "/images_viewer_page_render_diff.png")
        );

        // Execute
        this.cut.downButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/images_viewer_page_next.png"),
          path.join(__dirname, "/golden/images_viewer_page_next.png"),
          path.join(__dirname, "/images_viewer_page_next_diff.png")
        );

        // Execute
        this.cut.downButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/images_viewer_page_last.png"),
          path.join(__dirname, "/golden/images_viewer_page_last.png"),
          path.join(__dirname, "/images_viewer_page_last_diff.png")
        );

        // Execute
        this.cut.upButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/images_viewer_page_previous.png"),
          path.join(__dirname, "/golden/images_viewer_page_previous.png"),
          path.join(__dirname, "/images_viewer_page_previous_diff.png")
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
        let cut = new ImagesViewerPage(
          () => {},
          () => {},
          () => {},
          [wideImage, tallImage, sampleImage],
          0
        );
        let goBack = false;
        cut.on("back", () => (goBack = true));

        // Execute
        cut.backMenuItem.click();

        // Verify
        assertThat(goBack, eq(true), `Go back`);
      }
    })(),
  ],
});
