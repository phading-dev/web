import coverImage1 = require("../../common/test_data/cover_tall.jpg");
import coverImage2 = require("../../common/test_data/cover_tall2.jpg");
import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { UpdateCoverImagePage } from "./body";
import { MAX_COVER_IMAGE_BUFFER_SIZE } from "@phading/constants/show";
import {
  UPLOAD_COVER_IMAGE,
  UPLOAD_COVER_IMAGE_REQUEST_METADATA,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { supplyFiles } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "UpdateCoverImagePageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "NoImage_SelectInvalidFile_SelectValidImage_SubmitError_SubmitSuccess_Back";
      private cut: UpdateCoverImagePage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new UpdateCoverImagePage(
          serviceClientMock,
          25 * 1024,
          "season1",
          {},
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_cover_image_no_image.png"),
          path.join(__dirname, "/golden/update_cover_image_no_image.png"),
          path.join(__dirname, "/update_cover_image_no_image_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        supplyFiles(
          () => this.cut.fileDropZone.val.click(),
          "non_existent_file.jpg",
        );
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_cover_image_invalid_file.png"),
          path.join(__dirname, "/golden/update_cover_image_invalid_file.png"),
          path.join(__dirname, "/update_cover_image_invalid_file_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        supplyFiles(() => this.cut.fileDropZone.val.click(), coverImage2);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_cover_image_file_too_large.png"),
          path.join(__dirname, "/golden/update_cover_image_file_too_large.png"),
          path.join(__dirname, "/update_cover_image_file_too_large_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        supplyFiles(() => this.cut.fileDropZone.val.click(), coverImage1);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_cover_image_selected_preview_image.png",
          ),
          path.join(
            __dirname,
            "/golden/update_cover_image_selected_preview_image.png",
          ),
          path.join(
            __dirname,
            "/update_cover_image_selected_preview_image_diff.png",
          ),
          {
            fullPage: true,
          },
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.submitButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("uploaded", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(UPLOAD_COVER_IMAGE),
          "RC",
        );
        assertThat(
          serviceClientMock.request.metadata,
          eqMessage(
            {
              seasonId: "season1",
            },
            UPLOAD_COVER_IMAGE_REQUEST_METADATA,
          ),
          "RC metadata",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_cover_image_submit_error.png"),
          path.join(__dirname, "/golden/update_cover_image_submit_error.png"),
          path.join(__dirname, "/update_cover_image_submit_error_diff.png"),
          {
            fullPage: true,
          },
        );

        // Prepare
        serviceClientMock.error = undefined;
        let back = false;
        this.cut.on("back", () => (back = true));

        // Execute
        this.cut.submitButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("uploaded", resolve),
        );

        // Verify
        assertThat(back, eq(true), "back from upload success");
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_cover_image_submit_success.png"),
          path.join(__dirname, "/golden/update_cover_image_submit_success.png"),
          path.join(__dirname, "/update_cover_image_submit_success_diff.png"),
          {
            fullPage: true,
          },
        );

        // Prepare
        back = false;

        // Execute
        this.cut.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "back from button click");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "WithImage_SelectAnotherImage";
      private cut: UpdateCoverImagePage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new UpdateCoverImagePage(
          serviceClientMock,
          MAX_COVER_IMAGE_BUFFER_SIZE,
          "season1",
          {
            coverImageUrl: coverImage1,
          },
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_cover_image_with_image.png"),
          path.join(__dirname, "/golden/update_cover_image_with_image.png"),
          path.join(__dirname, "/update_cover_image_with_image_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        supplyFiles(() => this.cut.fileDropZone.val.click(), coverImage2);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/update_cover_image_selected_preview_image_2.png",
          ),
          path.join(
            __dirname,
            "/golden/update_cover_image_selected_preview_image_2.png",
          ),
          path.join(
            __dirname,
            "/update_cover_image_selected_preview_image_2_diff.png",
          ),
          {
            fullPage: true,
          },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
