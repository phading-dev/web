import path = require("path");
import { normalizeBody } from "../../../../../common/normalize_body";
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../../../common/view_port";
import { InfoPage } from "./body";
import { EpisodeState } from "@phading/product_service_interface/show/episode_state";
import { EpisodeDetails } from "@phading/product_service_interface/show/web/publisher/details";
import { GetEpisodeResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { ProcessingFailureReason } from "@phading/video_service_interface/node/last_processing_failure";
import {
  AudioTrack,
  SubtitleTrack,
  VideoTrack,
} from "@phading/video_service_interface/node/video_container";
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
        "TabletView_InitialDraft_DesktopView_PhoneView_Back_EditName_Upload";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
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
        } as GetEpisodeResponse;
        this.cut = new InfoPage(serviceClientMock, "season1", "episode1", () =>
          new Date("2023-10-01T00:00:00Z").getTime(),
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
        );

        // Execute
        await setDesktopView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_desktop_draft.png"),
          path.join(__dirname, "/golden/info_page_desktop_draft.png"),
          path.join(__dirname, "/info_page_desktop_draft_diff.png"),
        );

        // Execute
        await setPhoneView();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_phone_draft.png"),
          path.join(__dirname, "/golden/info_page_phone_draft.png"),
          path.join(__dirname, "/info_page_phone_draft_diff.png"),
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
        this.cut.episodeNameButton.val.click();

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
        this.cut.episodeUploadButton.val.click();

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
      public name = "TabletView_MediaUploading_ResumeUploading";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
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
                media: {
                  uploading: {},
                },
              },
              videos: [],
              audios: [],
              subtitles: [],
            },
          },
        } as GetEpisodeResponse;
        this.cut = new InfoPage(serviceClientMock, "season1", "episode1", () =>
          new Date("2023-10-01T00:00:00Z").getTime(),
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
        );

        // Prepare
        let upload: EpisodeDetails;
        this.cut.on("upload", (episode) => (upload = episode));

        // Execute
        this.cut.episodeUploadButton.val.click();

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
      public name = "TabletView_SubtitleUploading";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
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
                subtitle: {
                  uploading: {},
                },
              },
              videos: [],
              audios: [],
              subtitles: [],
            },
          },
        } as GetEpisodeResponse;
        this.cut = new InfoPage(serviceClientMock, "season1", "episode1", () =>
          new Date("2023-10-01T00:00:00Z").getTime(),
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
            "/info_page_tablet_draft_uploading_subtitle.png",
          ),
          path.join(__dirname, "/golden/info_page_tablet_draft_uploading.png"),
          path.join(
            __dirname,
            "/info_page_tablet_draft_uploading_subtitle_diff.png",
          ),
        );

        // Prepare
        let upload: EpisodeDetails;
        this.cut.on("upload", (episode) => (upload = episode));

        // Execute
        this.cut.episodeUploadButton.val.click();

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
      public name = "TabletView_MediaFormatting";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
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
                media: {
                  formatting: {},
                },
              },
              videos: [],
              audios: [],
              subtitles: [],
            },
          },
        } as GetEpisodeResponse;
        this.cut = new InfoPage(serviceClientMock, "season1", "episode1", () =>
          new Date("2023-10-01T00:00:00Z").getTime(),
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
        );
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
        serviceClientMock.response = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
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
                subtitle: {
                  formatting: {},
                },
              },
              videos: [],
              audios: [],
              subtitles: [],
            },
          },
        } as GetEpisodeResponse;
        this.cut = new InfoPage(serviceClientMock, "season1", "episode1", () =>
          new Date("2023-10-01T00:00:00Z").getTime(),
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
        serviceClientMock.response = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
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
        } as GetEpisodeResponse;
        this.cut = new InfoPage(serviceClientMock, "season1", "episode1", () =>
          new Date("2023-10-01T00:00:00Z").getTime(),
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
        serviceClientMock.response = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
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
                  totalBytes: 12345,
                  staging: {
                    toAdd: true,
                  },
                },
              ],
              audios: [
                {
                  totalBytes: 22345,
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
                  totalBytes: 32345,
                  staging: {
                    toAdd: {
                      name: "English",
                    },
                  },
                },
              ],
            },
          },
        } as GetEpisodeResponse;
        this.cut = new InfoPage(serviceClientMock, "season1", "episode1", () =>
          new Date("2023-10-01T00:00:00Z").getTime(),
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
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/info_page_tablet_draft_pending_tracks_scrolled.png",
          ),
          path.join(
            __dirname,
            "/golden/info_page_tablet_draft_pending_tracks_scrolled.png",
          ),
          path.join(
            __dirname,
            "/info_page_tablet_draft_pending_tracks_scrolled_diff.png",
          ),
        );

        // Prepare
        let commitVideo: EpisodeDetails;
        this.cut.on("commitVideo", (episode) => (commitVideo = episode));

        // Execute
        this.cut.episodeVideoCommitButton.val.click();

        // Verify
        assertThat(
          commitVideo.episodeName,
          eq("The End of the Beginning and the Beginning of the End"),
          "editDraftState.episodeName",
        );

        // Prepare
        let editVideoTrack: VideoTrack;
        this.cut.on(
          "editVideoTrack",
          (videoTrack) => (editVideoTrack = videoTrack),
        );

        // Execute
        this.cut.videoTrackButtons[0].click();

        // Verify
        assertThat(
          editVideoTrack.resolution,
          eq("1920x1080"),
          "editVideoTrack.resolution",
        );

        // Prepare
        let editAudioTrack: AudioTrack;
        this.cut.on(
          "editAudioTrack",
          (audioTrack) => (editAudioTrack = audioTrack),
        );

        // Execute
        this.cut.audioTrackButtons[0].click();

        // Verify
        assertThat(
          editAudioTrack.totalBytes,
          eq(22345),
          "editAudioTrack.totalBytes",
        );

        // Prepare
        let editSubtitleTrack: SubtitleTrack;
        this.cut.on(
          "editSubtitleTrack",
          (subtitleTrack) => (editSubtitleTrack = subtitleTrack),
        );

        // Execute
        this.cut.subtitleTrackButtons[0].click();

        // Verify
        assertThat(
          editSubtitleTrack.totalBytes,
          eq(32345),
          "editSubtitleTrack.totalBytes",
        );
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_CompilingFirstVersion";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.DRAFT,
            premiereTimeMs: new Date("2023-10-01T00:00:00Z").getTime(),
            videoContainer: {
              masterPlaylist: {
                writingToFile: {
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
        } as GetEpisodeResponse;
        this.cut = new InfoPage(serviceClientMock, "season1", "episode1", () =>
          new Date("2023-10-01T00:00:00Z").getTime(),
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
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TabletView_CompilingFirstVersionWithPendingTracks";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.DRAFT,
            premiereTimeMs: new Date("2023-10-01T00:00:00Z").getTime(),
            videoContainer: {
              masterPlaylist: {
                syncing: {
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
        } as GetEpisodeResponse;
        this.cut = new InfoPage(serviceClientMock, "season1", "episode1", () =>
          new Date("2023-10-01T00:00:00Z").getTime(),
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
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/info_page_tablet_draft_committing_with_pending_tracks_scrolled.png",
          ),
          path.join(
            __dirname,
            "/golden/info_page_tablet_draft_committing_with_pending_tracks_scrolled.png",
          ),
          path.join(
            __dirname,
            "/info_page_tablet_draft_committing_with_pending_tracks_scrolled_diff.png",
          ),
        );
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "TabletView_CompiledFirstVersion_DesktopView_PhoneView_EditDraftState";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.DRAFT,
            videoContainerCached: {
              version: 1,
            },
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
        } as GetEpisodeResponse;
        this.cut = new InfoPage(serviceClientMock, "season1", "episode1", () =>
          new Date("2023-10-01T00:00:00Z").getTime(),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_compiled.png"),
          path.join(__dirname, "/golden/info_page_tablet_compiled.png"),
          path.join(__dirname, "/info_page_tablet_compiled_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_compiled_scrolled.png"),
          path.join(
            __dirname,
            "/golden/info_page_tablet_compiled_scrolled.png",
          ),
          path.join(__dirname, "/info_page_tablet_compiled_scrolled_diff.png"),
        );

        // Execute
        await setDesktopView();
        window.scrollTo(0, 0);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_desktop_compiled.png"),
          path.join(__dirname, "/golden/info_page_desktop_compiled.png"),
          path.join(__dirname, "/info_page_desktop_compiled_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_desktop_compiled_scrolled.png"),
          path.join(
            __dirname,
            "/golden/info_page_desktop_compiled_scrolled.png",
          ),
          path.join(__dirname, "/info_page_desktop_compiled_scrolled_diff.png"),
        );

        // Execute
        await setPhoneView();
        window.scrollTo(0, 0);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_phone_compiled.png"),
          path.join(__dirname, "/golden/info_page_phone_compiled.png"),
          path.join(__dirname, "/info_page_phone_compiled_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_phone_compiled_scrolled.png"),
          path.join(__dirname, "/golden/info_page_phone_compiled_scrolled.png"),
          path.join(__dirname, "/info_page_phone_compiled_scrolled_diff.png"),
        );

        // Prepare
        let editDraftState: EpisodeDetails;
        this.cut.on("editDraftState", (episode) => (editDraftState = episode));

        // Execute
        this.cut.episodeDraftStateButton.val.click();

        // Verify
        assertThat(
          editDraftState.episodeName,
          eq("The End of the Beginning and the Beginning of the End"),
          "editDraftState.episodeName",
        );
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "TabletView_PublishedWithFuturePremiere_EditIndex_EditPublishedState";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.PUBLISHED,
            premiereTimeMs: new Date("2023-10-02T00:00:00Z").getTime(),
            episodeIndex: 1,
            videoContainerCached: {
              version: 1,
            },
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
        } as GetEpisodeResponse;
        this.cut = new InfoPage(serviceClientMock, "season1", "episode1", () =>
          new Date("2023-10-01T00:00:00Z").getTime(),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("loaded", () => resolve()),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/info_page_tablet_published_premieres.png"),
          path.join(
            __dirname,
            "/golden/info_page_tablet_published_premieres.png",
          ),
          path.join(
            __dirname,
            "/info_page_tablet_published_premieres_diff.png",
          ),
        );

        // Prepare
        let editIndex: EpisodeDetails;
        this.cut.on("editIndex", (episode) => (editIndex = episode));

        // Execute
        this.cut.episodeIndexButton.val.click();

        // Verify
        assertThat(editIndex.episodeIndex, eq(1), "editIndex.episodeIndex");

        // Prepare
        let editPublishedState: EpisodeDetails;
        this.cut.on(
          "editPublishedState",
          (episode) => (editPublishedState = episode),
        );

        // Execute
        this.cut.episodePublishedStateButton.val.click();

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
      public name = "TabletView_PublishedWithPastPremiereAndPendingTracks";
      private cut: InfoPage;
      public async execute() {
        // Prepare
        await setTabletView();
        let serviceClientMock = new WebServiceClientMock();
        serviceClientMock.response = {
          episode: {
            seasonName: "Re-Zero: Starting Life in Another World",
            episodeName:
              "The End of the Beginning and the Beginning of the End",
            state: EpisodeState.PUBLISHED,
            premiereTimeMs: new Date("2023-10-01T00:00:00Z").getTime(),
            episodeIndex: 1,
            videoContainerCached: {
              version: 1,
            },
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
                  staging: {
                    toDelete: true,
                  },
                },
                {
                  durationSec: 7000,
                  resolution: "1280x720",
                  totalBytes: 12345,
                  staging: {
                    toAdd: true,
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
                    toAdd: {
                      name: "French",
                      isDefault: false,
                    },
                  },
                },
                {
                  totalBytes: 23456,
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
                  totalBytes: 32345,
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
                  totalBytes: 34567,
                  staging: {
                    toAdd: {
                      name: "Chinese",
                    },
                  },
                },
              ],
            },
          },
        } as GetEpisodeResponse;
        this.cut = new InfoPage(serviceClientMock, "season1", "episode1", () =>
          new Date("2023-10-01T00:00:00Z").getTime(),
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
            "/info_page_tablet_premiered_pending_tracks.png",
          ),
          path.join(
            __dirname,
            "/golden/info_page_tablet_premiered_pending_tracks.png",
          ),
          path.join(
            __dirname,
            "/info_page_tablet_premiered_pending_tracks_diff.png",
          ),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/info_page_tablet_premiered_pending_tracks_scrolled.png",
          ),
          path.join(
            __dirname,
            "/golden/info_page_tablet_premiered_pending_tracks_scrolled.png",
          ),
          path.join(
            __dirname,
            "/info_page_tablet_premiered_pending_tracks_scrolled_diff.png",
          ),
        );
      }
      public tearDown() {
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
  ],
});
