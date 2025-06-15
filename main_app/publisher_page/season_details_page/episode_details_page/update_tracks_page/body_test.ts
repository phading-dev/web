import path = require("path");
import { normalizeBody } from "../../../../../common/normalize_body";
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../../../common/view_port";
import { UpdateTracksPage } from "./body";
import {
  COMMIT_EPISODE_STAGING_DATA,
  COMMIT_EPISODE_STAGING_DATA_REQUEST_BODY,
  SAVE_EPISODE_STAGING_DATA,
  SAVE_EPISODE_STAGING_DATA_REQUEST_BODY,
  SaveEpisodeStagingDataResponse,
} from "@phading/product_service_interface/show/web/publisher/interface";
import { ValidationError } from "@phading/video_service_interface/node/validation_error";
import { VideoContainerStagingData } from "@phading/video_service_interface/node/video_container_staging_data";
import { eqMessage } from "@selfage/message/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

class SaveResponseErrorTestCase implements TestCase {
  private cut: UpdateTracksPage;
  public constructor(
    public name: string,
    private error: ValidationError,
    private screenshotPath: string,
    private goldenPath: string,
    private diffPath: string,
  ) {}
  public async execute() {
    // Prepare
    await setTabletView();
    let serviceClientMock = new WebServiceClientMock();
    this.cut = new UpdateTracksPage(serviceClientMock, "season1", "episode1", {
      videos: [],
      audios: [],
      subtitles: [],
    });
    let response: SaveEpisodeStagingDataResponse = {
      error: this.error,
    };
    serviceClientMock.response = response;

    // Execute
    document.body.append(this.cut.body);
    this.cut.saveStagingButton.val.click();
    await new Promise<void>((resolve) => this.cut.once("saved", resolve));

    // Verify
    await asyncAssertScreenshot(
      this.screenshotPath,
      this.goldenPath,
      this.diffPath,
    );
  }
  public tearDown() {
    this.cut.remove();
  }
}

