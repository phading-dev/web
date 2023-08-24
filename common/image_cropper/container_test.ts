import tallImage = require("./test_data/tall.jpg");
import tallerImage = require("./test_data/taller.jpg");
import wideImage = require("./test_data/wide.jpeg");
import widerImage = require("./test_data/wider.jpg");
import path = require("path");
import { ImageCropper } from "./container";
import { E } from "@selfage/element/factory";
import { getFiles } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import {
  asyncAssertImage,
  asyncAssertScreenshot,
} from "@selfage/screenshot_test_matcher";
import "../../common/normalize_body";

let PADDING = 100;
let LENGTH = 450;

class ResizeOnceCase implements TestCase {
  private container: HTMLDivElement;
  public constructor(
    public name: string,
    private getResizePoint: (cut: ImageCropper) => HTMLDivElement,
    private clientX: number,
    private clientY: number,
    private actualFile: string,
    private expectedFile: string,
    private diffFile: string
  ) {}

  public async execute() {
    let cut = new ImageCropper();
    this.container = E.div(
      {
        style: `width: ${LENGTH}px; height: ${LENGTH}px; padding: ${PADDING}px;`,
      },
      cut.body
    );
    document.body.appendChild(this.container);

    // Execute
    this.getResizePoint(cut).dispatchEvent(
      new MouseEvent("mousedown", {
        clientX: this.clientX,
        clientY: this.clientY,
        bubbles: true,
      })
    );

    // Verify
    await asyncAssertScreenshot(
      this.actualFile,
      this.expectedFile,
      this.diffFile,
      { fullPage: true }
    );
  }
  public tearDown() {
    this.container.remove();
  }
}

