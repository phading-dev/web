import "../../../../../../dev/env";
import video = require("../common/test_data/two_videos_two_audios.mp4");
import path = require("path");
import { normalizeBody } from "../../../../../../common/normalize_body";
import {
  setPhoneView,
  setTabletView,
} from "../../../../../../common/view_port";
import { NewUploadPage } from "./body";
import { supplyFiles } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

TEST_RUNNER.run({
  name: "NewUploadPageTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_VideoTooltip_SubtitlesTooltip_SelectVideo_Back";
      public cut: NewUploadPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = new NewUploadPage(() => new Date("2023-10-01T00:00:00Z"));

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/new_upload_page_tablet_default.png"),
          path.join(__dirname, "/golden/new_upload_page_tablet_default.png"),
          path.join(__dirname, "/new_upload_page_tablet_default_diff.png"),
        );

        // Execute
        this.cut.videoQuestionMark.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/new_upload_page_tablet_video_tooltip.png"),
          path.join(
            __dirname,
            "/golden/new_upload_page_tablet_video_tooltip.png",
          ),
          path.join(
            __dirname,
            "/new_upload_page_tablet_video_tooltip_diff.png",
          ),
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/new_upload_page_phone_video_tooltip.png"),
          path.join(
            __dirname,
            "/golden/new_upload_page_phone_video_tooltip.png",
          ),
          path.join(__dirname, "/new_upload_page_phone_video_tooltip_diff.png"),
        );

        // Execute
        await setTabletView();
        this.cut.audioQuestionMark.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/new_upload_page_tablet_audio_tooltip.png"),
          path.join(
            __dirname,
            "/golden/new_upload_page_tablet_audio_tooltip.png",
          ),
          path.join(
            __dirname,
            "/new_upload_page_tablet_audio_tooltip_diff.png",
          ),
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/new_upload_page_phone_audio_tooltip.png"),
          path.join(
            __dirname,
            "/golden/new_upload_page_phone_audio_tooltip.png",
          ),
          path.join(__dirname, "/new_upload_page_phone_audio_tooltip_diff.png"),
        );

        // Execute
        await setTabletView();
        this.cut.subtitlesQuestionMark.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/new_upload_page_tablet_subtitles_tooltip.png"),
          path.join(
            __dirname,
            "/golden/new_upload_page_tablet_subtitles_tooltip.png",
          ),
          path.join(
            __dirname,
            "/new_upload_page_tablet_subtitles_tooltip_diff.png",
          ),
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/new_upload_page_phone_subtitles_tooltip.png"),
          path.join(
            __dirname,
            "/golden/new_upload_page_phone_subtitles_tooltip.png",
          ),
          path.join(
            __dirname,
            "/new_upload_page_phone_subtitles_tooltip_diff.png",
          ),
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

        // Execute
        let back = false;
        this.cut.on("back", () => {
          back = true;
        });

        // Execute
        this.cut.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "back");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "InitError_SelectInvalidFileTypes_SelectVideoTooLarge_SelectAudioTooLarge_SelectZipTooLarge";
      public cut: NewUploadPage;
      public async execute() {
        // Prepare
        await setTabletView();
        this.cut = new NewUploadPage(
          () => new Date("2023-10-01T00:00:00Z"),
          "Failed to upload",
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/new_upload_page_tablet_init_error.png"),
          path.join(__dirname, "/golden/new_upload_page_tablet_init_error.png"),
          path.join(__dirname, "/new_upload_page_tablet_init_error_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
