import "../../../../dev/env";
import video = require("../common/test_data/two_audios_two_subs.m3u8");
import path = require("path");
import { normalizeBody } from "../../../../common/normalize_body";
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../../common/view_port";
import { InfoPage } from "./body";
import { EpisodeState } from "@phading/product_service_interface/show/episode_state";
import { SeasonState } from "@phading/product_service_interface/show/season_state";
import { EpisodeDetails } from "@phading/product_service_interface/show/web/publisher/details";
import { GetEpisodeResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { ProcessingFailureReason } from "@phading/video_service_interface/node/last_processing_failure";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

TEST_RUNNER.run({
  name: "EpisodeDetailsInfoPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "TabletView_InitialDraft_DesktopView_PhoneView_Back_EditName_Upload_EditDraftState";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: GetEpisodeResponse = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            seasonState: SeasonState.DRAFT,
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.DRAFT,
            videoContainer: {
              masterPlaylist: {
                synced: {
                  version: 0,
                },
              },
              videos: [],
              audios: [],
              subtitles: [],
            },
          },
        };
        serviceClientMock.response = response;
        this.cut = new InfoPage(
          {} as any,
          serviceClientMock,
          () => new Date("2023-10-01T00:00:00Z"),
          "season1",
          "episode1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_draft.png"),
          path.join(__dirname, "/golden/info_page_tablet_draft.png"),
          path.join(__dirname, "/info_page_tablet_draft_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        await setDesktopView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_desktop_draft.png"),
          path.join(__dirname, "/golden/info_page_desktop_draft.png"),
          path.join(__dirname, "/info_page_desktop_draft_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_phone_draft.png"),
          path.join(__dirname, "/golden/info_page_phone_draft.png"),
          path.join(__dirname, "/info_page_phone_draft_diff.png"),
          {
            fullPage: true,
          },
        );

        // Prepare
        let goBack = false;
        this.cut.on("back", () => (goBack = true));

        // Execute
        this.cut.backButton.val.click();

        // Verify
        assertThat(goBack, eq(true), "back");

        // Prepare
        let editEpisode: EpisodeDetails;
        this.cut.on("editName", (episode) => (editEpisode = episode));

        // Execute
        this.cut.editNameButton.val.click();

        // Verify
        assertThat(
          editEpisode.episodeName,
          eq("The End of the Beginning and the Beginning of the End"),
          "editEpisode.episodeName",
        );

        // Prepare
        let upload: EpisodeDetails;
        this.cut.on("upload", (episode) => (upload = episode));

        // Execute
        this.cut.uploadButton.val.click();

        // Verify
        assertThat(
          upload.episodeName,
          eq("The End of the Beginning and the Beginning of the End"),
          "upload.episodeName",
        );

        // Prepare
        let editDraftState: EpisodeDetails;
        this.cut.on("editDraftState", (episode) => (editDraftState = episode));

        // Execute
        this.cut.editDraftStateButton.val.click();

        // Verify
        assertThat(
          editDraftState.episodeName,
          eq("The End of the Beginning and the Beginning of the End"),
          "editDraftState.episodeName",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_MediaUploading_ResumeUploading";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: GetEpisodeResponse = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            seasonState: SeasonState.DRAFT,
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.DRAFT,
            videoContainer: {
              masterPlaylist: {
                synced: {
                  version: 0,
                },
              },
              processing: {
                uploading: {},
              },
              videos: [],
              audios: [],
              subtitles: [],
            },
          },
        };
        serviceClientMock.response = response;
        this.cut = new InfoPage(
          {} as any,
          serviceClientMock,
          () => new Date("2023-10-01T00:00:00Z"),
          "season1",
          "episode1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_draft_uploading.png"),
          path.join(__dirname, "/golden/info_page_tablet_draft_uploading.png"),
          path.join(__dirname, "/info_page_tablet_draft_uploading_diff.png"),
          {
            fullPage: true,
          },
        );

        // Prepare
        let upload: EpisodeDetails;
        this.cut.on("upload", (episode) => (upload = episode));

        // Execute
        this.cut.uploadButton.val.click();

        // Verify
        assertThat(
          upload.episodeName,
          eq("The End of the Beginning and the Beginning of the End"),
          "upload.episodeName",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_MediaFormatting_RefreshProcessing";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: GetEpisodeResponse = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            seasonState: SeasonState.DRAFT,
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.DRAFT,
            videoContainer: {
              masterPlaylist: {
                synced: {
                  version: 0,
                },
              },
              processing: {
                mediaFormatting: {},
              },
              videos: [],
              audios: [],
              subtitles: [],
            },
          },
        };
        serviceClientMock.response = response;
        let reloaded = false;
        this.cut = new InfoPage(
          {
            location: {
              reload: () => {
                reloaded = true;
              },
            },
          } as any,
          serviceClientMock,
          () => new Date("2023-10-01T00:00:00Z"),
          "season1",
          "episode1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_draft_formatting.png"),
          path.join(__dirname, "/golden/info_page_tablet_draft_formatting.png"),
          path.join(__dirname, "/info_page_tablet_draft_formatting_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        this.cut.refreshProcessingButton.val.click();

        // Verify
        assertThat(reloaded, eq(true), "reloaded");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_SubtitleFormatting";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: GetEpisodeResponse = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            seasonState: SeasonState.DRAFT,
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.DRAFT,
            videoContainer: {
              masterPlaylist: {
                synced: {
                  version: 0,
                },
              },
              processing: {
                subtitleFormatting: {},
              },
              videos: [],
              audios: [],
              subtitles: [],
            },
          },
        };
        serviceClientMock.response = response;
        this.cut = new InfoPage(
          {} as any,
          serviceClientMock,
          () => new Date("2023-10-01T00:00:00Z"),
          "season1",
          "episode1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/info_page_tablet_draft_formatting_subtitle.png",
          ),
          path.join(__dirname, "/golden/info_page_tablet_draft_formatting.png"),
          path.join(
            __dirname,
            "/info_page_tablet_draft_formatting_subtitle_diff.png",
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
    new (class implements TestCase {
      public name = "TabletView_ProcessingFailure";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: GetEpisodeResponse = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            seasonState: SeasonState.DRAFT,
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.DRAFT,
            videoContainer: {
              masterPlaylist: {
                synced: {
                  version: 0,
                },
              },
              lastProcessingFailure: {
                reasons: [
                  ProcessingFailureReason.MEDIA_FORMAT_FAILURE,
                  ProcessingFailureReason.MEDIA_FORMAT_INVALID,
                  ProcessingFailureReason.AUDIO_CODEC_REQUIRES_AAC,
                  ProcessingFailureReason.VIDEO_CODEC_REQUIRES_H264,
                  ProcessingFailureReason.SUBTITLE_ZIP_FORMAT_INVALID,
                ],
                timeMs: new Date("2023-09-30T20:00:00Z").getTime(),
              },
              videos: [],
              audios: [],
              subtitles: [],
            },
          },
        };
        serviceClientMock.response = response;
        this.cut = new InfoPage(
          {} as any,
          serviceClientMock,
          () => new Date("2023-10-01T00:00:00Z"),
          "season1",
          "episode1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/info_page_tablet_draft_processing_failures.png",
          ),
          path.join(
            __dirname,
            "/golden/info_page_tablet_draft_processing_failures.png",
          ),
          path.join(
            __dirname,
            "/info_page_tablet_draft_processing_failures_diff.png",
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
    new (class implements TestCase {
      public name =
        "TabletView_DraftWithPendingTracksWithOutdatedFailures_CommitVideo_EditVideoTrack_EditAudioTrack_EditSubtitleTrack";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: GetEpisodeResponse = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            seasonState: SeasonState.DRAFT,
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.DRAFT,
            videoContainer: {
              masterPlaylist: {
                synced: {
                  version: 0,
                },
              },
              lastProcessingFailure: {
                reasons: [ProcessingFailureReason.AUDIO_CODEC_REQUIRES_AAC],
                timeMs: new Date("2023-09-30T12:00:00Z").getTime(),
              },
              videos: [
                {
                  durationSec: 3600,
                  resolution: "1920x1080",
                  totalBytes: 123,
                  staging: {
                    toAdd: true,
                  },
                },
              ],
              audios: [
                {
                  totalBytes: 223,
                  staging: {
                    toAdd: {
                      name: "English",
                      isDefault: true,
                    },
                  },
                },
              ],
              subtitles: [
                {
                  totalBytes: 334,
                  staging: {
                    toAdd: {
                      name: "English",
                    },
                  },
                },
              ],
            },
          },
        };
        serviceClientMock.response = response;
        this.cut = new InfoPage(
          {} as any,
          serviceClientMock,
          () => new Date("2023-10-01T00:00:00Z"),
          "season1",
          "episode1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_draft_pending_tracks.png"),
          path.join(
            __dirname,
            "/golden/info_page_tablet_draft_pending_tracks.png",
          ),
          path.join(
            __dirname,
            "/info_page_tablet_draft_pending_tracks_diff.png",
          ),
          {
            fullPage: true,
          },
        );

        // Prepare
        let editTracks: EpisodeDetails;
        this.cut.on("editTracks", (episode) => (editTracks = episode));

        // Execute
        this.cut.editTracksButton.val.click();

        // Verify
        assertThat(
          editTracks.episodeName,
          eq("The End of the Beginning and the Beginning of the End"),
          "editTracks.episodeName",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_CommittingFirstVersion_RefreshVideoContainer";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: GetEpisodeResponse = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            seasonState: SeasonState.DRAFT,
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.DRAFT,
            premiereTimeMs: new Date("2023-10-01T00:00:00Z").getTime(),
            videoContainer: {
              masterPlaylist: {
                committing: {
                  version: 1,
                },
              },
              videos: [
                {
                  durationSec: 3600,
                  resolution: "1920x1080",
                  totalBytes: 12345,
                  committed: true,
                },
              ],
              audios: [
                {
                  totalBytes: 22345,
                  committed: {
                    name: "English",
                    isDefault: true,
                  },
                },
              ],
              subtitles: [
                {
                  totalBytes: 32345,
                  committed: {
                    name: "English",
                  },
                },
              ],
            },
          },
        };
        serviceClientMock.response = response;
        let reloaded = false;
        this.cut = new InfoPage(
          {
            location: {
              reload: () => {
                reloaded = true;
              },
            },
          } as any,
          serviceClientMock,
          () => new Date("2023-10-01T00:00:00Z"),
          "season1",
          "episode1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_draft_committing.png"),
          path.join(__dirname, "/golden/info_page_tablet_draft_committing.png"),
          path.join(__dirname, "/info_page_tablet_draft_committing_diff.png"),
          {
            fullPage: true,
          },
        );

        // Execute
        this.cut.refreshVideoContainerButton.val.click();

        // Verify
        assertThat(reloaded, eq(true), "reloaded");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_CommittingFirstVersionWithPendingTracks";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: GetEpisodeResponse = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            seasonState: SeasonState.DRAFT,
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.DRAFT,
            premiereTimeMs: new Date("2023-10-01T00:00:00Z").getTime(),
            videoContainer: {
              masterPlaylist: {
                committing: {
                  version: 1,
                },
              },
              videos: [
                {
                  durationSec: 3600,
                  resolution: "1920x1080",
                  totalBytes: 12345,
                  committed: true,
                  staging: {
                    toDelete: true,
                  },
                },
              ],
              audios: [
                {
                  totalBytes: 22345,
                  committed: {
                    name: "English",
                    isDefault: true,
                  },
                  staging: {
                    toDelete: true,
                  },
                },
              ],
              subtitles: [
                {
                  totalBytes: 32345,
                  committed: {
                    name: "English",
                  },
                  staging: {
                    toDelete: true,
                  },
                },
              ],
            },
          },
        };
        serviceClientMock.response = response;
        this.cut = new InfoPage(
          {} as any,
          serviceClientMock,
          () => new Date("2023-10-01T00:00:00Z"),
          "season1",
          "episode1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/info_page_tablet_draft_committing_with_pending_tracks.png",
          ),
          path.join(
            __dirname,
            "/golden/info_page_tablet_draft_committing_with_pending_tracks.png",
          ),
          path.join(
            __dirname,
            "/info_page_tablet_draft_committing_with_pending_tracks_diff.png",
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
    new (class implements TestCase {
      public name = "TabletView_CommittedFirstVersion_DesktopView_PhoneView";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: GetEpisodeResponse = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            seasonState: SeasonState.DRAFT,
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.DRAFT,
            videoContainerCached: {
              version: 1,
            },
            videoUrl: video,
            videoContainer: {
              masterPlaylist: {
                synced: {
                  version: 1,
                },
              },
              videos: [
                {
                  durationSec: 3600,
                  resolution: "1920x1080",
                  totalBytes: 1234500,
                  committed: true,
                },
              ],
              audios: [
                {
                  totalBytes: 2234500,
                  committed: {
                    name: "English",
                    isDefault: true,
                  },
                },
              ],
              subtitles: [
                {
                  totalBytes: 3234500,
                  committed: {
                    name: "English",
                  },
                },
              ],
            },
          },
        };
        serviceClientMock.response = response;
        this.cut = new InfoPage(
          {} as any,
          serviceClientMock,
          () => new Date("2023-10-01T00:00:00Z"),
          "season1",
          "episode1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_committed.png"),
          path.join(__dirname, "/golden/info_page_tablet_committed.png"),
          path.join(__dirname, "/info_page_tablet_committed_diff.png"),
          {
            fullPage: true,
            excludedAreas: [
              {
                x: 310,
                y: 330,
                width: 100,
                height: 100,
              },
            ],
          },
        );

        // Execute
        await setDesktopView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_desktop_committed.png"),
          path.join(__dirname, "/golden/info_page_desktop_committed.png"),
          path.join(__dirname, "/info_page_desktop_committed_diff.png"),
          {
            fullPage: true,
            excludedAreas: [
              {
                x: 560,
                y: 360,
                width: 100,
                height: 100,
              },
            ],
          },
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_phone_committed.png"),
          path.join(__dirname, "/golden/info_page_phone_committed.png"),
          path.join(__dirname, "/info_page_phone_committed_diff.png"),
          {
            fullPage: true,
          },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "TabletView_SeasonDraftEpisodePublishedButCannotPlay_EditIndex_EditPublishedState";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: GetEpisodeResponse = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            seasonState: SeasonState.DRAFT,
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.PUBLISHED,
            premiereTimeMs: new Date("2023-10-01T00:00:00Z").getTime(),
            canPlay: false,
            episodeIndex: 1,
            totalPublishedEpisodes: 12,
            videoContainerCached: {
              version: 1,
            },
            videoUrl: video,
            videoContainer: {
              masterPlaylist: {
                synced: {
                  version: 1,
                },
              },
              videos: [
                {
                  durationSec: 3600,
                  resolution: "1920x1080",
                  totalBytes: 12345,
                  committed: true,
                },
              ],
              audios: [
                {
                  totalBytes: 22345,
                  committed: {
                    name: "English",
                    isDefault: true,
                  },
                },
              ],
              subtitles: [
                {
                  totalBytes: 32345,
                  committed: {
                    name: "English",
                  },
                },
              ],
            },
          },
        };
        serviceClientMock.response = response;
        this.cut = new InfoPage(
          {} as any,
          serviceClientMock,
          () => new Date("2023-10-01T00:00:00Z"),
          "season1",
          "episode1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_ready_premieres.png"),
          path.join(__dirname, "/golden/info_page_tablet_ready_premieres.png"),
          path.join(__dirname, "/info_page_tablet_ready_premieres_diff.png"),
          {
            fullPage: true,
            excludedAreas: [
              {
                x: 310,
                y: 425,
                width: 100,
                height: 100,
              },
            ],
          },
        );

        // Prepare
        let editIndex: EpisodeDetails;
        this.cut.on("editIndex", (episode) => (editIndex = episode));

        // Execute
        this.cut.editIndexButton.val.click();

        // Verify
        assertThat(editIndex.episodeIndex, eq(1), "editIndex.episodeIndex");

        // Prepare
        let editPublishedState: EpisodeDetails;
        this.cut.on(
          "editPublishedState",
          (episode) => (editPublishedState = episode),
        );

        // Execute
        this.cut.editPublishedStateButton.val.click();

        // Verify
        assertThat(
          editPublishedState.episodeName,
          eq("The End of the Beginning and the Beginning of the End"),
          "editPublishedState.episodeName",
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "TabletView_SeasonAndEpisodePublishedAndCanPlayAndPendingTracks";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        let response: GetEpisodeResponse = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            seasonState: SeasonState.PUBLISHED,
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.PUBLISHED,
            premiereTimeMs: new Date("2023-10-01T00:00:00Z").getTime(),
            canPlay: true,
            episodeIndex: 1,
            totalPublishedEpisodes: 12,
            videoContainerCached: {
              version: 1,
            },
            videoUrl: video,
            videoContainer: {
              masterPlaylist: {
                synced: {
                  version: 1,
                },
              },
              videos: [
                {
                  durationSec: 3600,
                  resolution: "1920x1080",
                  totalBytes: 123450000,
                  committed: true,
                  staging: {
                    toDelete: true,
                  },
                },
                {
                  durationSec: 7000,
                  resolution: "1280x720",
                  totalBytes: 223450000,
                  staging: {
                    toAdd: true,
                  },
                },
              ],
              audios: [
                {
                  totalBytes: 323450000,
                  committed: {
                    name: "English",
                    isDefault: true,
                  },
                  staging: {
                    toAdd: {
                      name: "French",
                      isDefault: false,
                    },
                  },
                },
                {
                  totalBytes: 434560000,
                  staging: {
                    toAdd: {
                      name: "Chinese",
                      isDefault: true,
                    },
                  },
                },
              ],
              subtitles: [
                {
                  totalBytes: 523450000,
                  committed: {
                    name: "English",
                  },
                  staging: {
                    toAdd: {
                      name: "French",
                    },
                  },
                },
                {
                  totalBytes: 645670000,
                  staging: {
                    toAdd: {
                      name: "Chinese",
                    },
                  },
                },
              ],
            },
          },
        };
        serviceClientMock.response = response;
        this.cut = new InfoPage(
          {} as any,
          serviceClientMock,
          () => new Date("2023-10-01T00:00:00Z"),
          "season1",
          "episode1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/info_page_tablet_published_premiered_pending_tracks.png",
          ),
          path.join(
            __dirname,
            "/golden/info_page_tablet_published_premiered_pending_tracks.png",
          ),
          path.join(
            __dirname,
            "/info_page_tablet_published_premiered_pending_tracks_diff.png",
          ),
          {
            fullPage: true,
            excludedAreas: [
              {
                x: 310,
                y: 425,
                width: 100,
                height: 100,
              },
            ],
          },
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
