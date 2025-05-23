import "../../../../../../dev/env";
import audio = require("../common/test_data/audio.m4a");
import zip = require("../common/test_data/example.zip");
import video = require("../common/test_data/two_videos_two_audios.mp4");
import path = require("path");
import { normalizeBody } from "../../../../../../common/normalize_body";
import { setTabletView } from "../../../../../../common/view_port";
import { ChunkedUploadMock } from "../common/chunked_upload_mock";
import { UploadingPage } from "./body";
import {
  MAX_MEDIA_CONTENT_LENGTH,
  MAX_SUBTITLE_ZIP_CONTENT_LENGTH,
} from "@phading/constants/video";
import {
  COMPLETE_UPLOADING,
  COMPLETE_UPLOADING_REQUEST_BODY,
  START_UPLOADING,
  START_UPLOADING_REQUEST_BODY,
  StartUploadingResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { ResumableUploadingState } from "@phading/video_service_interface/node/video_container";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { supplyFiles } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import { assertThat, containStr, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

async function getFile(filename: string) {
  let fileInput = E.input({
    type: "file",
  });
  await supplyFiles(() => fileInput.click(), filename);
  return fileInput.files[0];
}

function createUploadingPage(
  maxMediaContentLength: number,
  maxSubtitleZipContentLength: number,
  serviceClient: WebServiceClientMock,
  file: File,
  uploadingState?: ResumableUploadingState,
) {
  return new UploadingPage(
    maxMediaContentLength,
    maxSubtitleZipContentLength,
    (blob, resumeUrl, byteOffset) => {
      return new ChunkedUploadMock(blob, resumeUrl, byteOffset);
    },
    serviceClient,
    () => new Date("2023-10-01T00:00:00Z"),
    "season1",
    "episode1",
    file,
    uploadingState,
  );
}

TEST_RUNNER.run({
  name: "UploadingPageTest",
  cases: [
    new (class implements TestCase {
      public name = "NewUploading_FromZero_Middle_UntilComplete_Back_Restart";
      public cut: UploadingPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let file = await getFile(video);
        let stallResolveFn: () => void;
        let serviceClientMock = new (class extends WebServiceClientMock {
          public async send(
            request: ClientRequestInterface<any>,
          ): Promise<any> {
            this.request = request;
            await new Promise<void>((resolve) => {
              stallResolveFn = resolve;
            });
            let response: StartUploadingResponse = {
              uploadSessionUrl: "https://example.com/upload",
              byteOffset: 0,
            };
            return response;
          }
        })();
        this.cut = createUploadingPage(
          MAX_MEDIA_CONTENT_LENGTH,
          MAX_SUBTITLE_ZIP_CONTENT_LENGTH,
          serviceClientMock,
          file,
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/uploading_page_preparing.png"),
          path.join(__dirname, "/golden/uploading_page_preparing.png"),
          path.join(__dirname, "/uploading_page_preparing_diff.png"),
        );

        // Execute
        stallResolveFn();
        await new Promise<void>((resolve) => this.cut.once("started", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(START_UPLOADING),
          "Start uploading request",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "episode1",
              contentLength: file.size,
              fileExt: "mp4",
              md5: "b90f9eda74d5732c55687eea65087bb2",
            },
            START_UPLOADING_REQUEST_BODY,
          ),
          "Start uploading request body",
        );
        assertThat(
          (this.cut.chunkedUpload as ChunkedUploadMock).blob,
          eq(file),
          "Blob",
        );
        assertThat(
          (this.cut.chunkedUpload as ChunkedUploadMock).resumeUrl,
          eq("https://example.com/upload"),
          "Resume URL",
        );
        assertThat(
          (this.cut.chunkedUpload as ChunkedUploadMock).byteOffset,
          eq(0),
          "Starting byte offset",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/uploading_page_new_start.png"),
          path.join(__dirname, "/golden/uploading_page_new_start.png"),
          path.join(__dirname, "/uploading_page_new_start_diff.png"),
        );

        // Execute
        (this.cut.chunkedUpload as ChunkedUploadMock).triggerEvent(12000000);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/uploading_page_progress.png"),
          path.join(__dirname, "/golden/uploading_page_progress.png"),
          path.join(__dirname, "/uploading_page_progress_diff.png"),
        );

        // Execute
        (this.cut.chunkedUpload as ChunkedUploadMock).triggerEvent(file.size);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/uploading_page_complete.png"),
          path.join(__dirname, "/golden/uploading_page_complete.png"),
          path.join(__dirname, "/uploading_page_complete_diff.png"),
        );

        // Prepare
        let request: ClientRequestInterface<any>;
        serviceClientMock.send = async (request_) => {
          request = request_;
          return {};
        };

        // Execute
        (this.cut.chunkedUpload as ChunkedUploadMock).complete();

        // Verify
        await new Promise((resolve) => this.cut.once("back", resolve));
        assertThat(
          request.descriptor,
          eq(COMPLETE_UPLOADING),
          "Complete uploading request",
        );
        assertThat(
          request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "episode1",
              uploadSessionUrl: "https://example.com/upload",
            },
            COMPLETE_UPLOADING_REQUEST_BODY,
          ),
          "Complete uploading request body",
        );

        // Prepare
        let back = false;
        this.cut.on("back", () => {
          back = true;
        });

        // Execute
        this.cut.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "back");

        // Prepare
        let cancel = false;
        this.cut.on("cancel", () => {
          cancel = true;
        });

        // Execute
        this.cut.cancelButton.val.click();

        // Verify
        assertThat(cancel, eq(true), "cancel");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ResumeUploading_FromMiddle_UntilComplete";
      public cut: UploadingPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let file = await getFile(zip);
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          uploadSessionUrl: "https://example.com/upload",
          byteOffset: 10000000,
        } as StartUploadingResponse;
        this.cut = createUploadingPage(
          MAX_MEDIA_CONTENT_LENGTH,
          MAX_SUBTITLE_ZIP_CONTENT_LENGTH,
          serviceClientMock,
          file,
          {
            fileExt: "zip",
            md5: "e8c3c8233d56d4b2b3780b08dde17cc4",
          },
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("started", resolve));

        // Verify
        assertThat(
          (this.cut.chunkedUpload as ChunkedUploadMock).byteOffset,
          eq(10000000),
          "Starting byte offset",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/uploading_page_middle.png"),
          path.join(__dirname, "/golden/uploading_page_middle.png"),
          path.join(__dirname, "/uploading_page_middle_diff.png"),
        );

        // Execute
        (this.cut.chunkedUpload as ChunkedUploadMock).complete();

        // Verify
        await new Promise((resolve) => this.cut.once("back", resolve));
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "InvalidFileType";
      public cut: UploadingPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let file = await getFile("invalid_file.txt");

        // Execute
        this.cut = createUploadingPage(
          MAX_MEDIA_CONTENT_LENGTH,
          MAX_SUBTITLE_ZIP_CONTENT_LENGTH,
          new WebServiceClientMock(),
          file,
        );
        document.body.append(this.cut.body);
        let error = await new Promise<string>((resolve) =>
          this.cut.once("reSelect", (error) => resolve(error)),
        );

        // Verify
        assertThat(
          error,
          eq(
            "File type not accepted. Only accepting .mp4, .mov, .mkv, .m4a, .aac or .zip.",
          ),
          "Error",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "InvalidFileTypeNoExt";
      public cut: UploadingPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let file = await getFile("no_ext");

        // Execute
        this.cut = createUploadingPage(
          MAX_MEDIA_CONTENT_LENGTH,
          MAX_SUBTITLE_ZIP_CONTENT_LENGTH,
          new WebServiceClientMock(),
          file,
        );
        document.body.append(this.cut.body);
        let error = await new Promise<string>((resolve) =>
          this.cut.once("reSelect", (error) => resolve(error)),
        );

        // Verify
        assertThat(
          error,
          eq(
            "File type not accepted. Only accepting .mp4, .mov, .mkv, .m4a, .aac or .zip.",
          ),
          "Error",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "VideoFileTooLarge";
      public cut: UploadingPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let file = await getFile(video);

        // Execute
        this.cut = createUploadingPage(
          20 * 1024 * 1024,
          1024 * 1024,
          new WebServiceClientMock(),
          file,
        );
        document.body.append(this.cut.body);
        let error = await new Promise<string>((resolve) =>
          this.cut.once("reSelect", (error) => resolve(error)),
        );

        // Verify
        assertThat(
          error,
          eq("File is too large. The maximum file size is 20 MiB."),
          "Error",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "AudioFileTooLarge";
      public cut: UploadingPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let file = await getFile(audio);

        // Execute
        this.cut = createUploadingPage(
          2 * 1024 * 1024,
          1024 * 1024,
          new WebServiceClientMock(),
          file,
        );
        document.body.append(this.cut.body);
        let error = await new Promise<string>((resolve) =>
          this.cut.once("reSelect", (error) => resolve(error)),
        );

        // Verify
        assertThat(
          error,
          eq("File is too large. The maximum file size is 2 MiB."),
          "Error",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SubtitleZipFileTooLarge";
      public cut: UploadingPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let file = await getFile(zip);

        // Execute
        this.cut = createUploadingPage(
          2 * 1024 * 1024,
          1024 * 1024,
          new WebServiceClientMock(),
          file,
        );
        document.body.append(this.cut.body);
        let error = await new Promise<string>((resolve) =>
          this.cut.once("reSelect", (error) => resolve(error)),
        );

        // Verify
        assertThat(
          error,
          eq("File is too large. The maximum file size is 1 MiB."),
          "Error",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ResumeUploading_Md5Mismatch";
      public cut: UploadingPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let file = await getFile(video);

        // Execute
        this.cut = createUploadingPage(
          MAX_MEDIA_CONTENT_LENGTH,
          MAX_SUBTITLE_ZIP_CONTENT_LENGTH,
          new WebServiceClientMock(),
          file,
          {
            fileExt: "mp4",
            md5: "random_md5",
          },
        );
        document.body.append(this.cut.body);
        let error = await new Promise<string>((resolve) =>
          this.cut.once("reSelect", (error) => resolve(error)),
        );

        // Verify
        assertThat(
          error,
          containStr("not the same one being uploaded"),
          "Error",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/uploading_page_error_returned.png"),
          path.join(__dirname, "/golden/uploading_page_preparing.png"),
          path.join(__dirname, "/uploading_page_error_returned_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ResumeUploading_FailedToStart";
      public cut: UploadingPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let file = await getFile(video);
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.error = new Error("Fake error");
        this.cut = createUploadingPage(
          MAX_MEDIA_CONTENT_LENGTH,
          MAX_SUBTITLE_ZIP_CONTENT_LENGTH,
          serviceClientMock,
          file,
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("failed", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/uploading_page_failed_to_start.png"),
          path.join(__dirname, "/golden/uploading_page_failed_to_start.png"),
          path.join(__dirname, "/uploading_page_failed_to_start_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ResumeUploading_FailedToUpload";
      public cut: UploadingPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let file = await getFile(video);
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          uploadSessionUrl: "https://example.com/upload",
          byteOffset: 0,
        } as StartUploadingResponse;
        this.cut = createUploadingPage(
          MAX_MEDIA_CONTENT_LENGTH,
          MAX_SUBTITLE_ZIP_CONTENT_LENGTH,
          serviceClientMock,
          file,
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("started", resolve));

        // Execute
        (this.cut.chunkedUpload as ChunkedUploadMock).reject();
        await new Promise<void>((resolve) => this.cut.once("failed", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/uploading_page_failed_to_upload.png"),
          path.join(__dirname, "/golden/uploading_page_failed_to_upload.png"),
          path.join(__dirname, "/uploading_page_failed_to_upload_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
