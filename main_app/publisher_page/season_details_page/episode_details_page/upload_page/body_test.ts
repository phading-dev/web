import "../../../../../dev/env";
import video = require("./common/test_data/two_videos_two_audios.mp4");
import path = require("path");
import { normalizeBody } from "../../../../../common/normalize_body";
import { setTabletView } from "../../../../../common/view_port";
import { UploadPage } from "./body";
import { CancelUploadPageMock } from "./cancel_upload_page/body_mock";
import { NewUploadPage } from "./new_upload_page/body";
import { ResumeUploadPage } from "./resume_upload_page/body";
import { UploadingPageMock } from "./uploading_page/body_mock";
import { ResumableUploadingState } from "@phading/video_service_interface/node/video_container";
import { supplyFiles } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

function createUploadPage(
  uploadingState?: ResumableUploadingState,
): UploadPage {
  return new UploadPage(
    (error) => new NewUploadPage(() => new Date("2023-01-01"), error),
    (error) => new ResumeUploadPage(error),
    (seasonId, episodeId, file, uploadingState) =>
      new UploadingPageMock(seasonId, episodeId, file, uploadingState),
    (seasonId, episodeId) => new CancelUploadPageMock(seasonId, episodeId),
    (...bodies) => document.body.append(...bodies),
    "season1",
    "episode1",
    uploadingState,
  );
}

TEST_RUNNER.run({
  name: "EpisodeUploadPage",
  cases: [
    new (class implements TestCase {
      public name =
        "TabletView_NewUpload_Back_Uploading_Back_Uploaded_Cancelling_Cancelled";
      private cut: UploadPage;
      public async execute() {
        // Prepare
        await setTabletView();

        // Execute
        this.cut = createUploadPage();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/upload_page_tablet_new_upload.png"),
          path.join(__dirname, "/golden/upload_page_tablet_new_upload.png"),
          path.join(__dirname, "/upload_page_tablet_new_upload_diff.png"),
        );

        // Prepare
        let back = false;
        this.cut.on("back", () => {
          back = true;
        });

        // Execute
        this.cut.newUploadPage.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "back button");

        // Execute
        await supplyFiles(
          () => this.cut.newUploadPage.fileDropZone.val.click(),
          video,
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/upload_page_tablet_uploading.png"),
          path.join(__dirname, "/golden/upload_page_tablet_uploading.png"),
          path.join(__dirname, "/upload_page_tablet_uploading_diff.png"),
        );

        // Prepare
        back = false;

        // Execute
        this.cut.uploadingPage.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "back button 2");

        // Execute
        (this.cut.uploadingPage as UploadingPageMock).complete();

        // Verify
        await new Promise((resolve) => this.cut.once("back", resolve));

        // Execute
        this.cut.uploadingPage.cancelButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/upload_page_tablet_cancel.png"),
          path.join(__dirname, "/golden/upload_page_tablet_cancel.png"),
          path.join(__dirname, "/upload_page_tablet_cancel_diff.png"),
        );

        // Execute
        (this.cut.cancelUploadPage as CancelUploadPageMock).complete();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/upload_page_tablet_uploading_cancelled.png"),
          path.join(__dirname, "/golden/upload_page_tablet_new_upload.png"),
          path.join(
            __dirname,
            "/upload_page_tablet_uploading_cancelled_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "TabletView_NewUpload_ReSelectDueToError";
      private cut: UploadPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = createUploadPage();
        await supplyFiles(
          () => this.cut.newUploadPage.fileDropZone.val.click(),
          "some_file.txt",
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/upload_page_tablet_new_upload_error.png"),
          path.join(__dirname, "/golden/upload_page_tablet_new_upload_error.png"),
          path.join(__dirname, "/upload_page_tablet_new_upload_error_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_ResumeUpload_Back_Uploading_Cancelled";
      private cut: UploadPage;
      public async execute() {
        // Prepare
        await setTabletView();

        // Execute
        this.cut = createUploadPage({
          fileExt: "mp4",
          md5: "b90f9eda74d5732c55687eea65087bb2",
        });

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/upload_page_tablet_resume_upload.png"),
          path.join(__dirname, "/golden/upload_page_tablet_resume_upload.png"),
          path.join(__dirname, "/upload_page_tablet_resume_upload_diff.png"),
        );

        // Prepare
        let back = false;
        this.cut.on("back", () => {
          back = true;
        });

        // Execute
        this.cut.resumeUploadPage.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "back button");

        // Execute
        await supplyFiles(
          () => this.cut.resumeUploadPage.fileDropZone.val.click(),
          video,
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/upload_page_tablet_uploading.png"),
          path.join(__dirname, "/golden/upload_page_tablet_uploading.png"),
          path.join(__dirname, "/upload_page_tablet_uploading_diff.png"),
        );

        // Execute
        this.cut.uploadingPage.cancelButton.val.click();
        (this.cut.cancelUploadPage as CancelUploadPageMock).complete();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/upload_page_tablet_resume_uploading_cancelled.png",
          ),
          path.join(__dirname, "/golden/upload_page_tablet_new_upload.png"),
          path.join(
            __dirname,
            "/upload_page_tablet_resume_uploading_cancelled_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_ResumeUpload_ReSelectDueToError_Cancelled";
      private cut: UploadPage;
      public async execute() {
        // Prepare
        await setTabletView();

        // Execute
        this.cut = createUploadPage({
          fileExt: "mp4",
          md5: "random_md5",
        });
        await supplyFiles(
          () => this.cut.resumeUploadPage.fileDropZone.val.click(),
          video,
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/upload_page_tablet_resume_upload_error.png"),
          path.join(
            __dirname,
            "/golden/upload_page_tablet_resume_upload_error.png",
          ),
          path.join(
            __dirname,
            "/upload_page_tablet_resume_upload_error_diff.png",
          ),
        );

        // Execute
        this.cut.resumeUploadPage.cancelButton.val.click();
        (this.cut.cancelUploadPage as CancelUploadPageMock).complete();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/upload_page_tablet_resume_upload_cancelled.png",
          ),
          path.join(__dirname, "/golden/upload_page_tablet_new_upload.png"),
          path.join(
            __dirname,
            "/upload_page_tablet_resume_upload_cancelled_diff.png",
          ),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
