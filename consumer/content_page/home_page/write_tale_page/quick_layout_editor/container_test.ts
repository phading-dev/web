import tallImage = require("./test_data/tall.webp");
import wideImage = require("./test_data/wide.jpeg");
import { normalizeBody } from "../../../../common/normalize_body";
import { QuickLayoutEditor } from "./container";
import { UploadImageForTaleResponse } from "@phading/tale_service_interface/interface";
import { E } from "@selfage/element/factory";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/test_runner";
import { WebServiceClient } from "@selfage/web_service_client";

normalizeBody();

TEST_RUNNER.run({
  name: "QuickLayoutEditorTest",
  cases: [
    new (class implements TestCase {
      public name = "Render";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new QuickLayoutEditor(undefined);
        this.container = E.div(
          { style: `display: flex; flex-flow: column nowrap; width: 800px;` },
          ...cut.bodies
        );

        // Execute
        document.body.append(this.container);

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_layout_editor_render.png",
          __dirname + "/golden/quick_layout_editor_render.png",
          __dirname + "/quick_layout_editor_render_diff.png",
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UploadAndMoveImages";
      private container: HTMLDivElement;
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
            return { url: this.imageToReturn } as UploadImageForTaleResponse;
          }
        })();
        let cut = new QuickLayoutEditor(serviceClientMock);
        let valid = false;
        cut.on("valid", () => (valid = true));
        cut.on("invalid", () => (valid = false));
        this.container = E.div(
          { style: `display: flex; flex-flow: column nowrap; width: 800px;` },
          ...cut.bodies
        );
        document.body.append(this.container);
        serviceClientMock.errorToThrow = new Error("Some error");

        // Execute
        await puppeteerWaitForFileChooser();
        cut.uploadImageButton.click();
        puppeteerFileChooserAccept(wideImage);
        await new Promise<void>((resolve) => cut.once("imagesLoaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_layout_editor_upload_image_error.png",
          __dirname + "/golden/quick_layout_editor_upload_image_error.png",
          __dirname + "/quick_layout_editor_upload_image_error_diff.png",
          { fullPage: true }
        );

        // Prepare
        serviceClientMock.errorToThrow = undefined;
        serviceClientMock.imageToReturn = wideImage;

        // Execute
        await puppeteerWaitForFileChooser();
        cut.uploadImageButton.click();
        puppeteerFileChooserAccept(wideImage);
        await new Promise<void>((resolve) => cut.once("imagesLoaded", resolve));

        // Verify
        assertThat(valid, eq(true), "valid");
        assertThat(cut.valid, eq(true), "cut valid");
        await asyncAssertScreenshot(
          __dirname + "/quick_layout_editor_upload_first_image.png",
          __dirname + "/golden/quick_layout_editor_upload_first_image.png",
          __dirname + "/quick_layout_editor_upload_first_image_diff.png",
          { fullPage: true }
        );

        // Prepare
        serviceClientMock.imageToReturn = tallImage;

        // Execute
        await puppeteerWaitForFileChooser();
        cut.uploadImageButton.click();
        puppeteerFileChooserAccept(tallImage);
        await new Promise<void>((resolve) => cut.once("imagesLoaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_layout_editor_upload_second_image.png",
          __dirname + "/golden/quick_layout_editor_upload_second_image.png",
          __dirname + "/quick_layout_editor_upload_second_image_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.imageEditors[1].moveUp();

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_layout_editor_move_up_image.png",
          __dirname + "/golden/quick_layout_editor_move_up_image.png",
          __dirname + "/quick_layout_editor_move_up_image_diff.png",
          { fullPage: true }
        );

        // Prepare
        serviceClientMock.imageToReturn = wideImage;

        // Execute
        await puppeteerWaitForFileChooser();
        cut.uploadImageButton.click();
        puppeteerFileChooserAccept(wideImage);
        await new Promise<void>((resolve) => cut.once("imagesLoaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_layout_editor_upload_third_image.png",
          __dirname + "/golden/quick_layout_editor_upload_third_image.png",
          __dirname + "/quick_layout_editor_upload_third_image_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.imageEditors[0].moveDown();

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_layout_editor_move_down_first_image.png",
          __dirname + "/golden/quick_layout_editor_move_down_first_image.png",
          __dirname + "/quick_layout_editor_move_down_first_image_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.imageEditors[1].moveDown();

        // Verify
        await asyncAssertScreenshot(
          __dirname + "/quick_layout_editor_move_down_second_image.png",
          __dirname + "/golden/quick_layout_editor_move_down_second_image.png",
          __dirname + "/quick_layout_editor_move_down_second_image_diff.png",
          { fullPage: true }
        );

        // Execute
        await puppeteerWaitForFileChooser();
        cut.uploadImageButton.click();
        puppeteerFileChooserAccept(
          wideImage,
          wideImage,
          wideImage,
          wideImage,
          wideImage,
          wideImage
        );
        await new Promise<void>((resolve) => cut.once("imagesLoaded", resolve));

        // Verify
        assertThat(valid, eq(true), "valid 9");
        assertThat(cut.valid, eq(true), "cut valid 9");
        await asyncAssertScreenshot(
          __dirname + "/quick_layout_editor_upload_9_images.png",
          __dirname + "/golden/quick_layout_editor_upload_9_images.png",
          __dirname + "/quick_layout_editor_upload_9_images_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.imageEditors[2].delete();

        // Verify
        assertThat(valid, eq(true), "valid 8");
        assertThat(cut.valid, eq(true), "cut valid 8");
        await asyncAssertScreenshot(
          __dirname + "/quick_layout_editor_delete_image.png",
          __dirname + "/golden/quick_layout_editor_delete_image.png",
          __dirname + "/quick_layout_editor_delete_image_diff.png",
          { fullPage: true }
        );

        // Execute
        cut.imageEditors
          .map((imageEditor) => imageEditor) // Make a copy
          .forEach((imageEditor) => imageEditor.delete());

        // Verify
        assertThat(valid, eq(false), "invalid");
        assertThat(cut.valid, eq(false), "cut invalid");
        await asyncAssertScreenshot(
          __dirname + "/quick_layout_editor_delete_all_images.png",
          __dirname + "/golden/quick_layout_editor_render.png",
          __dirname + "/quick_layout_editor_delete_all_images_diff.png",
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "CountCharacter";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new QuickLayoutEditor(undefined);
        let valid = false;
        cut.on("valid", () => (valid = true));
        cut.on("invalid", () => (valid = false));
        this.container = E.div(
          { style: `display: flex; flex-flow: column nowrap; width: 800px;` },
          ...cut.bodies
        );
        document.body.append(this.container);

        // Execute
        cut.textInput.value = "some something";
        cut.textInput.dispatchEvent(new KeyboardEvent("input"));

        // Verify
        assertThat(valid, eq(true), "valid");
        assertThat(cut.valid, eq(true), "cut valid");
        await asyncAssertScreenshot(
          __dirname + "/quick_layout_editor_count_character.png",
          __dirname + "/golden/quick_layout_editor_count_character.png",
          __dirname + "/quick_layout_editor_count_character_diff.png",
          { fullPage: true }
        );

        // Execute
        let characters = new Array<string>();
        for (let i = 0; i < 701; i++) {
          characters.push("c");
        }
        cut.textInput.value = characters.join("");
        cut.textInput.dispatchEvent(new KeyboardEvent("input"));

        // Verify
        assertThat(valid, eq(false), "invalid");
        assertThat(cut.valid, eq(false), "cut invalid");
        await asyncAssertScreenshot(
          __dirname + "/quick_layout_editor_count_overflowed_character.png",
          __dirname +
            "/golden/quick_layout_editor_count_overflowed_character.png",
          __dirname +
            "/quick_layout_editor_count_overflowed_character_diff.png",
          { fullPage: true }
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ValidAfterCleanText";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new QuickLayoutEditor(
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
        cut.on("valid", () => (valid = true));
        cut.on("invalid", () => (valid = false));
        this.container = E.div({}, ...cut.bodies);
        document.body.append(this.container);
        cut.textInput.value = "some something";
        cut.textInput.dispatchEvent(new KeyboardEvent("input"));
        await puppeteerWaitForFileChooser();
        cut.uploadImageButton.click();
        puppeteerFileChooserAccept(wideImage);
        await new Promise<void>((resolve) => cut.once("imagesLoaded", resolve));
        assertThat(valid, eq(true), "precheck valid");
        assertThat(cut.valid, eq(true), "cut precheck valid");

        // Execute
        cut.textInput.value = "";
        cut.textInput.dispatchEvent(new KeyboardEvent("input"));

        // Verify
        assertThat(valid, eq(true), "valid");
        assertThat(cut.valid, eq(true), "cut valid");

        // Execute
        cut.imageEditors[0].delete();

        // Verify
        assertThat(valid, eq(false), "invalid");
        assertThat(cut.valid, eq(false), "cut invalid");
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ValidAfterDeleteImages";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new QuickLayoutEditor(
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
        cut.on("valid", () => (valid = true));
        cut.on("invalid", () => (valid = false));
        this.container = E.div({}, ...cut.bodies);
        document.body.append(this.container);
        cut.textInput.value = "some something";
        cut.textInput.dispatchEvent(new KeyboardEvent("input"));
        await puppeteerWaitForFileChooser();
        cut.uploadImageButton.click();
        puppeteerFileChooserAccept(wideImage);
        await new Promise<void>((resolve) => cut.once("imagesLoaded", resolve));
        assertThat(valid, eq(true), "precheck valid");
        assertThat(cut.valid, eq(true), "cut precheck valid");

        // Execute
        cut.imageEditors[0].delete();

        // Verify
        assertThat(valid, eq(true), "valid");
        assertThat(cut.valid, eq(true), "cut valid");

        // Execute
        cut.textInput.value = "";
        cut.textInput.dispatchEvent(new KeyboardEvent("input"));

        // Verify
        assertThat(valid, eq(false), "invalid");
        assertThat(cut.valid, eq(false), "cut invalid");
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Clear";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut = new QuickLayoutEditor(
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              return { url: wideImage } as UploadImageForTaleResponse;
            }
          })()
        );
        this.container = E.div({}, ...cut.bodies);
        document.body.append(this.container);
        cut.textInput.value = "some something";
        cut.textInput.dispatchEvent(new KeyboardEvent("input"));
        await puppeteerWaitForFileChooser();
        cut.uploadImageButton.click();
        puppeteerFileChooserAccept(wideImage);
        await new Promise<void>((resolve) => cut.once("imagesLoaded", resolve));
        assertThat(cut.valid, eq(true), "cut precheck valid");

        // Execute
        cut.clear();

        // Verify
        assertThat(cut.textInput.value, eq(""), "text");
        assertThat(cut.imageEditors.length, eq(0), "images");
        assertThat(cut.valid, eq(false), "cut invalid");
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
