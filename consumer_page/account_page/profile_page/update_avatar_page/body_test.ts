import nonImageFile = require("./test_data/non_image.bin");
import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { UpdateAvatarPage } from "./body";
import { UploadAccountAvatarResponse } from "@phading/user_service_interface/self/frontend/interface";
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
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import "../../../../common/normalize_body";

TEST_RUNNER.run({
  name: "UpdateAvatarPageTest",
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

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_default.png"),
          path.join(__dirname, "/golden/update_avatar_page_default.png"),
          path.join(__dirname, "/update_avatar_page_default_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_scroll_to_bottom.png"),
          path.join(
            __dirname,
            "/golden/update_avatar_page_scroll_to_bottom.png",
          ),
          path.join(__dirname, "/update_avatar_page_scroll_to_bottom_diff.png"),
        );

        // Execute
        supplyFiles(() => this.cut.chooseFileButton.val.click(), wideImage);
        await new Promise<void>((resolve) =>
          this.cut.once("imageLoaded", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_loaded.png"),
          path.join(__dirname, "/golden/update_avatar_page_loaded.png"),
          path.join(__dirname, "/update_avatar_page_loaded_diff.png"),
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

        // Execute
        supplyFiles(() => this.cut.chooseFileButton.val.click(), nonImageFile);
        await new Promise<void>((resolve) =>
          this.cut.once("imageLoaded", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_load_error.png"),
          path.join(__dirname, "/golden/update_avatar_page_load_error.png"),
          path.join(__dirname, "/update_avatar_page_load_error_diff.png"),
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
        let clientMock = new WebServiceClientMock();
        await setViewport(1000, 1200);
        this.cut = new UpdateAvatarPage(clientMock);
        document.body.append(this.cut.body);

        supplyFiles(() => this.cut.chooseFileButton.val.click(), wideImage);
        await new Promise<void>((resolve) =>
          this.cut.once("imageLoaded", resolve),
        );

        clientMock.send = () => {
          throw new Error("upload error");
        };

        // Execute
        this.cut.uploadButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("updateError", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_upload_error.png"),
          path.join(__dirname, "/golden/update_avatar_page_upload_error.png"),
          path.join(__dirname, "/update_avatar_page_upload_error_diff.png"),
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
            toBeSent,
          );
          return {} as UploadAccountAvatarResponse;
        };

        // Execute
        this.cut.uploadButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("updated", resolve));

        // Verify
        await asyncAssertImage(
          path.join(__dirname, "/update_avatar_page_uploaded_image.png"),
          path.join(__dirname, "/golden/update_avatar_page_uploaded_image.png"),
          path.join(__dirname, "/update_avatar_page_uploaded_image_diff.png"),
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
        cut.backButton.val.click();

        // Verify
        assertThat(isBack, eq(true), "Back");
      },
    },
  ],
});
