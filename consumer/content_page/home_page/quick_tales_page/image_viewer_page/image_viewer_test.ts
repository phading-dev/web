import tallImage = require("./test_data/tall.webp");
import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { ImageViewer } from "./image_viewer";
import { E } from "@selfage/element/factory";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import "../../../../common/normalize_body";

let container: HTMLDivElement;
let controllerContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "ImageViewerTest",
  environment: {
    setUp() {
      container = E.div({});
      controllerContainer = E.div({
        style: `position: fixed; left: 0; top: 0;`,
      });
      document.body.append(container, controllerContainer);
    },
    tearDown() {
      container.remove();
      controllerContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "RenderAndScroll";
      private cut: ImageViewer;
      public async execute() {
        // Prepare
        await setViewport(1000, 400);

        // Execute
        this.cut = new ImageViewer(wideImage);
        container.append(this.cut.body);
        controllerContainer.append(...this.cut.controllerBodies);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_render.png"),
          path.join(__dirname, "/golden/image_viewer_render.png"),
          path.join(__dirname, "/image_viewer_render_diff.png")
        );

        // Execute
        await setViewport(400, 400);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_shrink_viewport.png"),
          path.join(__dirname, "/golden/image_viewer_shrink_viewport.png"),
          path.join(__dirname, "/image_viewer_shrink_viewport_diff.png")
        );

        // Execute
        window.scrollTo(400, 0);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_scroll_to_right.png"),
          path.join(__dirname, "/golden/image_viewer_scroll_to_right.png"),
          path.join(__dirname, "/image_viewer_scroll_to_right_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderTall";
      private cut: ImageViewer;
      public async execute() {
        // Prepare
        await setViewport(400, 400);

        // Execute
        this.cut = new ImageViewer(tallImage);
        container.append(this.cut.body);
        controllerContainer.append(...this.cut.controllerBodies);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_render_tall.png"),
          path.join(__dirname, "/golden/image_viewer_render_tall.png"),
          path.join(__dirname, "/image_viewer_render_tall_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ZoomInAndOut";
      private cut: ImageViewer;
      public async execute() {
        // Prepare
        await setViewport(1000, 400);
        this.cut = new ImageViewer(wideImage);
        container.append(this.cut.body);
        controllerContainer.append(...this.cut.controllerBodies);

        // Prepare
        await setViewport(400, 400);

        // Execute
        this.cut.zoomFitButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_shrink_and_fit.png"),
          path.join(__dirname, "/golden/image_viewer_shrink_and_fit.png"),
          path.join(__dirname, "/image_viewer_shrink_and_fit_diff.png")
        );

        // Execute
        this.cut.zoomInButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_zoom_in.png"),
          path.join(__dirname, "/golden/image_viewer_zoom_in.png"),
          path.join(__dirname, "/image_viewer_zoom_in_diff.png")
        );

        // Execute
        this.cut.zoomInButton.click();
        this.cut.zoomInButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_zoom_in_more.png"),
          path.join(__dirname, "/golden/image_viewer_zoom_in_more.png"),
          path.join(__dirname, "/image_viewer_zoom_in_more_diff.png")
        );

        // Execute
        this.cut.zoomOutButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_zoom_out.png"),
          path.join(__dirname, "/golden/image_viewer_zoom_out.png"),
          path.join(__dirname, "/image_viewer_zoom_out_diff.png")
        );

        // Execute
        this.cut.zoomOutButton.click();
        this.cut.zoomOutButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_zoom_out_more.png"),
          path.join(__dirname, "/golden/image_viewer_zoom_out_more.png"),
          path.join(__dirname, "/image_viewer_zoom_out_more_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ZoomInAndScroll";
      private cut: ImageViewer;
      public async execute() {
        // Prepare
        await setViewport(400, 400);
        this.cut = new ImageViewer(wideImage);
        container.append(this.cut.body);
        controllerContainer.append(...this.cut.controllerBodies);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        this.cut.zoomInButton.click();
        this.cut.zoomInButton.click();

        // Execute
        window.scrollTo(150, 100);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_zoom_in_and_scroll.png"),
          path.join(__dirname, "/golden/image_viewer_zoom_in_and_scroll.png"),
          path.join(__dirname, "/image_viewer_zoom_in_and_scroll_diff.png")
        );

        // Execute
        this.cut.zoomInButton.click();
        this.cut.zoomInButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_scroll_then_zoom_in.png"),
          path.join(__dirname, "/golden/image_viewer_scroll_then_zoom_in.png"),
          path.join(__dirname, "/image_viewer_scroll_then_zoom_in_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
