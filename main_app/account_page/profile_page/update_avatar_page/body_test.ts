import wideImage = require("./test_data/wide.jpeg");
import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { UpdateAvatarPage } from "./body";
import { supplyFiles } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "UpdateAvatarPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "NoImage_InvalidFile_PreviewImage_UploadError_UploadSuccess_Back";
      private cut: UpdateAvatarPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new UpdateAvatarPage(serviceClientMock, {});

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_default.png"),
          path.join(__dirname, "/golden/update_avatar_page_default.png"),
          path.join(__dirname, "/update_avatar_page_default_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        supplyFiles(
          () => this.cut.fileDropZone.val.click(),
          "non_existent_file.jpg",
        );
        await new Promise<void>((resolve) =>
          this.cut.once("imageLoaded", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_preview_error.png"),
          path.join(__dirname, "/golden/update_avatar_page_preview_error.png"),
          path.join(__dirname, "/update_avatar_page_preview_error_diff.png"),
        );

        // Execute
        supplyFiles(() => this.cut.fileDropZone.val.click(), wideImage);
        await new Promise<void>((resolve) =>
          this.cut.once("imageLoaded", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_preview.png"),
          path.join(__dirname, "/golden/update_avatar_page_preview.png"),
          path.join(__dirname, "/update_avatar_page_preview_diff.png"),
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.uploadButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("uploaded", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_upload_error.png"),
          path.join(__dirname, "/golden/update_avatar_page_upload_error.png"),
          path.join(__dirname, "/update_avatar_page_upload_error_diff.png"),
        );

        // Prepare
        serviceClientMock.error = undefined;
        let back = false;
        this.cut.on("back", () => (back = true));

        // Execute
        this.cut.uploadButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("uploaded", resolve),
        );

        // Verify
        assertThat(back, eq(true), "back when success");
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_upload_success.png"),
          path.join(__dirname, "/golden/update_avatar_page_preview.png"),
          path.join(__dirname, "/update_avatar_page_upload_success_diff.png"),
        );

        // Prepare
        back = false;

        // Execute
        this.cut.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "back when clicked");
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "WithImage";
      private cut: UpdateAvatarPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new UpdateAvatarPage(serviceClientMock, {
          avatarLargeUrl: wideImage,
        });

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_avatar_page_with_image.png"),
          path.join(__dirname, "/golden/update_avatar_page_with_image.png"),
          path.join(__dirname, "/update_avatar_page_with_image_diff.png"),
          {
            fullPage: true,
          },
        );
      }
    })(),
  ],
});
