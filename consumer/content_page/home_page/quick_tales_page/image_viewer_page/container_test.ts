import sampleImage = require("./test_data/sample.jpg");
import tallImage = require("./test_data/tall.webp");
import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { ImagesViewerPage } from "./container";
import { E } from "@selfage/element/factory";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { Ref } from "@selfage/ref";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "ImagesViewerPageTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderAndNavigate";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setViewport(400, 400);
        let menuBodyContainerRef = new Ref<HTMLDivElement>();
        let controllerBodyContainerRef = new Ref<HTMLDivElement>();
        this.container = E.div(
          {},
          E.divRef(menuBodyContainerRef, {
            style: `position: fixed;`,
          }),
          E.divRef(controllerBodyContainerRef, {
            style: `position: fixed; right: 0;`,
          })
        );
        document.body.append(this.container);
        let cut = new ImagesViewerPage(
          (bodies) => this.container.append(...bodies),
          (menuBodies) => menuBodyContainerRef.val.append(...menuBodies),
          (controllerBodies) =>
            controllerBodyContainerRef.val.append(...controllerBodies)
        );

        // Execute
        await cut.show([wideImage, tallImage, sampleImage], 0);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/images_viewer_page_render.png"),
          path.join(__dirname, "/golden/images_viewer_page_render.png"),
          path.join(__dirname, "/images_viewer_page_render_diff.png")
        );

        // Execute
        cut.downButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/images_viewer_page_next.png"),
          path.join(__dirname, "/golden/images_viewer_page_next.png"),
          path.join(__dirname, "/images_viewer_page_next_diff.png")
        );

        // Execute
        cut.downButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/images_viewer_page_last.png"),
          path.join(__dirname, "/golden/images_viewer_page_last.png"),
          path.join(__dirname, "/images_viewer_page_last_diff.png")
        );

        // Execute
        cut.upButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/images_viewer_page_previous.png"),
          path.join(__dirname, "/golden/images_viewer_page_previous.png"),
          path.join(__dirname, "/images_viewer_page_previous_diff.png")
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderAndHideAndShow";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setViewport(400, 400);
        let menuBodyContainerRef = new Ref<HTMLDivElement>();
        let controllerBodyContainerRef = new Ref<HTMLDivElement>();
        this.container = E.div(
          {},
          E.divRef(menuBodyContainerRef, {
            style: `position: fixed;`,
          }),
          E.divRef(controllerBodyContainerRef, {
            style: `position: fixed; right: 0;`,
          })
        );
        document.body.append(this.container);
        let cut = new ImagesViewerPage(
          (bodies) => this.container.append(...bodies),
          (menuBodies) => menuBodyContainerRef.val.append(...menuBodies),
          (controllerBodies) =>
            controllerBodyContainerRef.val.append(...controllerBodies)
        );

        // Execute
        await cut.show([wideImage, tallImage, sampleImage], 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/images_viewer_page_render_the_second.png"),
          path.join(
            __dirname,
            "/golden/images_viewer_page_render_the_second.png"
          ),
          path.join(__dirname, "/images_viewer_page_render_the_second_diff.png")
        );

        // Execute
        cut.hide();
        await cut.show([sampleImage], 0);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/images_viewer_page_show_after_hide.png"),
          path.join(
            __dirname,
            "/golden/images_viewer_page_show_after_hide.png"
          ),
          path.join(__dirname, "/images_viewer_page_show_after_hide_diff.png")
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Back";
      public async execute() {
        // Prepare
        let cut = new ImagesViewerPage(
          () => {},
          () => {},
          () => {}
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
