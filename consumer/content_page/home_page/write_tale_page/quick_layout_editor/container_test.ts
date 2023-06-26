import tallImage = require("./test_data/tall.webp");
import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { QuickLayoutEditor } from "./container";
import { UploadImageForTaleResponse } from "@phading/tale_service_interface/interface";
import { E } from "@selfage/element/factory";
import { supplyFiles } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../../common/normalize_body";

let container: HTMLDivElement;

TEST_RUNNER.run({
  name: "QuickLayoutEditorTest",
  environment: {
    setUp: () => {
      container = E.div({
        style: `display: flex; flex-flow: column nowrap; width: 800px;`,
      });
      document.body.append(container);
    },
    tearDown: () => {
      container.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Render";
      private cut: QuickLayoutEditor;
      public async execute() {
        // Prepare
        this.cut = new QuickLayoutEditor(undefined);

        // Execute
        container.append(...this.cut.bodies);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_layout_editor_render.png"),
          path.join(__dirname, "/golden/quick_layout_editor_render.png"),
          path.join(__dirname, "/quick_layout_editor_render_diff.png"),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UploadAndMoveImages";
      private cut: QuickLayoutEditor;
      public async execute() {
        // Prepare
        let serviceClientMock = new (class extends WebServiceClient {
          public imageToReturn: string;
          public errorToThrow: Error;
          public constructor() {
            super(undefined, undefined);
          }
          public async send(request: any): Promise<any> {
            if (this.errorToThrow) {
              throw this.errorToThrow;
            }
            return {
              imagePath: this.imageToReturn,
            } as UploadImageForTaleResponse;
          }
        })();
        this.cut = new QuickLayoutEditor(serviceClientMock);
        let valid = false;
        this.cut.on("valid", () => (valid = true));
        this.cut.on("invalid", () => (valid = false));
        container.append(...this.cut.bodies);
        serviceClientMock.errorToThrow = new Error("Some error");

        // Execute
        supplyFiles(() => this.cut.uploadImageButton.click(), wideImage);
        await new Promise<void>((resolve) =>
          this.cut.once("imagesLoaded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_layout_editor_upload_image_error.png"),
          path.join(
            __dirname,
            "/golden/quick_layout_editor_upload_image_error.png"
          ),
          path.join(
            __dirname,
            "/quick_layout_editor_upload_image_error_diff.png"
          ),
          { fullPage: true }
        );

        // Prepare
        serviceClientMock.errorToThrow = undefined;
        serviceClientMock.imageToReturn = wideImage;

        // Execute
        supplyFiles(() => this.cut.uploadImageButton.click(), wideImage);
        await new Promise<void>((resolve) =>
          this.cut.once("imagesLoaded", resolve)
        );

        // Verify
        assertThat(valid, eq(true), "valid");
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_layout_editor_upload_first_image.png"),
          path.join(
            __dirname,
            "/golden/quick_layout_editor_upload_first_image.png"
          ),
          path.join(
            __dirname,
            "/quick_layout_editor_upload_first_image_diff.png"
          ),
          { fullPage: true }
        );

        // Prepare
        serviceClientMock.imageToReturn = tallImage;

        // Execute
        supplyFiles(() => this.cut.uploadImageButton.click(), tallImage);
        await new Promise<void>((resolve) =>
          this.cut.once("imagesLoaded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_layout_editor_upload_second_image.png"),
          path.join(
            __dirname,
            "/golden/quick_layout_editor_upload_second_image.png"
          ),
          path.join(
            __dirname,
            "/quick_layout_editor_upload_second_image_diff.png"
          ),
          { fullPage: true }
        );

        // Execute
        this.cut.imagePreviewers[1].moveUp();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_layout_editor_move_up_image.png"),
          path.join(__dirname, "/golden/quick_layout_editor_move_up_image.png"),
          path.join(__dirname, "/quick_layout_editor_move_up_image_diff.png"),
          { fullPage: true }
        );

        // Prepare
        serviceClientMock.imageToReturn = wideImage;

        // Execute
        supplyFiles(() => this.cut.uploadImageButton.click(), wideImage);
        await new Promise<void>((resolve) =>
          this.cut.once("imagesLoaded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_layout_editor_upload_third_image.png"),
          path.join(
            __dirname,
            "/golden/quick_layout_editor_upload_third_image.png"
          ),
          path.join(
            __dirname,
            "/quick_layout_editor_upload_third_image_diff.png"
          ),
          { fullPage: true }
        );

        // Execute
        this.cut.imagePreviewers[0].moveDown();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/quick_layout_editor_move_down_first_image.png"
          ),
          path.join(
            __dirname,
            "/golden/quick_layout_editor_move_down_first_image.png"
          ),
          path.join(
            __dirname,
            "/quick_layout_editor_move_down_first_image_diff.png"
          ),
          { fullPage: true }
        );

        // Execute
        this.cut.imagePreviewers[1].moveDown();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/quick_layout_editor_move_down_second_image.png"
          ),
          path.join(
            __dirname,
            "/golden/quick_layout_editor_move_down_second_image.png"
          ),
          path.join(
            __dirname,
            "/quick_layout_editor_move_down_second_image_diff.png"
          ),
          { fullPage: true }
        );

        // Execute
        supplyFiles(
          () => this.cut.uploadImageButton.click(),
          wideImage,
          wideImage,
          wideImage,
          wideImage,
          wideImage,
          wideImage
        );
        await new Promise<void>((resolve) =>
          this.cut.once("imagesLoaded", resolve)
        );

        // Verify
        assertThat(valid, eq(true), "valid 9");
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_layout_editor_upload_9_images.png"),
          path.join(
            __dirname,
            "/golden/quick_layout_editor_upload_9_images.png"
          ),
          path.join(__dirname, "/quick_layout_editor_upload_9_images_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.imagePreviewers[2].delete();

        // Verify
        assertThat(valid, eq(true), "valid 8");
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_layout_editor_delete_image.png"),
          path.join(__dirname, "/golden/quick_layout_editor_delete_image.png"),
          path.join(__dirname, "/quick_layout_editor_delete_image_diff.png"),
          { fullPage: true }
        );

        // Execute
        this.cut.imagePreviewers
          .map((imagePreviewer) => imagePreviewer) // Make a copy
          .forEach((imagePreviewer) => imagePreviewer.delete());

        // Verify
        assertThat(valid, eq(false), "invalid");
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_layout_editor_delete_all_images.png"),
          path.join(__dirname, "/golden/quick_layout_editor_render.png"),
          path.join(
            __dirname,
            "/quick_layout_editor_delete_all_images_diff.png"
          ),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "CountCharacter";
      private cut: QuickLayoutEditor;
      public async execute() {
        // Prepare
        this.cut = new QuickLayoutEditor(undefined);
        let valid = false;
        this.cut.on("valid", () => (valid = true));
        this.cut.on("invalid", () => (valid = false));
        container.append(...this.cut.bodies);

        // Execute
        this.cut.textInput.value = "some something";
        this.cut.textInput.dispatchEvent(new KeyboardEvent("input"));

        // Verify
        assertThat(valid, eq(true), "valid");
        await asyncAssertScreenshot(
          path.join(__dirname, "/quick_layout_editor_count_character.png"),
          path.join(
            __dirname,
            "/golden/quick_layout_editor_count_character.png"
          ),
          path.join(__dirname, "/quick_layout_editor_count_character_diff.png"),
          { fullPage: true }
        );

        // Execute
        let characters = new Array<string>();
        for (let i = 0; i < 701; i++) {
          characters.push("c");
        }
        this.cut.textInput.value = characters.join("");
        this.cut.textInput.dispatchEvent(new KeyboardEvent("input"));

        // Verify
        assertThat(valid, eq(false), "invalid");
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/quick_layout_editor_count_overflowed_character.png"
          ),
          path.join(
            __dirname,
            "/golden/quick_layout_editor_count_overflowed_character.png"
          ),
          path.join(
            __dirname,
            "/quick_layout_editor_count_overflowed_character_diff.png"
          ),
          { fullPage: true }
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ValidAfterCleanText";
      private cut: QuickLayoutEditor;
      public async execute() {
        // Prepare
        this.cut = new QuickLayoutEditor(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              return { url: wideImage } as UploadImageForTaleResponse;
            }
          })()
        );
        let valid = false;
        this.cut.on("valid", () => (valid = true));
        this.cut.on("invalid", () => (valid = false));
        container.append(...this.cut.bodies);
        this.cut.textInput.value = "some something";
        this.cut.textInput.dispatchEvent(new KeyboardEvent("input"));
        supplyFiles(() => this.cut.uploadImageButton.click(), wideImage);
        await new Promise<void>((resolve) =>
          this.cut.once("imagesLoaded", resolve)
        );
        assertThat(valid, eq(true), "precheck valid");

        // Execute
        this.cut.textInput.value = "";
        this.cut.textInput.dispatchEvent(new KeyboardEvent("input"));

        // Verify
        assertThat(valid, eq(true), "valid");

        // Execute
        this.cut.imagePreviewers[0].delete();

        // Verify
        assertThat(valid, eq(false), "invalid");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ValidAfterDeleteImages";
      private cut: QuickLayoutEditor;
      public async execute() {
        // Prepare
        this.cut = new QuickLayoutEditor(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              return { url: wideImage } as UploadImageForTaleResponse;
            }
          })()
        );
        let valid = false;
        this.cut.on("valid", () => (valid = true));
        this.cut.on("invalid", () => (valid = false));
        container.append(...this.cut.bodies);
        this.cut.textInput.value = "some something";
        this.cut.textInput.dispatchEvent(new KeyboardEvent("input"));
        supplyFiles(() => this.cut.uploadImageButton.click(), wideImage);
        await new Promise<void>((resolve) =>
          this.cut.once("imagesLoaded", resolve)
        );
        assertThat(valid, eq(true), "precheck valid");

        // Execute
        this.cut.imagePreviewers[0].delete();

        // Verify
        assertThat(valid, eq(true), "valid");

        // Execute
        this.cut.textInput.value = "";
        this.cut.textInput.dispatchEvent(new KeyboardEvent("input"));

        // Verify
        assertThat(valid, eq(false), "invalid");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
