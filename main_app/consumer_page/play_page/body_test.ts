import "../../../dev/env";
import coverImage = require("../common/test_data/cover_tall.jpg");
import userImage = require("../common/test_data/user_image.jpg");
import userImage2 = require("../common/test_data/user_image2.png");
import blackVideoUrl = require("./common/test_data/black_video_master.m3u8");
import videoUrl = require("./common/test_data/two_audios_two_subs.m3u8");
import path from "path";
import { normalizeBody } from "../../../common/normalize_body";
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../common/view_port";
import { PlayPage } from "./body";
import { CommentsPanel } from "./comments_panel/body";
import { DanmakuOverlayMock } from "./danmaku_overlay/body_mock";
import { InfoPanel } from "./info_panel/body";
import { Player } from "./player/body";
import { SettingsPanel } from "./settings_panel/body";
import { SideCommentOverlay } from "./side_comment_overlay/body";
import { WatchSessionTracker } from "./watch_session_tracker";
import { WatchTimeMeter } from "./watch_time_meter";
import {
  POST_COMMENT,
  PostCommentRequestBody,
  PostCommentResponse,
} from "@phading/comment_service_interface/show/web/author/interface";
import { Comment } from "@phading/comment_service_interface/show/web/comment";
import {
  LIST_COMMENTS,
  ListCommentsRequestBody,
  ListCommentsResponse,
} from "@phading/comment_service_interface/show/web/reader/interface";
import {
  RECORD_WATCH_TIME,
  RecordWatchTimeRequestBody,
  RecordWatchTimeResponse,
} from "@phading/meter_service_interface/show/web/consumer/interface";
import {
  GET_LATEST_WATCHED_VIDEO_TIME_OF_EPISODE,
  GET_LATEST_WATCHED_VIDEO_TIME_OF_EPISODE_REQUEST_BODY,
  GetLatestWatchedVideoTimeOfEpisodeRequestBody,
  GetLatestWatchedVideoTimeOfEpisodeResponse,
  WATCH_EPISODE,
  WatchEpisodeRequestBody,
  WatchEpisodeResponse,
} from "@phading/play_activity_service_interface/show/web/interface";
import {
  AUTHORIZE_EPISODE_PLAYBACK,
  AUTHORIZE_EPISODE_PLAYBACK_REQUEST_BODY,
  AuthorizeEpisodePlaybackRequestBody,
  AuthorizeEpisodePlaybackResponse,
  GET_EPISODE_WITH_SEASON_SUMMARY,
  GET_EPISODE_WITH_SEASON_SUMMARY_REQUEST_BODY,
  GET_EPISODE_WITH_SEASON_SUMMARY_RESPONSE,
  GetEpisodeWithSeasonSummaryRequestBody,
  GetEpisodeWithSeasonSummaryResponse,
  LIST_EPISODES,
  LIST_EPISODES_REQUEST_BODY,
  ListEpisodesRequestBody,
  ListEpisodesResponse,
} from "@phading/product_service_interface/show/web/consumer/interface";
import {
  GET_VIDEO_PLAYER_SETTINGS,
  GetVideoPlayerSettingsResponse,
  SAVE_VIDEO_PLAYER_SETTINGS,
  SAVE_VIDEO_PLAYER_SETTINGS_REQUEST_BODY,
  SaveVideoPlayerSettingsRequestBody,
  SaveVideoPlayerSettingsResponse,
} from "@phading/user_service_interface/web/self/interface";
import {
  CommentOverlayStyle,
  StackingMethod,
  VideoPlayerSettings,
} from "@phading/user_service_interface/web/self/video_player_settings";
import {
  GET_ACCOUNT_SUMMARY,
  GetAccountSummaryResponse,
} from "@phading/user_service_interface/web/third_person/interface";
import { copyMessage } from "@selfage/message/copier";
import { eqMessage } from "@selfage/message/test_matcher";
import { mouseMove } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";
import {
  assertThat,
  eq,
  eqAppr,
  isUnorderedArray,
  lt,
} from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";

normalizeBody();

let EPISODE_WITH_SEASON_SUMMARY_RESPONSE: GetEpisodeWithSeasonSummaryResponse =
  {
    summary: {
      season: {
        seasonId: "season1",
        name: "Re-Zero -Starting Life in Another World Season 1",
        coverImageUrl: coverImage,
        grade: 899,
        totalEpisodes: 25,
      },
      episode: {
        episodeId: "episode1",
        name: "Episode 1",
        index: 1,
        premiereTimeMs: new Date("2024-01-01T08:00:00Z").getTime(),
      },
    },
  };

let NEXT_EPISODE_RESPONSE: ListEpisodesResponse = {
  episodes: [
    {
      episodeId: "episode2",
      name: "Episode 2",
      videoDurationSec: 3600,
      premiereTimeMs: new Date("2024-01-08T08:00:00Z").getTime(),
    },
  ],
};

function createComments(
  start: number,
  num: number,
  pinnedVideoTimeMs: number,
): Comment[] {
  let comments = [];
  for (let index = start; index < start + num; index++) {
    comments.push({
      authorId: `author${(index % 3) + 1}`,
      content: `Comment ${index + 1}`,
      pinnedVideoTimeMs,
    });
  }
  return comments;
}

let COMMENTS_BATCH_ONE: ListCommentsResponse = {
  comments: [...createComments(0, 20, 0), ...createComments(20, 2, 10000)],
};

let COMMENTS_BATCH_TWO: ListCommentsResponse = {
  comments: [
    ...createComments(22, 1, 30000),
    ...createComments(23, 1, 30100),
    ...createComments(24, 1, 30200),
  ],
};

