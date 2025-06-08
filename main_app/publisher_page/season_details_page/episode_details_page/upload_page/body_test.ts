import "../../../../../dev/env";
import video = require("./common/test_data/two_videos_two_audios.mp4");
import path = require("path");
import { normalizeBody } from "../../../../../common/normalize_body";
import { setTabletView } from "../../../../../common/view_port";
import { UploadPage } from "./body";
import { CancelUploadPage } from "./cancel_upload_page/body";
import { ChunkedUploadMock } from "./common/chunked_upload_mock";
import { NewUploadPage } from "./new_upload_page/body";
import { ResumeUploadPage } from "./resume_upload_page/body";
import { UploadingPage } from "./uploading_page/body";
import {
  MAX_MEDIA_CONTENT_LENGTH,
  MAX_SUBTITLE_ZIP_CONTENT_LENGTH,
} from "@phading/constants/video";
import {
  CANCEL_UPLOADING,
  START_UPLOADING,
  StartUploadingResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { ResumableUploadingState } from "@phading/video_service_interface/node/video_container";
import { supplyFiles } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

export class UploadPageServiceClientMock extends WebServiceClientMock {
  public cancelResolveFn: () => void;
  public cancelRejectFn: (error: Error) => void;

  public async send(request: ClientRequestInterface<any>): Promise<any> {
    if (request.descriptor === CANCEL_UPLOADING) {
      await new Promise<void>((resolve, reject) => {
        this.cancelResolveFn = resolve;
        this.cancelRejectFn = reject;
      });
      return {};
    } else if (request.descriptor === START_UPLOADING) {
      let response: StartUploadingResponse = {
        uploadSessionUrl: "https://example.com/upload",
        byteOffset: 0,
      };
      return response;
    }
  }
}

function createUploadPage(
  serviceClientMock: WebServiceClientMock,
  uploadingState?: ResumableUploadingState,
): UploadPage {
  let nowDate = new Date("2023-01-01");
  return new UploadPage(
    (error) => new NewUploadPage(() => nowDate, error),
    (error) => new ResumeUploadPage(error),
    (seasonId, episodeId, file, uploadingState) =>
      new UploadingPage(
        MAX_MEDIA_CONTENT_LENGTH,
        MAX_SUBTITLE_ZIP_CONTENT_LENGTH,
        (blob, resumeUrl, byteOffset) =>
          new ChunkedUploadMock(blob, resumeUrl, byteOffset),
        serviceClientMock,
        () => nowDate,
        seasonId,
        episodeId,
        file,
        uploadingState,
      ),
    (seasonId, episodeId) =>
      new CancelUploadPage(serviceClientMock, seasonId, episodeId, false),
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
        let serviceClientMock = new UploadPageServiceClientMock();

        // Execute
        this.cut = createUploadPage(serviceClientMock);

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
        (this.cut.uploadingPage.chunkedUpload as ChunkedUploadMock).complete();

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
        serviceClientMock.cancelResolveFn();

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
      public name = "TabletView_NewUpload_ReSelectDueToError";
      private cut: UploadPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new UploadPageServiceClientMock();
        this.cut = createUploadPage(serviceClientMock);

        // Execute
        await supplyFiles(
          () => this.cut.newUploadPage.fileDropZone.val.click(),
          "some_file.txt",
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/upload_page_tablet_new_upload_error.png"),
          path.join(
            __dirname,
            "/golden/upload_page_tablet_new_upload_error.png",
          ),
          path.join(__dirname, "/upload_page_tablet_new_upload_error_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "TabletView_ResumeUpload_Back_Uploading_BackDueToCancelFailed";
      private cut: UploadPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new UploadPageServiceClientMock();

        // Execute
        this.cut = createUploadPage(serviceClientMock, {
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
        serviceClientMock.cancelRejectFn(new Error("Fake error"));

        // Verify
        await new Promise((resolve) => this.cut.once("back", resolve));
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
        let serviceClientMock = new UploadPageServiceClientMock();

        // Execute
        this.cut = createUploadPage(serviceClientMock, {
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
        serviceClientMock.cancelResolveFn();

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
