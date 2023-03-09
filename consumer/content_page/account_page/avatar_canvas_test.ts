import highImage = require("./test_data/high.jpg");
import higherImage = require("./test_data/higher.jpg");
import wideImage = require("./test_data/wide.jpeg");
import widerImage = require("./test_data/wider.jpg");
import { normalizeBody } from "../../common/normalize_body";
import { AvatarCanvas } from "./avatar_canvas";
import { E } from "@selfage/element/factory";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/test_runner";
import "@selfage/puppeteer_test_executor_api";

normalizeBody();

TEST_RUNNER.run({
  name: "AvatarCanvasTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderAndResize";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new AvatarCanvas();
        this.container = E.div({}, cut.body);

        // Execute
        document.body.style.width = "460px";
        document.body.style.height = "460px";
        document.body.appendChild(this.container);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/avatar_canvas_render.png",
          __dirname + "/golden/avatar_canvas_render.png",
          __dirname + "/avatar_canvas_render_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.resizePointTopLeft.dispatchEvent(
          new MouseEvent("mousedown", {
            clientX: 120,
            clientY: 110,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/avatar_canvas_top_left_resize_mouse_down.png",
          __dirname + "/golden/avatar_canvas_top_left_resize_mouse_down.png",
          __dirname + "/avatar_canvas_top_left_resize_mouse_down_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.resizePointTopLeft.dispatchEvent(
          new MouseEvent("mousemove", {
            clientX: 100,
            clientY: 50,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/avatar_canvas_top_left_resize_mouse_move.png",
          __dirname + "/golden/avatar_canvas_top_left_resize_mouse_move.png",
          __dirname + "/avatar_canvas_top_left_resize_mouse_move_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.resizePointTopLeft.dispatchEvent(
          new MouseEvent("mouseup", {
            clientX: 150,
            clientY: 170,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/avatar_canvas_top_left_resize_mouse_up.png",
          __dirname + "/golden/avatar_canvas_top_left_resize_mouse_up.png",
          __dirname + "/avatar_canvas_top_left_resize_mouse_up_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.resizePointTopLeft.dispatchEvent(
          new MouseEvent("mousemove", {
            clientX: 100,
            clientY: 100,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/avatar_canvas_top_left_move_no_resize.png",
          __dirname + "/golden/avatar_canvas_top_left_resize_mouse_up.png",
          __dirname + "/avatar_canvas_top_left_move_no_resize_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.resizePointTopRight.dispatchEvent(
          new MouseEvent("mousedown", {
            clientX: 360,
            clientY: 100,
            bubbles: true,
          })
        );
        cut.resizePointTopRight.dispatchEvent(
          new MouseEvent("mouseup", {
            clientX: 360,
            clientY: 100,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/avatar_canvas_top_right_resize.png",
          __dirname + "/golden/avatar_canvas_top_right_resize.png",
          __dirname + "/avatar_canvas_top_right_resize_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.resizePointBottmRight.dispatchEvent(
          new MouseEvent("mousedown", {
            clientX: 300,
            clientY: 360,
            bubbles: true,
          })
        );
        cut.resizePointBottmRight.dispatchEvent(
          new MouseEvent("mouseup", {
            clientX: 300,
            clientY: 360,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/avatar_canvas_bottom_right_resize.png",
          __dirname + "/golden/avatar_canvas_bottom_right_resize.png",
          __dirname + "/avatar_canvas_bottom_right_resize_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.resizePointBottmLeft.dispatchEvent(
          new MouseEvent("mousedown", {
            clientX: 0,
            clientY: 360,
            bubbles: true,
          })
        );
        cut.resizePointBottmLeft.dispatchEvent(
          new MouseEvent("mouseup", {
            clientX: 0,
            clientY: 360,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/avatar_canvas_bottom_left_resize.png",
          __dirname + "/golden/avatar_canvas_bottom_left_resize.png",
          __dirname + "/avatar_canvas_bottom_left_resize_diff.png",
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DrawImage";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new AvatarCanvas();
        this.container = E.div({}, cut.body);
        document.body.style.width = "460px";
        document.body.style.height = "460px";
        document.body.appendChild(this.container);
        let fileInput = E.input({ type: "file" });
        await puppeteerWaitForFileChooser();
        fileInput.click();
        await puppeteerFileChooserAccept(wideImage);

        // Execute
        await cut.load(fileInput.files[0]);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/avatar_canvas_draw_wide_image.png",
          __dirname + "/golden/avatar_canvas_draw_wide_image.png",
          __dirname + "/avatar_canvas_draw_wide_image_diff.png",
          { fullPage: true }
        );

        // Prepare
        await puppeteerWaitForFileChooser();
        fileInput.click();
        await puppeteerFileChooserAccept(widerImage);

        // Execute
        await cut.load(fileInput.files[0]);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/avatar_canvas_draw_wider_image.png",
          __dirname + "/golden/avatar_canvas_draw_wider_image.png",
          __dirname + "/avatar_canvas_draw_wider_image_diff.png",
          { fullPage: true }
        );

        // Prepare
        await puppeteerWaitForFileChooser();
        fileInput.click();
        await puppeteerFileChooserAccept(highImage);

        // Execute
        await cut.load(fileInput.files[0]);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/avatar_canvas_draw_high_image.png",
          __dirname + "/golden/avatar_canvas_draw_high_image.png",
          __dirname + "/avatar_canvas_draw_high_image_diff.png",
          { fullPage: true }
        );

        // Prepare
        await puppeteerWaitForFileChooser();
        fileInput.click();
        await puppeteerFileChooserAccept(higherImage);

        // Execute
        await cut.load(fileInput.files[0]);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/avatar_canvas_draw_higher_image.png",
          __dirname + "/golden/avatar_canvas_draw_higher_image.png",
          __dirname + "/avatar_canvas_draw_higher_image_diff.png",
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Export";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new AvatarCanvas();
        this.container = E.div({}, cut.body);
        document.body.style.width = "460px";
        document.body.style.height = "460px";
        document.body.appendChild(this.container);
        let fileInput = E.input({ type: "file" });
        await puppeteerWaitForFileChooser();
        fileInput.click();
        await puppeteerFileChooserAccept(wideImage);
        await cut.load(fileInput.files[0]);

        cut.resizePointTopLeft.dispatchEvent(
          new MouseEvent("mousedown", {
            clientX: 50,
            clientY: 70,
            bubbles: true,
          })
        );

        // Execute
        let fileBlob = await cut.export();

        // Verify
        let fileData = await new Promise<string>((resolve) => {
          let reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsBinaryString(fileBlob);
        });
        await puppeteerWriteFile(
          __dirname + "/avatar_canvas_export_cropped.png",
          fileData
        );
        let goldenFileData = await puppeteerReadFile(
          __dirname + "/golden/avatar_canvas_export_cropped.png",
          "binary"
        );
        assertThat(fileData, eq(goldenFileData), "cropped file");

        // Cleanup
        await puppeteerDeleteFile(
          __dirname + "/avatar_canvas_export_cropped.png"
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
