import "../../../../../../dev/env";
import video = require("../common/test_data/two_videos_two_audios.mp4");
import path = require("path");
import { normalizeBody } from "../../../../../../common/normalize_body";
import { setTabletView } from "../../../../../../common/view_port";
import { ResumeUploadPage } from "./body";
import { supplyFiles } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "ResumeUploadPage",
  cases: [
    new (class implements TestCase {
      public name = "Default_SelectFile_Cancel";
      public cut: ResumeUploadPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = new ResumeUploadPage();

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/resume_upload_page_tablet_default.png"),
          path.join(__dirname, "/golden/resume_upload_page_tablet_default.png"),
          path.join(__dirname, "/resume_upload_page_tablet_default_diff.png"),
        );

        // Prepare
        let upload: File;
        this.cut.on("upload", (file) => {
          upload = file;
        });

        // Execute
        await supplyFiles(() => this.cut.fileDropZone.val.click(), video);

        // Verify
        assertThat(
          upload.name,
          eq("two_videos_two_audios.mp4"),
          "Upload media file name",
        );

        // Prepare
        let cancel = false;
        this.cut.on("cancel", () => (cancel = true));

        // Execute
        this.cut.cancelButton.val.click();

        // Verify
        assertThat(cancel, eq(true), "Cancel");

        // Prepare
        let back = false;
        this.cut.on("back", () => (back = true));

        // Execute
        this.cut.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "Back");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "WithError";
      public cut: ResumeUploadPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = new ResumeUploadPage("Not the same file selected.");

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/resume_upload_page_tablet_error.png"),
          path.join(__dirname, "/golden/resume_upload_page_tablet_error.png"),
          path.join(__dirname, "/resume_upload_page_tablet_error_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