class PlayPageServiceClientMock extends WebServiceClientMock {
  public getEpisodeWithSeasonSummaryRequestBody: GetEpisodeWithSeasonSummaryRequestBody;
  public getEpisodeWithSeasonSummaryResponse: GetEpisodeWithSeasonSummaryResponse =
    EPISODE_WITH_SEASON_SUMMARY_RESPONSE;
  public listEpisodesRequestBody: ListEpisodesRequestBody;
  public listEpisodesResponse: ListEpisodesResponse = {
    episodes: [],
  };
  public getLatestWatchedVideoTimeOfEpisodeRequestBodies =
    new Array<GetLatestWatchedVideoTimeOfEpisodeRequestBody>();
  public getLatestWatchedVideoTimeOfEpisodeResponse: GetLatestWatchedVideoTimeOfEpisodeResponse =
    {};
  public authorizeEpisodePlaybackRequestBody: AuthorizeEpisodePlaybackRequestBody;
  public authorizeEpisodePlaybackResponse: AuthorizeEpisodePlaybackResponse = {
    videoUrl,
  };
  public getVideoPlayerSettingsResponse: GetVideoPlayerSettingsResponse = {
    settings: {},
  };
  public saveVideoPlayerSettingsRequestBody: SaveVideoPlayerSettingsRequestBody;
  public recordWatchTimeRequestBodies = new Array<RecordWatchTimeRequestBody>();
  public recordWatchTimeErrorResponse: Error;
  public watchEpisodeRequestBodies = new Array<WatchEpisodeRequestBody>();
  public listCommentsRequestBodies = new Array<ListCommentsRequestBody>();
  public listCommentsResponse: ListCommentsResponse = {
    comments: [],
  };
  public postCommentRequestBody: PostCommentRequestBody;
  public postCommentResponse: PostCommentResponse;

  public async send(request: ClientRequestInterface<any>): Promise<any> {
    switch (request.descriptor) {
      case GET_EPISODE_WITH_SEASON_SUMMARY: {
        this.getEpisodeWithSeasonSummaryRequestBody = request.body;
        return this.getEpisodeWithSeasonSummaryResponse;
      }
      case LIST_EPISODES: {
        this.listEpisodesRequestBody = request.body;
        return this.listEpisodesResponse;
      }
      case GET_LATEST_WATCHED_VIDEO_TIME_OF_EPISODE: {
        this.getLatestWatchedVideoTimeOfEpisodeRequestBodies.push(request.body);
        return this.getLatestWatchedVideoTimeOfEpisodeResponse;
      }
      case AUTHORIZE_EPISODE_PLAYBACK: {
        this.authorizeEpisodePlaybackRequestBody = request.body;
        return this.authorizeEpisodePlaybackResponse;
      }
      case GET_VIDEO_PLAYER_SETTINGS: {
        return this.getVideoPlayerSettingsResponse;
      }
      case SAVE_VIDEO_PLAYER_SETTINGS: {
        this.saveVideoPlayerSettingsRequestBody = request.body;
        let response: SaveVideoPlayerSettingsResponse = {};
        return response;
      }
      case RECORD_WATCH_TIME: {
        this.recordWatchTimeRequestBodies.push(request.body);
        if (this.recordWatchTimeErrorResponse) {
          throw this.recordWatchTimeErrorResponse;
        } else {
          let response: RecordWatchTimeResponse = {};
          return response;
        }
      }
      case WATCH_EPISODE: {
        this.watchEpisodeRequestBodies.push(request.body);
        let response: WatchEpisodeResponse = {
          watchSessionId: "watchSession1",
        };
        return response;
      }
      case LIST_COMMENTS: {
        this.listCommentsRequestBodies.push(request.body);
        return this.listCommentsResponse;
      }
      case GET_ACCOUNT_SUMMARY: {
        let response: GetAccountSummaryResponse;
        switch (request.body.accountId) {
          case "author1":
            response = {
              account: {
                accountId: "author1",
                naturalName: "Author 1",
                avatarSmallUrl: userImage,
              },
            };
            break;
          case "author2":
            response = {
              account: {
                accountId: "author2",
                naturalName: "Author 2",
                avatarSmallUrl: userImage2,
              },
            };
            break;
          case "author3":
            response = {
              account: {
                accountId: "author3",
                naturalName: "Author 3",
                avatarSmallUrl: userImage,
              },
            };
            break;
        }
        return response;
      }
      case POST_COMMENT: {
        this.postCommentRequestBody = request.body;
        return this.postCommentResponse;
      }
      default:
        throw new Error(`Unknown request ${request.descriptor.name}`);
    }
  }
}

function createPlayPage(
  serviceClientMock: WebServiceClientMock,
  nowDate: () => Date,
) {
  return new PlayPage(
    window,
    serviceClientMock,
    (settings, videoUrl, continueTimestampMs, seasonId, nextEpisodeId) =>
      new Player(
        window,
        settings,
        videoUrl,
        continueTimestampMs,
        seasonId,
        nextEpisodeId,
        false,
      ),
    (
      customeStyle,
      episode,
      seasonSummary,
      nextEpisode,
      nextEpisodeWatchedTimeMs,
    ) =>
      new InfoPanel(
        nowDate,
        customeStyle,
        episode,
        seasonSummary,
        nextEpisode,
        nextEpisodeWatchedTimeMs,
      ),
    (customeStyle, seasonId, episodeId) =>
      new CommentsPanel(serviceClientMock, customeStyle, seasonId, episodeId),
    (customeStyle, settings) => new SettingsPanel(customeStyle, settings),
    (settings) => new SideCommentOverlay(settings),
    (settings) => new DanmakuOverlayMock(0, settings),
    (seasonId, episodeId) =>
      new WatchSessionTracker(
        serviceClientMock,
        () => nowDate().valueOf(),
        seasonId,
        episodeId,
      ),
    (seasonId, episodeId) =>
      new WatchTimeMeter(
        window,
        serviceClientMock,
        () => nowDate().valueOf(),
        seasonId,
        episodeId,
      ),
    "season1",
    "episode1",
  );
}

