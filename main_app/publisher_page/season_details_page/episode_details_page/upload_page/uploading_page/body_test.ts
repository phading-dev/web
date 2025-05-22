import "../../../../../../dev/env";
import video = require("../common/test_data/two_videos_two_audios.mp4");
import path = require("path");
import { normalizeBody } from "../../../../../../common/normalize_body";
import { setTabletView } from "../../../../../../common/view_port";
import { ChunkedUploadMock } from "../common/chunked_upload_mock";
import { UploadingPage } from "./body";
import {
  COMPLETE_UPLOADING,
  COMPLETE_UPLOADING_REQUEST_BODY,
  START_UPLOADING,
  START_UPLOADING_REQUEST_BODY,
  StartUploadingResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import { supplyFiles } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "UploadingPageTest",
  cases: [
    new (class implements TestCase {
      public name = "NewUploading_FromZero_Middle_UntilComplete_Back_Restart";
      public cut: UploadingPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let fileInput = E.input({
          type: "file",
        });
        await supplyFiles(() => fileInput.click(), video);
        let file = fileInput.files[0];
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          uploadSessionUrl: "https://example.com/upload",
          byteOffset: 0,
        } as StartUploadingResponse;
        let chunkedUploadMock: ChunkedUploadMock;
        this.cut = new UploadingPage(
          (blob, resumeUrl, byteOffset) => {
            chunkedUploadMock = new ChunkedUploadMock(
              blob,
              resumeUrl,
              byteOffset,
            );
            return chunkedUploadMock;
          },
          serviceClientMock,
          () => new Date("2023-10-01T00:00:00Z"),
          "season1",
          "episode1",
          file,
        );

        // Execute
        document.body.append(this.cut.body);
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
        assertThat(chunkedUploadMock.blob, eq(file), "Blob");
        assertThat(
          chunkedUploadMock.resumeUrl,
          eq("https://example.com/upload"),
          "Resume URL",
        );
        assertThat(chunkedUploadMock.byteOffset, eq(0), "Starting byte offset");
        await asyncAssertScreenshot(
          path.join(__dirname, "/uploading_page_default.png"),
          path.join(__dirname, "/golden/uploading_page_default.png"),
          path.join(__dirname, "/uploading_page_default_diff.png"),
        );

        // Execute
        chunkedUploadMock.triggerEvent(12000000);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/uploading_page_progress.png"),
          path.join(__dirname, "/golden/uploading_page_progress.png"),
          path.join(__dirname, "/uploading_page_progress_diff.png"),
        );

        // Execute
        chunkedUploadMock.triggerEvent(file.size);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/uploading_page_complete.png"),
          path.join(__dirname, "/golden/uploading_page_complete.png"),
          path.join(__dirname, "/uploading_page_complete_diff.png"),
        );

        // Execute
        chunkedUploadMock.complete();
        await new Promise((resolve) => this.cut.once("back", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(COMPLETE_UPLOADING),
          "Complete uploading request",
        );
        assertThat(
          serviceClientMock.request.body,
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
        let fileInput = E.input({
          type: "file",
        });
        await supplyFiles(() => fileInput.click(), video);
        let file = fileInput.files[0];
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          uploadSessionUrl: "https://example.com/upload",
          byteOffset: 22000000,
        } as StartUploadingResponse;
        let chunkedUploadMock: ChunkedUploadMock;
        this.cut = new UploadingPage(
          (blob, resumeUrl, byteOffset) => {
            chunkedUploadMock = new ChunkedUploadMock(
              blob,
              resumeUrl,
              byteOffset,
            );
            return chunkedUploadMock;
          },
          serviceClientMock,
          () => new Date("2023-10-01T00:00:00Z"),
          "season1",
          "episode1",
          file,
          {
            fileExt: "mp4",
            md5: "b90f9eda74d5732c55687eea65087bb2",
          },
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("started", resolve));

        // Verify
        assertThat(
          chunkedUploadMock.byteOffset,
          eq(22000000),
          "Starting byte offset",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/uploading_page_middle.png"),
          path.join(__dirname, "/golden/uploading_page_middle.png"),
          path.join(__dirname, "/uploading_page_middle_diff.png"),
        );

        // Execute
        chunkedUploadMock.complete();
        await new Promise((resolve) => this.cut.once("back", resolve));
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
        let fileInput = E.input({
          type: "file",
        });
        await supplyFiles(() => fileInput.click(), video);
        let file = fileInput.files[0];
        let serviceClientMock = new WebServiceClientMock();
        let chunkedUploadMock: ChunkedUploadMock;
        this.cut = new UploadingPage(
          (blob, resumeUrl, byteOffset) => {
            chunkedUploadMock = new ChunkedUploadMock(
              blob,
              resumeUrl,
              byteOffset,
            );
            return chunkedUploadMock;
          },
          serviceClientMock,
          () => new Date("2023-10-01T00:00:00Z"),
          "season1",
          "episode1",
          file,
          {
            fileExt: "mp4",
            md5: "random_md5",
          },
        );

        // Execute
        document.body.append(this.cut.body);
        let message = await new Promise<string>((resolve) =>
          this.cut.once("reSelect", (message) => resolve(message)),
        );

        // Verify
        assertThat(
          message,
          eq("Selected file is not the same one being uploaded."),
          "Error message",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/uploading_page_preparing.png"),
          path.join(__dirname, "/golden/uploading_page_preparing.png"),
          path.join(__dirname, "/uploading_page_preparing_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
