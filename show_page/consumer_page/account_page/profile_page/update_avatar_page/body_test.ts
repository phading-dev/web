import nonImageFile = require("./test_data/non_image.bin");
import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { UpdateAvatarPage } from "./body";
import { UploadAccountAvatarResponse } from "@phading/user_service_interface/self/web/interface";
import { E } from "@selfage/element/factory";
import {
  setViewport,
  supplyFiles,
  writeFile,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import {
  asyncAssertImage,
  asyncAssertScreenshot,
} from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../../../common/normalize_body";

let menuContainer: HTMLDivElement;

TEST_RUNNER.run({
  name: "UpdateAvatarPageTest",
  environment: {
    setUp: () => {
      menuContainer = E.div({
        style: `position: fixed; left: 0; top: 0;`,
      });
      document.body.appendChild(menuContainer);
    },
    tearDown: () => {
      menuContainer.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Default_Load_Resize";
      private cut: UpdateAvatarPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 800);

        // Execute
        this.cut = new UpdateAvatarPage(undefined);
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_default.png"),
          path.join(__dirname, "/golden/update_avatar_page_default.png"),
          path.join(__dirname, "/update_avatar_page_default_diff.png")
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_scroll_to_bottom.png"),
          path.join(
            __dirname,
            "/golden/update_avatar_page_scroll_to_bottom.png"
          ),
          path.join(__dirname, "/update_avatar_page_scroll_to_bottom_diff.png")
        );

        // Execute
        supplyFiles(() => this.cut.chooseFileButton.click(), wideImage);
        await new Promise<void>((resolve) =>
          this.cut.once("imageLoaded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_loaded.png"),
          path.join(__dirname, "/golden/update_avatar_page_loaded.png"),
          path.join(__dirname, "/update_avatar_page_loaded_diff.png")
        );

        // Execute
        this.cut.imageCropper.resizePointTopLeft.dispatchEvent(
          new MouseEvent("mousedown", {
            clientX: 10,
            clientY: 10,
            bubbles: true,
          })
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_moved_resized.png"),
          path.join(__dirname, "/golden/update_avatar_page_moved_resized.png"),
          path.join(__dirname, "/update_avatar_page_moved_resized_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "LoadError";
      private cut: UpdateAvatarPage;
      public async execute() {
        // Prepare
        await setViewport(1000, 900);
        this.cut = new UpdateAvatarPage(undefined);
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody);

        // Execute
        supplyFiles(() => this.cut.chooseFileButton.click(), nonImageFile);
        await new Promise<void>((resolve) =>
          this.cut.once("imageLoaded", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_load_error.png"),
          path.join(__dirname, "/golden/update_avatar_page_load_error.png"),
          path.join(__dirname, "/update_avatar_page_load_error_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Upload";
      private cut: UpdateAvatarPage;
      public async execute() {
        // Prepare
        let clientMock = new (class extends WebServiceClient {
          public constructor() {
            super(undefined, undefined);
          }
        })();
        await setViewport(1000, 1200);
        this.cut = new UpdateAvatarPage(clientMock);
        document.body.append(this.cut.body);
        menuContainer.append(this.cut.backMenuBody);

        supplyFiles(() => this.cut.chooseFileButton.click(), wideImage);
        await new Promise<void>((resolve) =>
          this.cut.once("imageLoaded", resolve)
        );

        clientMock.send = () => {
          throw new Error("upload error");
        };

        // Execute
        this.cut.uploadButton.click();
        await new Promise<void>((resolve) =>
          this.cut.once("updateError", resolve)
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_upload_error.png"),
          path.join(__dirname, "/golden/update_avatar_page_upload_error.png"),
          path.join(__dirname, "/update_avatar_page_upload_error_diff.png")
        );

        // Prepare
        clientMock.send = async (request) => {
          let toBeSent = await new Promise<string>((resolve) => {
            let fileReader = new FileReader();
            fileReader.onload = () => {
              resolve(fileReader.result as string);
            };
            fileReader.readAsBinaryString(request.body as Blob);
          });
          await writeFile(
            path.join(__dirname, "/update_avatar_page_uploaded_image.png"),
            toBeSent
          );
          return {} as UploadAccountAvatarResponse;
        };

        // Execute
        this.cut.uploadButton.click();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        await asyncAssertImage(
          path.join(__dirname, "/update_avatar_page_uploaded_image.png"),
          path.join(__dirname, "/golden/update_avatar_page_uploaded_image.png"),
          path.join(__dirname, "/update_avatar_page_uploaded_image_diff.png")
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    {
      name: "Back",
      execute: () => {
        // Prepare
        let cut = new UpdateAvatarPage(undefined);
        let isBack = false;
        cut.on("back", () => (isBack = true));

        // Execute
        cut.backMenuItem.click();

        // Verify
        assertThat(isBack, eq(true), "Back");
      },
    },
  ],
});