TEST_RUNNER.run({
  name: "ImageCropperTest",
  cases: [
    new (class implements TestCase {
      public name = "RenderThenResizeFromAllPoints";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new ImageCropper();
        this.container = E.div(
          {
            style: `width: ${LENGTH}px; height: ${LENGTH}px; padding: ${PADDING}px;`,
          },
          cut.body
        );

        // Execute
        document.body.appendChild(this.container);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_render.png"),
          path.join(__dirname, "/golden/image_cropper_render.png"),
          path.join(__dirname, "/image_cropper_render_diff.png"),
          { fullPage: true }
        );

        // Execute
        cut.resizePointTopLeft.dispatchEvent(
          new MouseEvent("mousedown", {
            clientX: PADDING + 20,
            clientY: PADDING + 70,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_top_left_resize_mouse_down.png"),
          path.join(
            __dirname,
            "/golden/image_cropper_top_left_resize_mouse_down.png"
          ),
          path.join(
            __dirname,
            "/image_cropper_top_left_resize_mouse_down_diff.png"
          ),
          { fullPage: true }
        );

        // Execute
        cut.resizePointTopLeft.dispatchEvent(
          new MouseEvent("mousemove", {
            clientX: PADDING + 70,
            clientY: PADDING + 20,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_top_left_resize_mouse_move.png"),
          path.join(
            __dirname,
            "/golden/image_cropper_top_left_resize_mouse_down.png"
          ),
          path.join(
            __dirname,
            "/image_cropper_top_left_resize_mouse_move_diff.png"
          ),
          { fullPage: true }
        );

        // Execute
        cut.resizePointTopLeft.dispatchEvent(
          new MouseEvent("mouseup", {
            clientX: PADDING + LENGTH / 3 + 30,
            clientY: PADDING + LENGTH / 3 + 40,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_top_left_resize_mouse_up.png"),
          path.join(
            __dirname,
            "/golden/image_cropper_top_left_resize_mouse_up.png"
          ),
          path.join(
            __dirname,
            "/image_cropper_top_left_resize_mouse_up_diff.png"
          ),
          { fullPage: true }
        );

        // Execute
        cut.resizePointTopLeft.dispatchEvent(
          new MouseEvent("mousemove", {
            clientX: PADDING + LENGTH / 3,
            clientY: PADDING + LENGTH / 3,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_top_left_move_no_resize.png"),
          path.join(
            __dirname,
            "/golden/image_cropper_top_left_resize_mouse_up.png"
          ),
          path.join(
            __dirname,
            "/image_cropper_top_left_move_no_resize_diff.png"
          ),
          { fullPage: true }
        );

        // Execute
        cut.resizePointTopRight.dispatchEvent(
          new MouseEvent("mousedown", {
            clientX: PADDING + LENGTH - 20,
            clientY: PADDING + 100,
            bubbles: true,
          })
        );
        cut.resizePointTopRight.dispatchEvent(
          new MouseEvent("mouseup", {
            clientX: PADDING + LENGTH - 20,
            clientY: PADDING + 100,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_top_right_resize.png"),
          path.join(__dirname, "/golden/image_cropper_top_right_resize.png"),
          path.join(__dirname, "/image_cropper_top_right_resize_diff.png"),
          { fullPage: true }
        );

        // Execute
        cut.resizePointBottmRight.dispatchEvent(
          new MouseEvent("mousedown", {
            clientX: PADDING + LENGTH - 50,
            clientY: PADDING + LENGTH - 40,
            bubbles: true,
          })
        );
        cut.resizePointBottmRight.dispatchEvent(
          new MouseEvent("mouseup", {
            clientX: PADDING + LENGTH - 50,
            clientY: PADDING + LENGTH - 40,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_bottom_right_resize.png"),
          path.join(__dirname, "/golden/image_cropper_bottom_right_resize.png"),
          path.join(__dirname, "/image_cropper_bottom_right_resize_diff.png"),
          { fullPage: true }
        );

        // Execute
        cut.resizePointBottmLeft.dispatchEvent(
          new MouseEvent("mousedown", {
            clientX: PADDING + 100,
            clientY: PADDING + LENGTH - 40,
            bubbles: true,
          })
        );
        cut.resizePointBottmLeft.dispatchEvent(
          new MouseEvent("mouseup", {
            clientX: PADDING + 100,
            clientY: PADDING + LENGTH - 40,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_bottom_left_resize.png"),
          path.join(__dirname, "/golden/image_cropper_bottom_left_resize.png"),
          path.join(__dirname, "/image_cropper_bottom_left_resize_diff.png"),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new ResizeOnceCase(
      "ResizeTopLeft_MoveTooUp",
      (cut) => cut.resizePointTopLeft,
      PADDING - 20,
      PADDING - 50,
      path.join(__dirname, "/image_cropper_top_left_point_move_too_up.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_top_left_point_move_too_up.png"
      ),
      path.join(__dirname, "/image_cropper_top_left_point_move_too_up_diff.png")
    ),
    new ResizeOnceCase(
      "ResizeTopLeft_MoveTooLeft",
      (cut) => cut.resizePointTopLeft,
      PADDING - 50,
      PADDING - 20,
      path.join(__dirname, "/image_cropper_top_left_point_move_too_left.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_top_left_point_move_too_left.png"
      ),
      path.join(
        __dirname,
        "/image_cropper_top_left_point_move_too_left_diff.png"
      )
    ),
    new ResizeOnceCase(
      "ResizeTopLeft_MoveTooDown",
      (cut) => cut.resizePointTopLeft,
      PADDING + 20,
      PADDING + LENGTH - 50,
      path.join(__dirname, "/image_cropper_top_left_point_move_too_down.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_top_left_point_move_too_down.png"
      ),
      path.join(
        __dirname,
        "/image_cropper_top_left_point_move_too_down_diff.png"
      )
    ),
    new ResizeOnceCase(
      "ResizeTopLeft_MoveTooRight",
      (cut) => cut.resizePointTopLeft,
      PADDING + LENGTH - 50,
      PADDING + 20,
      path.join(__dirname, "/image_cropper_top_left_point_move_too_right.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_top_left_point_move_too_right.png"
      ),
      path.join(
        __dirname,
        "/image_cropper_top_left_point_move_too_right_diff.png"
      )
    ),
    new ResizeOnceCase(
      "ResizeTopRight_MoveTooUp",
      (cut) => cut.resizePointTopRight,
      PADDING + LENGTH + 20,
      PADDING - 50,
      path.join(__dirname, "/image_cropper_top_right_point_move_too_up.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_top_right_point_move_too_up.png"
      ),
      path.join(
        __dirname,
        "/image_cropper_top_right_point_move_too_up_diff.png"
      )
    ),
    new ResizeOnceCase(
      "ResizeTopRight_MoveTooRight",
      (cut) => cut.resizePointTopRight,
      PADDING + LENGTH + 50,
      PADDING - 20,
      path.join(__dirname, "/image_cropper_top_right_point_move_too_right.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_top_right_point_move_too_right.png"
      ),
      path.join(
        __dirname,
        "/image_cropper_top_right_point_move_too_right_diff.png"
      )
    ),
    new ResizeOnceCase(
      "ResizeTopRight_MoveTooDown",
      (cut) => cut.resizePointTopRight,
      PADDING + LENGTH - 20,
      PADDING + LENGTH - 50,
      path.join(__dirname, "/image_cropper_top_right_point_move_too_down.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_top_right_point_move_too_down.png"
      ),
      path.join(
        __dirname,
        "/image_cropper_top_right_point_move_too_down_diff.png"
      )
    ),
    new ResizeOnceCase(
      "ResizeTopRight_MoveTooLeft",
      (cut) => cut.resizePointTopRight,
      PADDING + 50,
      PADDING + 20,
      path.join(__dirname, "/image_cropper_top_right_point_move_too_left.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_top_right_point_move_too_left.png"
      ),
      path.join(
        __dirname,
        "/image_cropper_top_right_point_move_too_left_diff.png"
      )
    ),
    new ResizeOnceCase(
      "ResizeBottomRight_MoveTooDown",
      (cut) => cut.resizePointBottmRight,
      PADDING + LENGTH + 20,
      PADDING + LENGTH + 50,
      path.join(
        __dirname,
        "/image_cropper_bottom_right_point_move_too_down.png"
      ),
      path.join(
        __dirname,
        "/golden/image_cropper_bottom_right_point_move_too_down.png"
      ),
      path.join(
        __dirname,
        "/image_cropper_bottom_right_point_move_too_down_diff.png"
      )
    ),
    new ResizeOnceCase(
      "ResizeBottomRight_MoveTooRight",
      (cut) => cut.resizePointBottmRight,
      PADDING + LENGTH + 50,
      PADDING + LENGTH + 20,
      path.join(
        __dirname,
        "/image_cropper_bottom_right_point_move_too_right.png"
      ),
      path.join(
        __dirname,
        "/golden/image_cropper_bottom_right_point_move_too_right.png"
      ),
      path.join(
        __dirname,
        "/image_cropper_bottom_right_point_move_too_right_diff.png"
      )
    ),
    new ResizeOnceCase(
      "ResizeBottomRight_MoveTooUp",
      (cut) => cut.resizePointBottmRight,
      PADDING + LENGTH - 20,
      PADDING + 50,
      path.join(__dirname, "/image_cropper_bottom_right_point_move_too_up.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_bottom_right_point_move_too_up.png"
      ),
      path.join(
        __dirname,
        "/image_cropper_bottom_right_point_move_too_up_diff.png"
      )
    ),
    new ResizeOnceCase(
      "ResizeBottomRight_MoveTooLeft",
      (cut) => cut.resizePointBottmRight,
      PADDING + 50,
      PADDING + LENGTH - 20,
      path.join(
        __dirname,
        "/image_cropper_bottom_right_point_move_too_left.png"
      ),
      path.join(
        __dirname,
        "/golden/image_cropper_bottom_right_point_move_too_left.png"
      ),
      path.join(
        __dirname,
        "/image_cropper_bottom_right_point_move_too_left_diff.png"
      )
    ),
    new ResizeOnceCase(
      "ResizeBottomLeft_MoveTooDown",
      (cut) => cut.resizePointBottmLeft,
      PADDING - 20,
      PADDING + LENGTH + 50,
      path.join(
        __dirname,
        "/image_cropper_bottom_left_point_move_too_down.png"
      ),
      path.join(
        __dirname,
        "/golden/image_cropper_bottom_left_point_move_too_down.png"
      ),
      path.join(
        __dirname,
        "/image_cropper_bottom_left_point_move_too_down_diff.png"
      )
    ),
    new ResizeOnceCase(
      "ResizeBottomLeft_MoveTooLeft",
      (cut) => cut.resizePointBottmLeft,
      PADDING - 50,
      PADDING + LENGTH + 20,
      path.join(
        __dirname,
        "/image_cropper_bottom_left_point_move_too_left.png"
      ),
      path.join(
        __dirname,
        "/golden/image_cropper_bottom_left_point_move_too_left.png"
      ),
      path.join(
        __dirname,
        "/image_cropper_bottom_left_point_move_too_left_diff.png"
      )
    ),
    new ResizeOnceCase(
      "ResizeBottomLeft_MoveTooUp",
      (cut) => cut.resizePointBottmLeft,
      PADDING + 20,
      PADDING + 50,
      path.join(__dirname, "/image_cropper_bottom_left_point_move_too_up.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_bottom_left_point_move_too_up.png"
      ),
      path.join(
        __dirname,
        "/image_cropper_bottom_left_point_move_too_up_diff.png"
      )
    ),
    new ResizeOnceCase(
      "ResizeBottomLeft_MoveTooRight",
      (cut) => cut.resizePointBottmLeft,
      PADDING + LENGTH - 50,
      PADDING + LENGTH - 20,
      path.join(
        __dirname,
        "/image_cropper_bottom_left_point_move_too_right.png"
      ),
      path.join(
        __dirname,
        "/golden/image_cropper_bottom_left_point_move_too_right.png"
      ),
      path.join(
        __dirname,
        "/image_cropper_bottom_left_point_move_too_right_diff.png"
      )
    ),
    new (class implements TestCase {
      public name = "ChooseMultipleImages_Render";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new ImageCropper();
        this.container = E.div(
          {
            style: `width: ${LENGTH}px; height: ${LENGTH}px; padding: ${PADDING}px;`,
          },
          cut.body
        );
        document.body.appendChild(this.container);
        let files = await getFiles(wideImage);

        // Execute
        await cut.load(files[0]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_draw_wide_image.png"),
          path.join(__dirname, "/golden/image_cropper_draw_wide_image.png"),
          path.join(__dirname, "/image_cropper_draw_wide_image_diff.png"),
          { fullPage: true }
        );

        // Prepare
        files = await getFiles(widerImage);

        // Execute
        await cut.load(files[0]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_draw_wider_image.png"),
          path.join(__dirname, "/golden/image_cropper_draw_wider_image.png"),
          path.join(__dirname, "/image_cropper_draw_wider_image_diff.png"),
          { fullPage: true }
        );

        // Prepare
        files = await getFiles(tallImage);

        // Execute
        await cut.load(files[0]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_draw_tall_image.png"),
          path.join(__dirname, "/golden/image_cropper_draw_tall_image.png"),
          path.join(__dirname, "/image_cropper_draw_tall_image_diff.png"),
          { fullPage: true }
        );

        // Prepare
        files = await getFiles(tallerImage);

        // Execute
        await cut.load(files[0]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_draw_taller_image.png"),
          path.join(__dirname, "/golden/image_cropper_draw_taller_image.png"),
          path.join(__dirname, "/image_cropper_draw_taller_image_diff.png"),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ChooseImage_Export";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new ImageCropper();
        this.container = E.div(
          {
            style: `width: ${LENGTH}px; height: ${LENGTH}px; padding: ${PADDING}px;`,
          },
          cut.body
        );
        document.body.appendChild(this.container);
        let files = await getFiles(wideImage);
        await cut.load(files[0]);

        cut.resizePointTopLeft.dispatchEvent(
          new MouseEvent("mousedown", {
            clientX: PADDING + 20,
            clientY: PADDING + 40,
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
          path.join(__dirname, "/image_cropper_export_cropped.png"),
          fileData
        );
        await asyncAssertImage(
          path.join(__dirname, "/image_cropper_export_cropped.png"),
          path.join(__dirname, "/golden/image_cropper_export_cropped.png"),
          path.join(__dirname, "//image_cropper_export_cropped_diff.png")
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