TEST_RUNNER.run({
  name: "PlayPageTest",
  cases: [
    new (class {
      public name =
        "DesktopView_Controllers_InfoPanel_TabletView_Controllers_CommentsPanel_SettingsPanel_Scrolled_PhoneView_Controllers";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new PlayPageServiceClientMock();
        this.cut = createPlayPage(
          serviceClientMock,
          () => new Date("2024-02-01T08:00:00Z"),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("metadataLoaded", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.getEpisodeWithSeasonSummaryRequestBody,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "episode1",
            },
            GET_EPISODE_WITH_SEASON_SUMMARY_REQUEST_BODY,
          ),
          "GetEpisodeWithSeasonSummaryRequestBody",
        );
        assertThat(
          serviceClientMock.listEpisodesRequestBody,
          eqMessage(
            {
              seasonId: "season1",
              indexCursor: 1,
              limit: 1,
              next: true,
            },
            LIST_EPISODES_REQUEST_BODY,
          ),
          "ListEpisodesRequestBody",
        );
        assertThat(
          serviceClientMock.getLatestWatchedVideoTimeOfEpisodeRequestBodies,
          isUnorderedArray([
            eqMessage(
              {
                seasonId: "season1",
                episodeId: "episode1",
              },
              GET_LATEST_WATCHED_VIDEO_TIME_OF_EPISODE_REQUEST_BODY,
            ),
          ]),
          "GetLatestWatchedVideoTimeOfEpisodeRequestBodies",
        );
        assertThat(
          serviceClientMock.authorizeEpisodePlaybackRequestBody,
          eqMessage(
            {
              seasonId: "season1",
              episodeId: "episode1",
            },
            AUTHORIZE_EPISODE_PLAYBACK_REQUEST_BODY,
          ),
          "AuthorizeEpisodePlaybackRequestBody",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_default.png"),
          path.join(__dirname, "/golden/play_page_desktop_default.png"),
          path.join(__dirname, "/play_page_desktop_default_diff.png"),
        );

        // Execute
        await mouseMove(100, 100, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_controllers.png"),
          path.join(__dirname, "/golden/play_page_desktop_controllers.png"),
          path.join(__dirname, "/play_page_desktop_controllers_diff.png"),
        );

        // Execute
        this.cut.player.val.showInfoButton.val.click();
        await mouseMove(100, 110, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_info_panel.png"),
          path.join(__dirname, "/golden/play_page_desktop_info_panel.png"),
          path.join(__dirname, "/play_page_desktop_info_panel_diff.png"),
        );

        // Execute
        await setTabletView();
        await mouseMove(100, 100, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_tablet_info_panel.png"),
          path.join(__dirname, "/golden/play_page_tablet_info_panel.png"),
          path.join(__dirname, "/play_page_tablet_info_panel_diff.png"),
        );

        // Execute
        this.cut.closePanelButton.val.click();
        await mouseMove(100, 110, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_tablet_controllers.png"),
          path.join(__dirname, "/golden/play_page_tablet_controllers.png"),
          path.join(__dirname, "/play_page_tablet_controllers_diff.png"),
        );

        // Execute
        this.cut.player.val.showCommentsButton.val.click();
        await mouseMove(100, 100, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_tablet_comments_panel.png"),
          path.join(__dirname, "/golden/play_page_tablet_comments_panel.png"),
          path.join(__dirname, "/play_page_tablet_comments_panel_diff.png"),
        );

        // Execute
        this.cut.player.val.showSettingsButton.val.click();
        await mouseMove(100, 110, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_tablet_settings_panel.png"),
          path.join(__dirname, "/golden/play_page_tablet_settings_panel.png"),
          path.join(__dirname, "/play_page_tablet_settings_panel_diff.png"),
        );

        // Execute
        window.scrollTo(0, document.body.scrollHeight);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_tablet_settings_panel_scrolled.png"),
          path.join(
            __dirname,
            "/golden/play_page_tablet_settings_panel_scrolled.png",
          ),
          path.join(
            __dirname,
            "/play_page_tablet_settings_panel_scrolled_diff.png",
          ),
        );

        // Execute
        await setPhoneView();
        await mouseMove(100, 100, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_phone_settings_panel.png"),
          path.join(__dirname, "/golden/play_page_phone_settings_panel.png"),
          path.join(__dirname, "/play_page_phone_settings_panel_diff.png"),
        );

        // Execute
        this.cut.closePanelButton.val.click();
        await mouseMove(100, 110, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_phone_controllers.png"),
          path.join(__dirname, "/golden/play_page_phone_controllers.png"),
          path.join(__dirname, "/play_page_phone_controllers_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        window.scrollTo(0, 0);
        this.cut.remove();
      }
    })(),
    new (class {
      public name = "SelectSubtitle_SelectAudio";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new PlayPageServiceClientMock();
        this.cut = createPlayPage(
          serviceClientMock,
          () => new Date("2024-02-01T08:00:00Z"),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("metadataLoaded", resolve),
        );
        this.cut.player.val.showSettingsButton.val.click();
        this.cut.settingsPanel.val.subtitleOptions[1].click();
        await mouseMove(100, 100, 1);

        // Verify
        assertThat(
          serviceClientMock.saveVideoPlayerSettingsRequestBody,
          eqMessage(
            {
              settings: {
                videoSettings: {
                  playbackSpeed: 1,
                  volume: 10,
                  preferredSubtitleName: "Korean",
                },
                commentOverlaySettings: {
                  style: CommentOverlayStyle.SIDE,
                  opacity: 80,
                  fontSize: 20,
                  danmakuSettings: {
                    density: 100,
                    speed: 200,
                    stackingMethod: StackingMethod.RANDOM,
                  },
                },
              },
            },
            SAVE_VIDEO_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "SaveVideoPlayerSettingsRequestBody",
        );
        assertThat(
          this.cut.player.val.hls.subtitleTrack,
          eq(0),
          "Player.subtitleTrack",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_select_subtitle.png"),
          path.join(__dirname, "/golden/play_page_desktop_select_subtitle.png"),
          path.join(__dirname, "/play_page_desktop_select_subtitle_diff.png"),
        );

        // Execute
        this.cut.settingsPanel.val.audioOptions[1].click();
        await mouseMove(100, 110, 1);

        // Verify
        assertThat(
          serviceClientMock.saveVideoPlayerSettingsRequestBody,
          eqMessage(
            {
              settings: {
                videoSettings: {
                  playbackSpeed: 1,
                  volume: 10,
                  preferredAudioName: "Chinese",
                  preferredSubtitleName: "Korean",
                },
                commentOverlaySettings: {
                  style: CommentOverlayStyle.SIDE,
                  opacity: 80,
                  fontSize: 20,
                  danmakuSettings: {
                    density: 100,
                    speed: 200,
                    stackingMethod: StackingMethod.RANDOM,
                  },
                },
              },
            },
            SAVE_VIDEO_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "SaveVideoPlayerSettingsRequestBody",
        );
        assertThat(
          this.cut.player.val.hls.audioTrack,
          eq(1),
          "Player.audioTrack",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_select_audio.png"),
          path.join(__dirname, "/golden/play_page_desktop_select_audio.png"),
          path.join(__dirname, "/play_page_desktop_select_audio_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
    new (class {
      public name = "WithNextEpisode";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new PlayPageServiceClientMock();
        serviceClientMock.listEpisodesResponse = NEXT_EPISODE_RESPONSE;
        this.cut = createPlayPage(
          serviceClientMock,
          () => new Date("2024-02-01T08:00:00Z"),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("metadataLoaded", resolve),
        );
        this.cut.player.val.showInfoButton.val.click();
        await mouseMove(100, 100, 1);

        // Verify
        assertThat(
          serviceClientMock.getLatestWatchedVideoTimeOfEpisodeRequestBodies,
          isUnorderedArray([
            eqMessage(
              {
                seasonId: "season1",
                episodeId: "episode1",
              },
              GET_LATEST_WATCHED_VIDEO_TIME_OF_EPISODE_REQUEST_BODY,
            ),
            eqMessage(
              {
                seasonId: "season1",
                episodeId: "episode2",
              },
              GET_LATEST_WATCHED_VIDEO_TIME_OF_EPISODE_REQUEST_BODY,
            ),
          ]),
          "GetLatestWatchedVideoTimeOfEpisodeRequestBodies",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_next_episode.png"),
          path.join(__dirname, "/golden/play_page_desktop_next_episode.png"),
          path.join(__dirname, "/play_page_desktop_next_episode_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
    new (class {
      public name = "ContinueWatchingTimestampWithInitTracks";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new PlayPageServiceClientMock();
        serviceClientMock.listEpisodesResponse = NEXT_EPISODE_RESPONSE;
        serviceClientMock.getLatestWatchedVideoTimeOfEpisodeResponse = {
          watchedVideoTimeMs: 1000,
        };
        serviceClientMock.getVideoPlayerSettingsResponse = {
          settings: {
            videoSettings: {
              preferredAudioName: "English",
              preferredSubtitleName: "Korean",
            },
          },
        };
        this.cut = createPlayPage(
          serviceClientMock,
          () => new Date("2024-02-01T08:00:00Z"),
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("metadataLoaded", resolve),
        );
        this.cut.player.val.showInfoButton.val.click();
        await mouseMove(100, 100, 1);

        // Verify
        assertThat(
          this.cut.player.val.hls.audioTrack,
          eq(0),
          "Player.audioTrack",
        );
        assertThat(
          this.cut.player.val.hls.subtitleTrack,
          eq(0),
          "Player.subtitleTrack",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_continue_timestamp.png"),
          path.join(
            __dirname,
            "/golden/play_page_desktop_continue_timestamp.png",
          ),
          path.join(
            __dirname,
            "/play_page_desktop_continue_timestamp_diff.png",
          ),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
    new (class {
      public name =
        "PlayUntilEndWithWatchSessionAndMeterTracking_RestartedWithMeterError_ResumedUntilEnd";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new PlayPageServiceClientMock();
        let response = copyMessage(
          EPISODE_WITH_SEASON_SUMMARY_RESPONSE,
          GET_EPISODE_WITH_SEASON_SUMMARY_RESPONSE,
        );
        response.summary.season.grade = 9000;
        serviceClientMock.getEpisodeWithSeasonSummaryResponse = response;
        let nowDate = new Date("2024-02-01T08:00:00Z");
        this.cut = createPlayPage(serviceClientMock, () => nowDate);
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("metadataLoaded", resolve),
        );
        this.cut.player.val.showInfoButton.val.click();

        // Execute
        this.cut.player.val.playButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("playing", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies.length,
          eq(2),
          "watchEpisodeRequestBodies.length",
        );
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies[0].watchSessionId,
          eq(undefined),
          "Watch session id",
        );
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies[0].seasonId,
          eq("season1"),
          "Watch session season id",
        );
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies[0].episodeId,
          eq("episode1"),
          "Watch session episode id",
        );
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies[0].watchedVideoTimeMs,
          eq(0),
          "Watch session video time",
        );
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies[1].watchSessionId,
          eq("watchSession1"),
          "Watch session id 2",
        );
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies[1].watchedVideoTimeMs,
          lt(100),
          "Watch session video time 2",
        );

        // Prepare
        serviceClientMock.watchEpisodeRequestBodies.length = 0;

        // Execute
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("notPlaying", resolve),
        );
        await mouseMove(100, 100, 1);

        // Verify
        assertThat(
          serviceClientMock.recordWatchTimeRequestBodies.length,
          eq(1),
          "recordWatchTimeRequestBodies.length when ended",
        );
        assertThat(
          serviceClientMock.recordWatchTimeRequestBodies[0].seasonId,
          eq("season1"),
          "Watch time season id when ended",
        );
        assertThat(
          serviceClientMock.recordWatchTimeRequestBodies[0].episodeId,
          eq("episode1"),
          "Watch time episode id when ended",
        );
        assertThat(
          serviceClientMock.recordWatchTimeRequestBodies[0].watchTimeMs,
          eqAppr(10000, 0.1),
          "Watch time when ended",
        );
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies.length,
          eq(1),
          "watchEpisodeRequestBodies.length when ended",
        );
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies[0].watchedVideoTimeMs,
          eq(10000),
          "Watch session video time when ended",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_watched_until_end.png"),
          path.join(
            __dirname,
            "/golden/play_page_desktop_watched_until_end.png",
          ),
          path.join(__dirname, "/play_page_desktop_watched_until_end_diff.png"),
        );

        // Prepare
        serviceClientMock.recordWatchTimeRequestBodies.length = 0;
        serviceClientMock.recordWatchTimeErrorResponse = new Error(
          "Fake error",
        );
        serviceClientMock.watchEpisodeRequestBodies.length = 0;

        // Execute
        this.cut.player.val.playButton.val.click();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Advance 30 seconds which is larger than
        // WatchTimeMeter.SYNC_THROTTLE_INTERVAL_MS and
        // WatchSessionTracker.SYNC_THROTTLE_INTERVAL_MS.
        nowDate = new Date("2024-02-01T08:00:30Z");
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("notPlaying", resolve),
        );

        // Verify
        assertThat(
          this.cut.player.val.getCurrentVideoTimeMs(),
          eqAppr(950, 0.1),
          "Player stopped",
        );
        assertThat(
          serviceClientMock.recordWatchTimeRequestBodies.length,
          eq(2),
          "recordWatchTimeRequestBodies.length when stopped",
        );
        assertThat(
          serviceClientMock.recordWatchTimeRequestBodies[0].watchTimeMs,
          eqAppr(950, 0.1),
          "Watch time when stopped",
        );
        assertThat(
          serviceClientMock.recordWatchTimeRequestBodies[1].watchTimeMs,
          eqAppr(950, 0.1),
          "Watch time 2 when stopped",
        );
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies.length,
          eq(4),
          "watchEpisodeRequestBodies.length when stopped",
        );
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies[0].watchedVideoTimeMs,
          lt(100),
          "Watch session video time seeking when stopped",
        );
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies[1].watchedVideoTimeMs,
          lt(100),
          "Watch session video time start when stopped",
        );
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies[2].watchedVideoTimeMs,
          eqAppr(950, 0.1),
          "Watch session video time update when stopped",
        );
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies[3].watchedVideoTimeMs,
          eqAppr(950, 0.1),
          "Watch session video time stop when stopped",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_interrupted.png"),
          path.join(__dirname, "/golden/play_page_desktop_interrupted.png"),
          path.join(__dirname, "/play_page_desktop_interrupted_diff.png"),
          {
            excludedAreas: [
              {
                x: 0,
                y: 0,
                width: 730,
                height: 660,
              },
            ],
          },
        );

        // Prepare
        serviceClientMock.recordWatchTimeRequestBodies.length = 0;
        serviceClientMock.recordWatchTimeErrorResponse = undefined;
        serviceClientMock.watchEpisodeRequestBodies.length = 0;

        // Execute
        this.cut.player.val.playButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("notPlaying", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.recordWatchTimeRequestBodies.length,
          eq(1),
          "recordWatchTimeRequestBodies.length when resumed",
        );
        assertThat(
          serviceClientMock.recordWatchTimeRequestBodies[0].watchTimeMs,
          eqAppr(10000, 0.1),
          "Watch time when resumed",
        );
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies.length,
          eq(2),
          "watchEpisodeRequestBodies.length when resumed",
        );
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies[0].watchedVideoTimeMs,
          eqAppr(1000, 0.1),
          "Watch session video time when resumed",
        );
        assertThat(
          serviceClientMock.watchEpisodeRequestBodies[1].watchedVideoTimeMs,
          eq(10000),
          "Watch session video time 2 when resumed",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_watched_until_end_2.png"),
          path.join(
            __dirname,
            "/golden/play_page_desktop_watched_until_end_2.png",
          ),
          path.join(
            __dirname,
            "/play_page_desktop_watched_until_end_2_diff.png",
          ),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
    new (class {
      public name =
        "SideComments_LoadComments_PlayUntilNeedsToLoadAgain_PostComment_UpdateSettings_SkipBackward";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new PlayPageServiceClientMock();
        serviceClientMock.authorizeEpisodePlaybackResponse = {
          videoUrl: blackVideoUrl,
        };
        let settings: VideoPlayerSettings = {
          videoSettings: {
            playbackSpeed: 8, // PLAYBACK_SPEED_VALUES[-1]
          },
          commentOverlaySettings: {
            fontSize: 35,
          },
        };
        serviceClientMock.getVideoPlayerSettingsResponse = {
          settings,
        };
        this.cut = createPlayPage(
          serviceClientMock,
          () => new Date("2024-02-01T08:00:00Z"),
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("metadataLoaded", resolve),
        );
        this.cut.player.val.showCommentsButton.val.click();
        serviceClientMock.listCommentsResponse = COMMENTS_BATCH_ONE;

        // Execute
        this.cut.player.val.playButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("playing", resolve),
        );
        this.cut.player.val.pauseButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("notPlaying", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.listCommentsRequestBodies.length,
          eq(1),
          "ListCommentsRequestBodies.length",
        );
        assertThat(
          serviceClientMock.listCommentsRequestBodies[0].seasonId,
          eq("season1"),
          "ListCommentsRequestBody.seasonId",
        );
        assertThat(
          serviceClientMock.listCommentsRequestBodies[0].episodeId,
          eq("episode1"),
          "ListCommentsRequestBody.episodeId",
        );
        assertThat(
          serviceClientMock.listCommentsRequestBodies[0].pinnedVideoTimeMsStart,
          lt(100),
          "ListCommentsRequestBody.pinnedVideoTimeMsStart",
        );
        assertThat(
          serviceClientMock.listCommentsRequestBodies[0].pinnedVideoTimeMsEnd,
          eqAppr(30000, 0.1),
          "ListCommentsRequestBody.pinnedVideoTimeMsEnd",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_side_comments.png"),
          path.join(__dirname, "/golden/play_page_desktop_side_comments.png"),
          path.join(__dirname, "/play_page_desktop_side_comments_diff.png"),
        );

        // Prepare
        serviceClientMock.listCommentsRequestBodies.length = 0;
        serviceClientMock.listCommentsResponse = COMMENTS_BATCH_TWO;

        // Execute
        this.cut.player.val.playButton.val.click();
        // 8x speed (PLAYBACK_SPEED_VALUES[-1]) to watch between 20 and 30 seconds (LIST_COMMENTS_BUFFER_RANGE_MS - LIST_COMMENTS_ENOUGH_BUFFER_RANGE_MS).
        await new Promise((resolve) => setTimeout(resolve, 3000));
        this.cut.player.val.pauseButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("notPlaying", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.listCommentsRequestBodies.length,
          eq(1),
          "ListCommentsRequestBodies.length 2",
        );
        assertThat(
          serviceClientMock.listCommentsRequestBodies[0].pinnedVideoTimeMsStart,
          eqAppr(30000, 0.1),
          "ListCommentsRequestBody.pinnedVideoTimeMsStart 2",
        );
        assertThat(
          serviceClientMock.listCommentsRequestBodies[0].pinnedVideoTimeMsEnd,
          eqAppr(60000, 0.1),
          "ListCommentsRequestBody.pinnedVideoTimeMsEnd 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_side_comments_2.png"),
          path.join(__dirname, "/golden/play_page_desktop_side_comments_2.png"),
          path.join(__dirname, "/play_page_desktop_side_comments_2_diff.png"),
          {
            excludedAreas: [
              // Excludes the seconds.
              {
                x: 763,
                y: 58,
                width: 20,
                height: 20,
              },
            ],
          },
        );

        // Prepare
        serviceClientMock.listCommentsRequestBodies.length = 0;

        // Execute
        this.cut.player.val.playButton.val.click();
        // 8x speed (PLAYBACK_SPEED_VALUES[-1]) to watch more than 10 seconds (LIST_COMMENTS_ENOUGH_BUFFER_RANGE_MS).
        await new Promise((resolve) => setTimeout(resolve, 1300));
        this.cut.player.val.pauseButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("notPlaying", resolve),
        );

        // Verify
        assertThat(
          serviceClientMock.listCommentsRequestBodies.length,
          eq(0),
          "ListCommentsRequestBodies.length 3",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_side_comments_3.png"),
          path.join(__dirname, "/golden/play_page_desktop_side_comments_3.png"),
          path.join(__dirname, "/play_page_desktop_side_comments_3_diff.png"),
          {
            excludedAreas: [
              {
                x: 763,
                y: 58,
                width: 20,
                height: 20,
              },
            ],
          },
        );

        // Prepare
        serviceClientMock.postCommentResponse = {
          comment: createComments(100, 1, 0)[0],
        };

        // Execute
        this.cut.commentsPanel.val.commentInput.val.value =
          "Test comment input";
        this.cut.commentsPanel.val.commentInput.val.dispatchEvent(
          new Event("input"),
        );
        this.cut.commentsPanel.val.commentButton.val.click();

        // Verify
        assertThat(
          serviceClientMock.postCommentRequestBody.seasonId,
          eq("season1"),
          "postCommentRequestBody.seasonId",
        );
        assertThat(
          serviceClientMock.postCommentRequestBody.episodeId,
          eq("episode1"),
          "postCommentRequestBody.episodeId",
        );
        assertThat(
          serviceClientMock.postCommentRequestBody.content,
          eq("Test comment input"),
          "postCommentRequestBody.content",
        );
        assertThat(
          serviceClientMock.postCommentRequestBody.pinnedVideoTimeMs,
          eqAppr(34000, 0.1),
          "postCommentRequestBody.pinnedVideoTimeMs",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_posted_comment.png"),
          path.join(__dirname, "/golden/play_page_desktop_posted_comment.png"),
          path.join(__dirname, "/play_page_desktop_posted_comment_diff.png"),
          {
            excludedAreas: [
              {
                x: 763,
                y: 58,
                width: 20,
                height: 20,
              },
            ],
          },
        );

        // Execute
        this.cut.settingsPanel.val.commentOverlayFontSize.val.input.val.value =
          "20";
        this.cut.settingsPanel.val.commentOverlayFontSize.val.input.val.dispatchEvent(
          new Event("blur"),
        );

        // Verify
        assertThat(
          serviceClientMock.saveVideoPlayerSettingsRequestBody,
          eqMessage(
            {
              settings: {
                videoSettings: {
                  playbackSpeed: 8,
                  volume: 10,
                },
                commentOverlaySettings: {
                  style: CommentOverlayStyle.SIDE,
                  opacity: 80,
                  fontSize: 20,
                  danmakuSettings: {
                    density: 100,
                    speed: 200,
                    stackingMethod: StackingMethod.RANDOM,
                  },
                },
              },
            },
            SAVE_VIDEO_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "SAVE_VIDEO_PLAYER_SETTINGS_REQUEST_BODY",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/play_page_desktop_side_comments_updated_settings.png",
          ),
          path.join(
            __dirname,
            "/golden/play_page_desktop_side_comments_updated_settings.png",
          ),
          path.join(
            __dirname,
            "/play_page_desktop_side_comments_updated_settings_diff.png",
          ),
          {
            excludedAreas: [
              {
                x: 763,
                y: 58,
                width: 20,
                height: 20,
              },
            ],
          },
        );

        // Execute
        this.cut.player.val.skipBackwardButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_side_comments_cleared.png"),
          path.join(
            __dirname,
            "/golden/play_page_desktop_side_comments_cleared.png",
          ),
          path.join(
            __dirname,
            "/play_page_desktop_side_comments_cleared_diff.png",
          ),
          {
            excludedAreas: [
              {
                x: 763,
                y: 58,
                width: 20,
                height: 20,
              },
            ],
          },
        );
      }
      public async tearDown() {
        this.cut.remove();
      }
    })(),
    new (class {
      public name = "Danmaku_UpdateSettings_SkipBackward";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new PlayPageServiceClientMock();
        serviceClientMock.authorizeEpisodePlaybackResponse = {
          videoUrl: blackVideoUrl,
        };
        let settings: VideoPlayerSettings = {
          videoSettings: {
            playbackSpeed: 8, // PLAYBACK_SPEED_VALUES[-1]
          },
          commentOverlaySettings: {
            style: CommentOverlayStyle.DANMAKU,
            fontSize: 35,
            danmakuSettings: {
              speed: 500,
            },
          },
        };
        serviceClientMock.getVideoPlayerSettingsResponse = {
          settings,
        };
        this.cut = createPlayPage(
          serviceClientMock,
          () => new Date("2024-02-01T08:00:00Z"),
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("metadataLoaded", resolve),
        );
        this.cut.player.val.showCommentsButton.val.click();
        serviceClientMock.listCommentsResponse = COMMENTS_BATCH_ONE;

        // Execute
        this.cut.player.val.playButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("playing", resolve),
        );
        this.cut.player.val.pauseButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("notPlaying", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_danmaku.png"),
          path.join(__dirname, "/golden/play_page_desktop_danmaku.png"),
          path.join(__dirname, "/play_page_desktop_danmaku_diff.png"),
          {
            threshold: 0.4,
          },
        );

        // Prepare
        serviceClientMock.listCommentsResponse = {
          comments: [],
        };

        // Execute
        this.cut.player.val.playButton.val.click();
        await new Promise((resolve) => setTimeout(resolve, 2000));
        this.cut.player.val.pauseButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("notPlaying", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_danmaku_2.png"),
          path.join(__dirname, "/golden/play_page_desktop_danmaku_2.png"),
          path.join(__dirname, "/play_page_desktop_danmaku_2_diff.png"),
          {
            excludedAreas: [
              {
                x: 763,
                y: 58,
                width: 20,
                height: 20,
              },
            ],
          },
        );

        // Execute
        this.cut.settingsPanel.val.commentOverlayFontSize.val.input.val.value =
          "20";
        this.cut.settingsPanel.val.commentOverlayFontSize.val.input.val.dispatchEvent(
          new Event("blur"),
        );

        // Verify
        assertThat(
          serviceClientMock.saveVideoPlayerSettingsRequestBody,
          eqMessage(
            {
              settings: {
                videoSettings: {
                  playbackSpeed: 8,
                  volume: 10,
                },
                commentOverlaySettings: {
                  style: CommentOverlayStyle.DANMAKU,
                  opacity: 80,
                  fontSize: 20,
                  danmakuSettings: {
                    density: 100,
                    speed: 500,
                    stackingMethod: StackingMethod.RANDOM,
                  },
                },
              },
            },
            SAVE_VIDEO_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "SAVE_VIDEO_PLAYER_SETTINGS_REQUEST_BODY",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/play_page_desktop_danmaku_updated_settings.png",
          ),
          path.join(
            __dirname,
            "/golden/play_page_desktop_danmaku_updated_settings.png",
          ),
          path.join(
            __dirname,
            "/play_page_desktop_danmaku_updated_settings_diff.png",
          ),
          {
            excludedAreas: [
              {
                x: 763,
                y: 58,
                width: 20,
                height: 20,
              },
            ],
          },
        );

        // Execute
        this.cut.player.val.skipBackwardButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_danmaku_cleared.png"),
          path.join(__dirname, "/golden/play_page_desktop_danmaku_cleared.png"),
          path.join(__dirname, "/play_page_desktop_danmaku_cleared_diff.png"),
          {
            excludedAreas: [
              {
                x: 763,
                y: 58,
                width: 20,
                height: 20,
              },
            ],
          },
        );
      }
      public async tearDown() {
        this.cut.remove();
      }
    })(),
    new (class {
      public name = "SideComments_ToDanmaku_ToDisabled_ToSideComments";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new PlayPageServiceClientMock();
        serviceClientMock.authorizeEpisodePlaybackResponse = {
          videoUrl: blackVideoUrl,
        };
        let settings: VideoPlayerSettings = {
          videoSettings: {
            playbackSpeed: 8, // PLAYBACK_SPEED_VALUES[-1]
          },
          commentOverlaySettings: {
            fontSize: 35,
            danmakuSettings: {
              speed: 500,
            },
          },
        };
        serviceClientMock.getVideoPlayerSettingsResponse = {
          settings,
        };
        this.cut = createPlayPage(
          serviceClientMock,
          () => new Date("2024-02-01T08:00:00Z"),
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("metadataLoaded", resolve),
        );
        this.cut.player.val.showCommentsButton.val.click();
        serviceClientMock.listCommentsResponse = COMMENTS_BATCH_ONE;

        this.cut.player.val.playButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("playing", resolve),
        );
        this.cut.player.val.pauseButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("notPlaying", resolve),
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_side_comments_baseline.png"),
          path.join(__dirname, "/golden/play_page_desktop_side_comments.png"),
          path.join(
            __dirname,
            "/play_page_desktop_side_comments_baseline_diff.png",
          ),
        );

        // Execute
        this.cut.settingsPanel.val.commentOverlayDanmakuOption.val.click();

        // Verify
        assertThat(
          serviceClientMock.saveVideoPlayerSettingsRequestBody,
          eqMessage(
            {
              settings: {
                videoSettings: {
                  playbackSpeed: 8,
                  volume: 10,
                },
                commentOverlaySettings: {
                  style: CommentOverlayStyle.DANMAKU,
                  opacity: 80,
                  fontSize: 35,
                  danmakuSettings: {
                    density: 100,
                    speed: 500,
                    stackingMethod: StackingMethod.RANDOM,
                  },
                },
              },
            },
            SAVE_VIDEO_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "SAVE_VIDEO_PLAYER_SETTINGS_REQUEST_BODY",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_to_danmaku.png"),
          path.join(
            __dirname,
            "/golden/play_page_desktop_no_comment_overlay.png",
          ),
          path.join(__dirname, "/play_page_desktop_to_danmaku_diff.png"),
        );

        // Execute
        this.cut.player.val.playButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("playing", resolve),
        );
        this.cut.player.val.pauseButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("notPlaying", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_no_danmaku.png"),
          path.join(
            __dirname,
            "/golden/play_page_desktop_no_comment_overlay.png",
          ),
          path.join(__dirname, "/play_page_desktop_no_danmaku_diff.png"),
        );

        // Execute
        this.cut.player.val.skipBackwardButton.val.click();
        this.cut.player.val.playButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("playing", resolve),
        );
        this.cut.player.val.pauseButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("notPlaying", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_load_danmaku.png"),
          path.join(__dirname, "/golden/play_page_desktop_danmaku.png"),
          path.join(__dirname, "/play_page_desktop_load_danmaku_diff.png"),
          {
            threshold: 0.4,
          },
        );

        // Execute
        this.cut.settingsPanel.val.commentOverlayDisabledOption.val.click();

        // Verify
        assertThat(
          serviceClientMock.saveVideoPlayerSettingsRequestBody,
          eqMessage(
            {
              settings: {
                videoSettings: {
                  playbackSpeed: 8,
                  volume: 10,
                },
                commentOverlaySettings: {
                  style: CommentOverlayStyle.NONE,
                  opacity: 80,
                  fontSize: 35,
                  danmakuSettings: {
                    density: 100,
                    speed: 500,
                    stackingMethod: StackingMethod.RANDOM,
                  },
                },
              },
            },
            SAVE_VIDEO_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "SAVE_VIDEO_PLAYER_SETTINGS_REQUEST_BODY",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_to_disabled.png"),
          path.join(
            __dirname,
            "/golden/play_page_desktop_no_comment_overlay.png",
          ),
          path.join(__dirname, "/play_page_desktop_to_disabled_diff.png"),
        );

        // Execute
        this.cut.player.val.skipBackwardButton.val.click();
        this.cut.player.val.playButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("playing", resolve),
        );
        this.cut.player.val.pauseButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("notPlaying", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_loaded_comments_only.png"),
          path.join(
            __dirname,
            "/golden/play_page_desktop_no_comment_overlay.png",
          ),
          path.join(
            __dirname,
            "/play_page_desktop_loaded_comments_only_diff.png",
          ),
        );

        // Execute
        this.cut.settingsPanel.val.commentOverlaySideOption.val.click();
        this.cut.player.val.skipBackwardButton.val.click();
        this.cut.player.val.playButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("playing", resolve),
        );
        this.cut.player.val.pauseButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("notPlaying", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_to_side_comments.png"),
          path.join(__dirname, "/golden/play_page_desktop_side_comments.png"),
          path.join(__dirname, "/play_page_desktop_to_side_comments_diff.png"),
        );
      }
      public async tearDown() {
        this.cut.remove();
      }
    })(),
    new (class {
      public name =
        "Back_PlayNext_GoFullscreen_ExitFullscreen_UpdateVolumeSaveSettings";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        await setDesktopView();
        let serviceClientMock = new PlayPageServiceClientMock();
        serviceClientMock.listEpisodesResponse = NEXT_EPISODE_RESPONSE;
        this.cut = createPlayPage(
          serviceClientMock,
          () => new Date("2024-02-01T08:00:00Z"),
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        await new Promise<void>((resolve) =>
          this.cut.player.val.once("metadataLoaded", resolve),
        );
        let back = false;
        this.cut.on("back", () => {
          back = true;
        });

        // Execute
        this.cut.player.val.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "Go back");

        // Prepare
        let playSeasonId: string;
        let playEpisodeId: string;
        this.cut.on("play", (seasonId, episodeId) => {
          playSeasonId = seasonId;
          playEpisodeId = episodeId;
        });

        // Execute
        this.cut.infoPanel.val.nextEpisodeButton.val.click();

        // Verify
        assertThat(playSeasonId, eq("season1"), "Play next season id");
        assertThat(playEpisodeId, eq("episode2"), "Play next episode id");

        // Prepare
        playSeasonId = undefined;
        playEpisodeId = undefined;

        // Execute
        this.cut.player.val.playNextButton.val.click();

        // Verify
        assertThat(playSeasonId, eq("season1"), "Play next season id 2");
        assertThat(playEpisodeId, eq("episode2"), "Play next episode id 2");

        // Execute
        this.cut.player.val.fullscreenButton.val.click();
        await mouseMove(100, 100, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_fullscreen.png"),
          path.join(__dirname, "/golden/play_page_desktop_fullscreen.png"),
          path.join(__dirname, "/play_page_desktop_fullscreen_diff.png"),
        );

        // Execute
        this.cut.player.val.exitFullscreenButton.val.click();
        await mouseMove(100, 110, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_exit_fullscreen.png"),
          path.join(__dirname, "/golden/play_page_desktop_exit_fullscreen.png"),
          path.join(__dirname, "/play_page_desktop_exit_fullscreen_diff.png"),
        );

        // Execute
        this.cut.player.val.volumeDownButton.val.click();
        await mouseMove(100, 100, 1);

        // Verify
        assertThat(
          serviceClientMock.saveVideoPlayerSettingsRequestBody,
          eqMessage(
            {
              settings: {
                videoSettings: {
                  playbackSpeed: 1,
                  volume: 9,
                },
                commentOverlaySettings: {
                  style: CommentOverlayStyle.SIDE,
                  opacity: 80,
                  fontSize: 20,
                  danmakuSettings: {
                    density: 100,
                    speed: 200,
                    stackingMethod: StackingMethod.RANDOM,
                  },
                },
              },
            },
            SAVE_VIDEO_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "SAVE_VIDEO_PLAYER_SETTINGS_REQUEST_BODY",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_desktop_volume_down.png"),
          path.join(__dirname, "/golden/play_page_desktop_volume_down.png"),
          path.join(__dirname, "/play_page_desktop_volume_down_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
  ],
});
