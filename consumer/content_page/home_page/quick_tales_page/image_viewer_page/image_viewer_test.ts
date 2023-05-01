import tallImage = require("./test_data/tall.webp");
import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { ImageViewer } from "./image_viewer";
import { E } from "@selfage/element/factory";
import { setViewport } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "ImageViewerTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderAndScroll";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setViewport(1000, 400);

        // Execute
        let cut = new ImageViewer(wideImage).show();
        this.container = E.div(
          {},
          E.div(
            {
              style: `position: fixed;`,
            },
            ...cut.controllerBodies
          ),
          cut.body
        );
        document.body.appendChild(this.container);

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
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "RenderTall";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setViewport(400, 400);

        // Execute
        let cut = new ImageViewer(tallImage).show();
        this.container = E.div(
          {},
          E.div(
            {
              style: `position: fixed;`,
            },
            ...cut.controllerBodies
          ),
          cut.body
        );
        document.body.appendChild(this.container);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_render_tall.png"),
          path.join(__dirname, "/golden/image_viewer_render_tall.png"),
          path.join(__dirname, "/image_viewer_render_tall_diff.png")
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ZoomInAndOut";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setViewport(1000, 400);

        // Execute
        let cut = new ImageViewer(wideImage).show();
        this.container = E.div(
          {},
          E.div(
            {
              style: `position: fixed;`,
            },
            ...cut.controllerBodies
          ),
          cut.body
        );
        document.body.appendChild(this.container);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_render.png"),
          path.join(__dirname, "/golden/image_viewer_render.png"),
          path.join(__dirname, "/image_viewer_render_diff.png")
        );

        // Prepare
        await setViewport(400, 400);

        // Execute
        cut.zoomFitButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_shrink_and_fit.png"),
          path.join(__dirname, "/golden/image_viewer_shrink_and_fit.png"),
          path.join(__dirname, "/image_viewer_shrink_and_fit_diff.png")
        );

        // Execute
        cut.zoomInButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_zoom_in.png"),
          path.join(__dirname, "/golden/image_viewer_zoom_in.png"),
          path.join(__dirname, "/image_viewer_zoom_in_diff.png")
        );

        // Execute
        cut.zoomInButton.click();
        cut.zoomInButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_zoom_in_more.png"),
          path.join(__dirname, "/golden/image_viewer_zoom_in_more.png"),
          path.join(__dirname, "/image_viewer_zoom_in_more_diff.png")
        );

        // Execute
        cut.zoomOutButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_zoom_out.png"),
          path.join(__dirname, "/golden/image_viewer_zoom_out.png"),
          path.join(__dirname, "/image_viewer_zoom_out_diff.png")
        );

        // Execute
        cut.zoomOutButton.click();
        cut.zoomOutButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_zoom_out_more.png"),
          path.join(__dirname, "/golden/image_viewer_zoom_out_more.png"),
          path.join(__dirname, "/image_viewer_zoom_out_more_diff.png")
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ZoomInAndScroll";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setViewport(400, 400);
        let cut = new ImageViewer(wideImage).show();
        await new Promise<void>((resolve) => cut.once("loaded", resolve));
        this.container = E.div(
          {},
          E.div(
            {
              style: `position: fixed;`,
            },
            ...cut.controllerBodies
          ),
          cut.body
        );
        document.body.appendChild(this.container);
        cut.zoomInButton.click();
        cut.zoomInButton.click();

        // Execute
        window.scrollTo(150, 100);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_zoom_in_and_scroll.png"),
          path.join(__dirname, "/golden/image_viewer_zoom_in_and_scroll.png"),
          path.join(__dirname, "/image_viewer_zoom_in_and_scroll_diff.png")
        );

        // Execute
        cut.zoomInButton.click();
        cut.zoomInButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_viewer_scroll_then_zoom_in.png"),
          path.join(__dirname, "/golden/image_viewer_scroll_then_zoom_in.png"),
          path.join(__dirname, "/image_viewer_scroll_then_zoom_in_diff.png")
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