TEST_RUNNER.run({
  name: "UpdateTracksPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "TabletView_PhoneView_DesktopView_ManyModifications_SaveSuccess_CommitSuccess";
      private cut: UpdateTracksPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {};
        this.cut = new UpdateTracksPage(
          serviceClientMock,
          "season1",
          "episode1",
          {
            videos: [
              {
                r2TrackDirname: "video1",
                durationSec: 3600,
                resolution: "1920x1080",
                committed: true,
              },
              {
                r2TrackDirname: "video2",
                durationSec: 3000,
                resolution: "1920x1080",
                staging: {
                  toAdd: true,
                },
              },
              {
                r2TrackDirname: "video3",
                durationSec: 4000,
                resolution: "1280x720",
                committed: true,
                staging: {
                  toDelete: true,
                },
              },
            ],
            audios: [
              {
                r2TrackDirname: "audio1",
                committed: {
                  name: "English",
                  isDefault: true,
                },
              },
              {
                r2TrackDirname: "audio2",
                committed: {
                  name: "English - US",
                  isDefault: false,
                },
              },
              {
                r2TrackDirname: "audio3",
                staging: {
                  toAdd: {
                    name: "Spanish",
                    isDefault: false,
                  },
                },
              },
              {
                r2TrackDirname: "audio4",
                staging: {
                  toAdd: {
                    name: "Spanish - Latin America",
                    isDefault: false,
                  },
                },
              },
              {
                r2TrackDirname: "audio5",
                committed: {
                  name: "German",
                  isDefault: true,
                },
                staging: {
                  toAdd: {
                    name: "Italian",
                    isDefault: false,
                  },
                },
              },
              {
                r2TrackDirname: "audio6",
                committed: {
                  name: "German - Switzerland",
                  isDefault: true,
                },
                staging: {
                  toAdd: {
                    name: "Italian - Switzerland",
                    isDefault: false,
                  },
                },
              },
              {
                r2TrackDirname: "audio7",
                committed: {
                  name: "French",
                  isDefault: true,
                },
                staging: {
                  toDelete: true,
                },
              },
            ],
            subtitles: [
              {
                r2TrackDirname: "subtitle1",
                committed: {
                  name: "English",
                },
              },
              {
                r2TrackDirname: "subtitle2",
                committed: {
                  name: "English - US",
                },
              },
              {
                r2TrackDirname: "subtitle3",
                staging: {
                  toAdd: {
                    name: "Spanish",
                  },
                },
              },
              {
                r2TrackDirname: "subtitle4",
                staging: {
                  toAdd: {
                    name: "Spanish - Latin America",
                  },
                },
              },
              {
                r2TrackDirname: "subtitle5",
                committed: {
                  name: "German",
                },
                staging: {
                  toAdd: {
                    name: "Italian",
                  },
                },
              },
              {
                r2TrackDirname: "subtitle6",
                committed: {
                  name: "German - Switzerland",
                },
                staging: {
                  toAdd: {
                    name: "Italian - Switzerland",
                  },
                },
              },
              {
                r2TrackDirname: "subtitle7",
                committed: {
                  name: "French",
                },
                staging: {
                  toDelete: true,
                },
              },
            ],
          },
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_tracks_page_tablet.png"),
          path.join(__dirname, "/golden/update_tracks_page_tablet.png"),
          path.join(__dirname, "/update_tracks_page_tablet_diff.png"),
          { fullPage: true },
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_tracks_page_phone.png"),
          path.join(__dirname, "/golden/update_tracks_page_phone.png"),
          path.join(__dirname, "/update_tracks_page_phone_diff.png"),
          { fullPage: true },
        );

        // Execute
        await setDesktopView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_tracks_page_desktop.png"),
          path.join(__dirname, "/golden/update_tracks_page_desktop.png"),
          path.join(__dirname, "/update_tracks_page_desktop_diff.png"),
          { fullPage: true },
        );

        // Execute
        this.cut.videoTrackEditors[0].deleteTrackButton.val.click();
        this.cut.videoTrackEditors[1].dropStagingButton.val.click();
        this.cut.videoTrackEditors[2].dropStagingButton.val.click();

        this.cut.audioTrackEditors[0].deleteTrackButton.val.click();
        this.cut.audioTrackEditors[1].editTrackButton.val.click();
        this.cut.audioTrackEditors[2].nameInput.val.value = Array.from({
          length: 200,
        })
          .fill("a")
          .join("");
        this.cut.audioTrackEditors[2].nameInput.val.dispatchEvent(
          new Event("input"),
        );
        this.cut.audioTrackEditors[2].isDefaultToggleButton.val.click();
        this.cut.audioTrackEditors[3].dropStagingButton.val.click();
        this.cut.audioTrackEditors[4].nameInput.val.value = " Italian - 2 ";
        this.cut.audioTrackEditors[4].nameInput.val.dispatchEvent(
          new Event("input"),
        );
        this.cut.audioTrackEditors[4].isDefaultToggleButton.val.click();
        this.cut.audioTrackEditors[5].dropStagingButton.val.click();
        this.cut.audioTrackEditors[6].dropStagingButton.val.click();

        this.cut.subtitleTrackEditors[0].deleteTrackButton.val.click();
        this.cut.subtitleTrackEditors[1].editTrackButton.val.click();
        this.cut.subtitleTrackEditors[2].nameInput.val.value = Array.from({
          length: 200,
        })
          .fill("b")
          .join("");
        this.cut.subtitleTrackEditors[2].nameInput.val.dispatchEvent(
          new Event("input"),
        );
        this.cut.subtitleTrackEditors[3].dropStagingButton.val.click();
        this.cut.subtitleTrackEditors[4].nameInput.val.value = " Italian - 3 ";
        this.cut.subtitleTrackEditors[4].nameInput.val.dispatchEvent(
          new Event("input"),
        );
        this.cut.subtitleTrackEditors[5].dropStagingButton.val.click();
        this.cut.subtitleTrackEditors[6].dropStagingButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_tracks_page_desktop_modifying.png"),
          path.join(
            __dirname,
            "/golden/update_tracks_page_desktop_modifying.png",
          ),
          path.join(
            __dirname,
            "/update_tracks_page_desktop_modifying_diff.png",
          ),
          { fullPage: true },
        );

        // Prepare
        let expectedVideoContainer: VideoContainerStagingData = {
          videos: [
            {
              r2TrackDirname: "video1",
              staging: {
                toDelete: true,
              },
            },
            {
              r2TrackDirname: "video2",
            },
            {
              r2TrackDirname: "video3",
            },
          ],
          audios: [
            {
              r2TrackDirname: "audio1",
              staging: {
                toDelete: true,
              },
            },
            {
              r2TrackDirname: "audio2",
              staging: {
                toAdd: {
                  name: "English - US",
                  isDefault: false,
                },
              },
            },
            {
              r2TrackDirname: "audio3",
              staging: {
                toAdd: {
                  name: Array.from({ length: 100 }).fill("a").join(""),
                  isDefault: true,
                },
              },
            },
            {
              r2TrackDirname: "audio4",
            },
            {
              r2TrackDirname: "audio5",
              staging: {
                toAdd: {
                  name: "Italian - 2",
                  isDefault: true,
                },
              },
            },
            {
              r2TrackDirname: "audio6",
            },
            {
              r2TrackDirname: "audio7",
            },
          ],
          subtitles: [
            {
              r2TrackDirname: "subtitle1",
              staging: {
                toDelete: true,
              },
            },
            {
              r2TrackDirname: "subtitle2",
              staging: {
                toAdd: {
                  name: "English - US",
                },
              },
            },
            {
              r2TrackDirname: "subtitle3",
              staging: {
                toAdd: {
                  name: Array.from({ length: 100 }).fill("b").join(""),
                },
              },
            },
            {
              r2TrackDirname: "subtitle4",
            },
            {
              r2TrackDirname: "subtitle5",
              staging: {
                toAdd: {
                  name: "Italian - 3",
                },
              },
            },
            {
              r2TrackDirname: "subtitle6",
            },
            {
              r2TrackDirname: "subtitle7",
            },
          ],
        };

        // Execute
        this.cut.saveStagingButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("saved", resolve));

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(SAVE_EPISODE_STAGING_DATA),
          "Save RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "episode1",
              videoContainer: expectedVideoContainer,
            },
            SAVE_EPISODE_STAGING_DATA_REQUEST_BODY,
          ),
          "Save RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_tracks_page_desktop_saved.png"),
          path.join(
            __dirname,
            "/golden/update_tracks_page_desktop_modifying.png",
          ),
          path.join(__dirname, "/update_tracks_page_desktop_saved_diff.png"),
          { fullPage: true },
        );

        // Execute
        this.cut.commitStagingButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("committed", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.request.descriptor,
          eq(COMMIT_EPISODE_STAGING_DATA),
          "Commit RC",
        );
        assertThat(
          serviceClientMock.request.body,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "episode1",
              videoContainer: expectedVideoContainer,
            },
            COMMIT_EPISODE_STAGING_DATA_REQUEST_BODY,
          ),
          "Commit RC body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_tracks_page_desktop_committed.png"),
          path.join(
            __dirname,
            "/golden/update_tracks_page_desktop_modifying.png",
          ),
          path.join(
            __dirname,
            "/update_tracks_page_desktop_committed_diff.png",
          ),
          { fullPage: true },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new SaveResponseErrorTestCase(
      "TrackMismatchError",
      ValidationError.TRACK_MISMATCH,
      path.join(__dirname, "/update_tracks_page_tablet_track_mismatch.png"),
      path.join(
        __dirname,
        "/golden/update_tracks_page_tablet_track_mismatch.png",
      ),
      path.join(
        __dirname,
        "/update_tracks_page_tablet_track_mismatch_diff.png",
      ),
    ),
    new SaveResponseErrorTestCase(
      "NoVideoTrackError",
      ValidationError.NO_VIDEO_TRACK,
      path.join(__dirname, "/update_tracks_page_tablet_no_video_track.png"),
      path.join(
        __dirname,
        "/golden/update_tracks_page_tablet_no_video_track.png",
      ),
      path.join(
        __dirname,
        "/update_tracks_page_tablet_no_video_track_diff.png",
      ),
    ),
    new SaveResponseErrorTestCase(
      "MoreThanOneVideoTracksError",
      ValidationError.MORE_THAN_ONE_VIDEO_TRACKS,
      path.join(
        __dirname,
        "/update_tracks_page_tablet_more_than_one_video_tracks.png",
      ),
      path.join(
        __dirname,
        "/golden/update_tracks_page_tablet_more_than_one_video_tracks.png",
      ),
      path.join(
        __dirname,
        "/update_tracks_page_tablet_more_than_one_video_tracks_diff.png",
      ),
    ),
    new SaveResponseErrorTestCase(
      "TooManyAudioTracksError",
      ValidationError.TOO_MANY_AUDIO_TRACKS,
      path.join(
        __dirname,
        "/update_tracks_page_tablet_too_many_audio_tracks.png",
      ),
      path.join(
        __dirname,
        "/golden/update_tracks_page_tablet_too_many_audio_tracks.png",
      ),
      path.join(
        __dirname,
        "/update_tracks_page_tablet_too_many_audio_tracks_diff.png",
      ),
    ),
    new SaveResponseErrorTestCase(
      "NoDefaultAudioTrackError",
      ValidationError.NO_DEFAULT_AUDIO_TRACK,
      path.join(
        __dirname,
        "/update_tracks_page_tablet_no_default_audio_track.png",
      ),
      path.join(
        __dirname,
        "/golden/update_tracks_page_tablet_no_default_audio_track.png",
      ),
      path.join(
        __dirname,
        "/update_tracks_page_tablet_no_default_audio_track_diff.png",
      ),
    ),
    new SaveResponseErrorTestCase(
      "MoreThanOneDefaultAudioTracksError",
      ValidationError.MORE_THAN_ONE_DEFAULT_AUDIO_TRACKS,
      path.join(
        __dirname,
        "/update_tracks_page_tablet_more_than_one_default_audio_tracks.png",
      ),
      path.join(
        __dirname,
        "/golden/update_tracks_page_tablet_more_than_one_default_audio_tracks.png",
      ),
      path.join(
        __dirname,
        "/update_tracks_page_tablet_more_than_one_default_audio_tracks_diff.png",
      ),
    ),
    new SaveResponseErrorTestCase(
      "TooManySubtitleTracksError",
      ValidationError.TOO_MANY_SUBTITLE_TRACKS,
      path.join(
        __dirname,
        "/update_tracks_page_tablet_too_many_subtitle_tracks.png",
      ),
      path.join(
        __dirname,
        "/golden/update_tracks_page_tablet_too_many_subtitle_tracks.png",
      ),
      path.join(
        __dirname,
        "/update_tracks_page_tablet_too_many_subtitle_tracks_diff.png",
      ),
    ),
    new (class implements TestCase {
      public name =
        "NoStaging_VideoStaging_AudioStaging_SubtitleStaging_SaveFailed_SaveSuccess_CommitFailed_CommitSuccess";
      private cut: UpdateTracksPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        this.cut = new UpdateTracksPage(
          serviceClientMock,
          "season1",
          "episode1",
          {
            videos: [
              {
                r2TrackDirname: "video1",
                durationSec: 3600,
                resolution: "1920x1080",
                committed: true,
              },
            ],
            audios: [
              {
                r2TrackDirname: "audio1",
                committed: {
                  name: "English",
                  isDefault: true,
                },
              },
            ],
            subtitles: [
              {
                r2TrackDirname: "subtitle1",
                committed: {
                  name: "English",
                },
              },
            ],
          },
        );

        // Execute
        document.body.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_tracks_page_no_staging.png"),
          path.join(__dirname, "/golden/update_tracks_page_no_staging.png"),
          path.join(__dirname, "/update_tracks_page_no_staging_diff.png"),
          { fullPage: true },
        );

        // Execute
        this.cut.videoTrackEditors[0].deleteTrackButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_tracks_page_video_staging.png"),
          path.join(__dirname, "/golden/update_tracks_page_video_staging.png"),
          path.join(__dirname, "/update_tracks_page_video_staging_diff.png"),
          { fullPage: true },
        );

        // Execute
        this.cut.videoTrackEditors[0].dropStagingButton.val.click();
        this.cut.audioTrackEditors[0].deleteTrackButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_tracks_page_audio_staging.png"),
          path.join(__dirname, "/golden/update_tracks_page_audio_staging.png"),
          path.join(__dirname, "/update_tracks_page_audio_staging_diff.png"),
          { fullPage: true },
        );

        // Execute
        this.cut.audioTrackEditors[0].dropStagingButton.val.click();
        this.cut.subtitleTrackEditors[0].deleteTrackButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_tracks_page_subtitle_staging.png"),
          path.join(
            __dirname,
            "/golden/update_tracks_page_subtitle_staging.png",
          ),
          path.join(__dirname, "/update_tracks_page_subtitle_staging_diff.png"),
          { fullPage: true },
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.saveStagingButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("saved", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_tracks_page_save_failed.png"),
          path.join(__dirname, "/golden/update_tracks_page_save_failed.png"),
          path.join(__dirname, "/update_tracks_page_save_failed_diff.png"),
          { fullPage: true },
        );

        // Prepare
        serviceClientMock.error = undefined;
        serviceClientMock.response = {};

        // Execute
        this.cut.saveStagingButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("saved", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_tracks_page_save_success.png"),
          path.join(__dirname, "/golden/update_tracks_page_save_success.png"),
          path.join(__dirname, "/update_tracks_page_save_success_diff.png"),
          { fullPage: true },
        );

        // Prepare
        serviceClientMock.error = new Error("Fake error");

        // Execute
        this.cut.commitStagingButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("committed", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_tracks_page_commit_failed.png"),
          path.join(__dirname, "/golden/update_tracks_page_commit_failed.png"),
          path.join(__dirname, "/update_tracks_page_commit_failed_diff.png"),
          { fullPage: true },
        );

        // Prepare
        serviceClientMock.error = undefined;
        serviceClientMock.response = {};

        // Execute
        this.cut.commitStagingButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("committed", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/update_tracks_page_commit_success.png"),
          path.join(__dirname, "/golden/update_tracks_page_save_success.png"),
          path.join(__dirname, "/update_tracks_page_commit_success_diff.png"),
          { fullPage: true },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
