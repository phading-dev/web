import tallImage = require("./test_data/tall.jpg");
import tallerImage = require("./test_data/taller.jpg");
import wideImage = require("./test_data/wide.jpeg");
import widerImage = require("./test_data/wider.jpg");
import path = require("path");
import { ImageCropper } from "./body";
import { E } from "@selfage/element/factory";
import {
  forceMouseUp,
  getFiles,
  mouseDown,
  mouseMove,
  mouseUp,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import {
  asyncAssertImage,
  asyncAssertScreenshot,
} from "@selfage/screenshot_test_matcher";
import "../normalize_body";

let PADDING = 100;
let LENGTH = 450;
let container: HTMLDivElement;

class ResizeOnceCase implements TestCase {
  private cut: ImageCropper;
  public constructor(
    public name: string,
    private startX: number,
    private startY: number,
    private endX: number,
    private endY: number,
    private actualFile: string,
    private expectedFile: string,
    private diffFile: string,
  ) {}

  public async execute() {
    // Prepare
    this.cut = new ImageCropper();
    container.appendChild(this.cut.body);

    // Execute
    await mouseMove(this.startX, this.startY, 1);
    await mouseDown();
    await mouseMove(this.endX, this.endY, 1);
    await mouseUp();

    // Verify
    await asyncAssertScreenshot(
      this.actualFile,
      this.expectedFile,
      this.diffFile,
      { fullPage: true },
    );
  }
  public async tearDown() {
    await forceMouseUp();
    await mouseMove(-1, -1, 1);
    this.cut.remove();
  }
}

TEST_RUNNER.run({
  name: "ImageCropperTest",
  environment: {
    setUp: () => {
      container = E.div({
        style: `width: ${LENGTH}px; height: ${LENGTH}px; padding: ${PADDING}px;`,
      });
      document.body.append(container);
    },
    tearDown: () => {
      container.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Default_ResizeFromAllPoints";
      private cut: ImageCropper;
      public async execute() {
        // Prepare
        this.cut = new ImageCropper();

        // Execute
        container.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_default.png"),
          path.join(__dirname, "/golden/image_cropper_default.png"),
          path.join(__dirname, "/image_cropper_default_diff.png"),
          { fullPage: true },
        );

        // Execute
        await mouseMove(PADDING + 115, PADDING + 115, 1);
        await mouseDown();
        await mouseMove(PADDING + 20, PADDING + 70, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_top_left_resize_mouse_down.png"),
          path.join(
            __dirname,
            "/golden/image_cropper_top_left_resize_mouse_down.png",
          ),
          path.join(
            __dirname,
            "/image_cropper_top_left_resize_mouse_down_diff.png",
          ),
          { fullPage: true },
        );

        // Execute
        await mouseMove(PADDING + 70, PADDING + 20, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_top_left_resize_mouse_move.png"),
          path.join(
            __dirname,
            "/golden/image_cropper_top_left_resize_mouse_down.png",
          ),
          path.join(
            __dirname,
            "/image_cropper_top_left_resize_mouse_move_diff.png",
          ),
          { fullPage: true },
        );

        // Execute
        await mouseMove(
          PADDING + LENGTH / 3 + 30,
          PADDING + LENGTH / 3 + 40,
          1,
        );
        await mouseUp();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_top_left_resize_mouse_up.png"),
          path.join(
            __dirname,
            "/golden/image_cropper_top_left_resize_mouse_up.png",
          ),
          path.join(
            __dirname,
            "/image_cropper_top_left_resize_mouse_up_diff.png",
          ),
          { fullPage: true },
        );

        // Execute
        await mouseMove(PADDING + LENGTH / 3, PADDING + LENGTH / 3, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_top_left_move_no_resize.png"),
          path.join(
            __dirname,
            "/golden/image_cropper_top_left_resize_mouse_up.png",
          ),
          path.join(
            __dirname,
            "/image_cropper_top_left_move_no_resize_diff.png",
          ),
          { fullPage: true },
        );

        // Execute
        await mouseMove(PADDING + LENGTH - 110, PADDING + 190, 1);
        await mouseDown();
        await mouseMove(PADDING + LENGTH - 20, PADDING + 100, 1);
        await mouseUp();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_top_right_resize.png"),
          path.join(__dirname, "/golden/image_cropper_top_right_resize.png"),
          path.join(__dirname, "/image_cropper_top_right_resize_diff.png"),
          { fullPage: true },
        );

        // Execute
        await mouseMove(PADDING + LENGTH - 25, PADDING + LENGTH - 110, 1);
        await mouseDown();
        await mouseMove(PADDING + LENGTH - 50, PADDING + LENGTH - 40, 1);
        await mouseUp();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_bottom_right_resize.png"),
          path.join(__dirname, "/golden/image_cropper_bottom_right_resize.png"),
          path.join(__dirname, "/image_cropper_bottom_right_resize_diff.png"),
          { fullPage: true },
        );

        // Execute
        await mouseMove(PADDING + 190, PADDING + LENGTH - 140, 1);
        await mouseDown();
        await mouseMove(PADDING + 100, PADDING + LENGTH - 40, 1);
        await mouseUp();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_bottom_left_resize.png"),
          path.join(__dirname, "/golden/image_cropper_bottom_left_resize.png"),
          path.join(__dirname, "/image_cropper_bottom_left_resize_diff.png"),
          { fullPage: true },
        );
      }
      public async tearDown() {
        await forceMouseUp();
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
    new ResizeOnceCase(
      "ResizeTopLeft_MoveTooUp",
      PADDING + 110,
      PADDING + 110,
      PADDING - 20,
      PADDING - 50,
      path.join(__dirname, "/image_cropper_top_left_point_move_too_up.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_top_left_point_move_too_up.png",
      ),
      path.join(
        __dirname,
        "/image_cropper_top_left_point_move_too_up_diff.png",
      ),
    ),
    new ResizeOnceCase(
      "ResizeTopLeft_MoveTooLeft",
      PADDING + 110,
      PADDING + 110,
      PADDING - 50,
      PADDING - 20,
      path.join(__dirname, "/image_cropper_top_left_point_move_too_left.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_top_left_point_move_too_left.png",
      ),
      path.join(
        __dirname,
        "/image_cropper_top_left_point_move_too_left_diff.png",
      ),
    ),
    new ResizeOnceCase(
      "ResizeTopLeft_MoveTooDown",
      PADDING + 110,
      PADDING + 110,
      PADDING + 20,
      PADDING + LENGTH - 50,
      path.join(__dirname, "/image_cropper_top_left_point_move_too_down.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_top_left_point_move_too_down.png",
      ),
      path.join(
        __dirname,
        "/image_cropper_top_left_point_move_too_down_diff.png",
      ),
    ),
    new ResizeOnceCase(
      "ResizeTopLeft_MoveTooRight",
      PADDING + 110,
      PADDING + 110,
      PADDING + LENGTH - 50,
      PADDING + 20,
      path.join(__dirname, "/image_cropper_top_left_point_move_too_right.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_top_left_point_move_too_right.png",
      ),
      path.join(
        __dirname,
        "/image_cropper_top_left_point_move_too_right_diff.png",
      ),
    ),
    new ResizeOnceCase(
      "ResizeTopRight_MoveTooUp",
      PADDING + LENGTH - 110,
      PADDING + 110,
      PADDING + LENGTH + 20,
      PADDING - 50,
      path.join(__dirname, "/image_cropper_top_right_point_move_too_up.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_top_right_point_move_too_up.png",
      ),
      path.join(
        __dirname,
        "/image_cropper_top_right_point_move_too_up_diff.png",
      ),
    ),
    new ResizeOnceCase(
      "ResizeTopRight_MoveTooRight",
      PADDING + LENGTH - 110,
      PADDING + 110,
      PADDING + LENGTH + 50,
      PADDING - 20,
      path.join(__dirname, "/image_cropper_top_right_point_move_too_right.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_top_right_point_move_too_right.png",
      ),
      path.join(
        __dirname,
        "/image_cropper_top_right_point_move_too_right_diff.png",
      ),
    ),
    new ResizeOnceCase(
      "ResizeTopRight_MoveTooDown",
      PADDING + LENGTH - 110,
      PADDING + 110,
      PADDING + LENGTH - 20,
      PADDING + LENGTH - 50,
      path.join(__dirname, "/image_cropper_top_right_point_move_too_down.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_top_right_point_move_too_down.png",
      ),
      path.join(
        __dirname,
        "/image_cropper_top_right_point_move_too_down_diff.png",
      ),
    ),
    new ResizeOnceCase(
      "ResizeTopRight_MoveTooLeft",
      PADDING + LENGTH - 110,
      PADDING + 110,
      PADDING + 50,
      PADDING + 20,
      path.join(__dirname, "/image_cropper_top_right_point_move_too_left.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_top_right_point_move_too_left.png",
      ),
      path.join(
        __dirname,
        "/image_cropper_top_right_point_move_too_left_diff.png",
      ),
    ),
    new ResizeOnceCase(
      "ResizeBottomRight_MoveTooDown",
      PADDING + LENGTH - 110,
      PADDING + LENGTH - 110,
      PADDING + LENGTH + 20,
      PADDING + LENGTH + 50,
      path.join(
        __dirname,
        "/image_cropper_bottom_right_point_move_too_down.png",
      ),
      path.join(
        __dirname,
        "/golden/image_cropper_bottom_right_point_move_too_down.png",
      ),
      path.join(
        __dirname,
        "/image_cropper_bottom_right_point_move_too_down_diff.png",
      ),
    ),
    new ResizeOnceCase(
      "ResizeBottomRight_MoveTooRight",
      PADDING + LENGTH - 110,
      PADDING + LENGTH - 110,
      PADDING + LENGTH + 50,
      PADDING + LENGTH + 20,
      path.join(
        __dirname,
        "/image_cropper_bottom_right_point_move_too_right.png",
      ),
      path.join(
        __dirname,
        "/golden/image_cropper_bottom_right_point_move_too_right.png",
      ),
      path.join(
        __dirname,
        "/image_cropper_bottom_right_point_move_too_right_diff.png",
      ),
    ),
    new ResizeOnceCase(
      "ResizeBottomRight_MoveTooUp",
      PADDING + LENGTH - 110,
      PADDING + LENGTH - 110,
      PADDING + LENGTH - 20,
      PADDING + 50,
      path.join(__dirname, "/image_cropper_bottom_right_point_move_too_up.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_bottom_right_point_move_too_up.png",
      ),
      path.join(
        __dirname,
        "/image_cropper_bottom_right_point_move_too_up_diff.png",
      ),
    ),
    new ResizeOnceCase(
      "ResizeBottomRight_MoveTooLeft",
      PADDING + LENGTH - 110,
      PADDING + LENGTH - 110,
      PADDING + 50,
      PADDING + LENGTH - 20,
      path.join(
        __dirname,
        "/image_cropper_bottom_right_point_move_too_left.png",
      ),
      path.join(
        __dirname,
        "/golden/image_cropper_bottom_right_point_move_too_left.png",
      ),
      path.join(
        __dirname,
        "/image_cropper_bottom_right_point_move_too_left_diff.png",
      ),
    ),
    new ResizeOnceCase(
      "ResizeBottomLeft_MoveTooDown",
      PADDING + 110,
      PADDING + LENGTH - 110,
      PADDING - 20,
      PADDING + LENGTH + 50,
      path.join(
        __dirname,
        "/image_cropper_bottom_left_point_move_too_down.png",
      ),
      path.join(
        __dirname,
        "/golden/image_cropper_bottom_left_point_move_too_down.png",
      ),
      path.join(
        __dirname,
        "/image_cropper_bottom_left_point_move_too_down_diff.png",
      ),
    ),
    new ResizeOnceCase(
      "ResizeBottomLeft_MoveTooLeft",
      PADDING + 110,
      PADDING + LENGTH - 110,
      PADDING - 50,
      PADDING + LENGTH + 20,
      path.join(
        __dirname,
        "/image_cropper_bottom_left_point_move_too_left.png",
      ),
      path.join(
        __dirname,
        "/golden/image_cropper_bottom_left_point_move_too_left.png",
      ),
      path.join(
        __dirname,
        "/image_cropper_bottom_left_point_move_too_left_diff.png",
      ),
    ),
    new ResizeOnceCase(
      "ResizeBottomLeft_MoveTooUp",
      PADDING + 110,
      PADDING + LENGTH - 110,
      PADDING + 20,
      PADDING + 50,
      path.join(__dirname, "/image_cropper_bottom_left_point_move_too_up.png"),
      path.join(
        __dirname,
        "/golden/image_cropper_bottom_left_point_move_too_up.png",
      ),
      path.join(
        __dirname,
        "/image_cropper_bottom_left_point_move_too_up_diff.png",
      ),
    ),
    new ResizeOnceCase(
      "ResizeBottomLeft_MoveTooRight",
      PADDING + 110,
      PADDING + LENGTH - 110,
      PADDING + LENGTH - 50,
      PADDING + LENGTH - 20,
      path.join(
        __dirname,
        "/image_cropper_bottom_left_point_move_too_right.png",
      ),
      path.join(
        __dirname,
        "/golden/image_cropper_bottom_left_point_move_too_right.png",
      ),
      path.join(
        __dirname,
        "/image_cropper_bottom_left_point_move_too_right_diff.png",
      ),
    ),
    new (class implements TestCase {
      public name = "ChooseMultipleImages";
      private cut: ImageCropper;
      public async execute() {
        // Prepare
        this.cut = new ImageCropper();
        container.append(this.cut.body);
        let files = await getFiles(wideImage);

        // Execute
        await this.cut.load(files[0]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_draw_wide_image.png"),
          path.join(__dirname, "/golden/image_cropper_draw_wide_image.png"),
          path.join(__dirname, "/image_cropper_draw_wide_image_diff.png"),
          { fullPage: true },
        );

        // Prepare
        files = await getFiles(widerImage);

        // Execute
        await this.cut.load(files[0]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_draw_wider_image.png"),
          path.join(__dirname, "/golden/image_cropper_draw_wider_image.png"),
          path.join(__dirname, "/image_cropper_draw_wider_image_diff.png"),
          { fullPage: true },
        );

        // Prepare
        files = await getFiles(tallImage);

        // Execute
        await this.cut.load(files[0]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_draw_tall_image.png"),
          path.join(__dirname, "/golden/image_cropper_draw_tall_image.png"),
          path.join(__dirname, "/image_cropper_draw_tall_image_diff.png"),
          { fullPage: true },
        );

        // Prepare
        files = await getFiles(tallerImage);

        // Execute
        await this.cut.load(files[0]);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/image_cropper_draw_taller_image.png"),
          path.join(__dirname, "/golden/image_cropper_draw_taller_image.png"),
          path.join(__dirname, "/image_cropper_draw_taller_image_diff.png"),
          { fullPage: true },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ChooseImage_Export";
      private cut: ImageCropper;
      public async execute() {
        // Prepare
        this.cut = new ImageCropper();
        container.append(this.cut.body);
        let files = await getFiles(wideImage);
        await this.cut.load(files[0]);

        await mouseMove(PADDING + 110, PADDING + 110, 1);
        await mouseDown();
        await mouseMove(PADDING + 20, PADDING + 40, 1);
        await mouseUp();

        // Execute
        let fileBlob = await this.cut.export();

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
          fileData,
        );
        await asyncAssertImage(
          path.join(__dirname, "/image_cropper_export_cropped.png"),
          path.join(__dirname, "/golden/image_cropper_export_cropped.png"),
          path.join(__dirname, "//image_cropper_export_cropped_diff.png"),
        );
      }
      public async tearDown() {
        await forceMouseUp();
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
  ],
});
