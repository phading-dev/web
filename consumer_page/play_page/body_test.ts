import coverImage = require("./test_data/cover.jpg");
import mov = require("./test_data/mov1.mp4");
import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { PlayPage } from "./body";
import { CommentsCardMock } from "./comments_card/body_mock";
import { CommentsPoolMock } from "./comments_pool_mock";
import { InfoCardMock } from "./info_card/body_mock";
import { MeterMock } from "./meter_mock";
import { PlayerMock } from "./player/body_mock";
import { SettingsCardMock } from "./settings_card/body_mock";
import { ViewSessionTrackerMock } from "./view_session_tracker_mock";
import { Comment } from "@phading/comment_service_interface/frontend/show/comment";
import {
  Episode,
  EpisodeToPlay,
} from "@phading/product_service_interface/consumer/frontend/show/episode_to_play";
import {
  GET_EPISODE_TO_PLAY,
  GET_EPISODE_TO_PLAY_REQUEST_BODY,
  GET_PLAYER_SETTINGS,
  GetEpisodeToPlayResponse,
  SAVE_PLAYER_SETTINGS,
  SavePlayerSettingsRequestBody,
  SavePlayerSettingsResponse,
} from "@phading/product_service_interface/consumer/frontend/show/interface";
import { PlayerSettings } from "@phading/product_service_interface/consumer/frontend/show/player_settings";
import { eqMessage } from "@selfage/message/test_matcher";
import {
  mouseMove,
  mouseWheel,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import "../../common/normalize_body";

function createEpisodeToPlay(): EpisodeToPlay {
  return {
    season: {
      seasonId: "season1",
      name: "This is a title",
      description: "Some kind of description",
      coverImagePath: coverImage,
      grade: 1,
    },
    publisher: {
      accountId: "accountId1",
      naturalName: "Publisher name",
      avatarSmallPath: userImage,
    },
    episode: {
      episodeId: "ep1",
      videoPath: mov,
    },
    episodes: [
      {
        episodeId: `ep1`,
        length: 120,
        name: `Episode 1`,
        publishedTime: 1719033940,
      },
    ],
  };
}

function createComment(timestampMs: number): Comment {
  return {
    author: {
      avatarSmallPath: userImage,
      naturalName: "First Second",
    },
    content: "Some some some comment comment comment comment comment",
    timestampMs: timestampMs,
  };
}

TEST_RUNNER.run({
  name: "PlayPageTest",
  cases: [
    new (class implements TestCase {
      public name =
        "SmallViewport_CommenctsCard_InfoCard_SettingsCard_ScrollDown_DockToRight_CloseCard";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        await setViewport(500, 500);
        let getEpisodeToPlayRequest: any;
        this.cut = new PlayPage(
          undefined,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              if (request.descriptor === GET_PLAYER_SETTINGS) {
                return {} as PlayerSettings;
              } else if (request.descriptor === GET_EPISODE_TO_PLAY) {
                getEpisodeToPlayRequest = request.body;
                return {
                  episode: createEpisodeToPlay(),
                } as GetEpisodeToPlayResponse;
              }
              throw new Error("Unexpected");
            }
          })(),
          (seasonId) => new MeterMock(seasonId),
          (episodeId) => new ViewSessionTrackerMock(episodeId),
          (playerSettings: PlayerSettings, episode: Episode) =>
            new PlayerMock(playerSettings, episode),
          (episodeId: string) => new CommentsCardMock(episodeId),
          (episode: EpisodeToPlay) => new InfoCardMock(episode),
          (playerSettings: PlayerSettings) =>
            new SettingsCardMock(playerSettings),
          (episodeId: string) => new CommentsPoolMock(episodeId, []),
          "ep1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        assertThat(
          getEpisodeToPlayRequest,
          eqMessage(
            {
              episodeId: "ep1",
            },
            GET_EPISODE_TO_PLAY_REQUEST_BODY,
          ),
          "GetEpisodeToPlay request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_small.png"),
          path.join(__dirname, "/golden/play_page_small.png"),
          path.join(__dirname, "/play_page_small_diff.png"),
        );

        // Execute
        this.cut.player.val.emit("showComments");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_comments_card.png"),
          path.join(__dirname, "/golden/play_page_comments_card.png"),
          path.join(__dirname, "/play_page_comments_card_diff.png"),
        );

        // Execute
        this.cut.player.val.emit("showMoreInfo");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_info_card.png"),
          path.join(__dirname, "/golden/play_page_info_card.png"),
          path.join(__dirname, "/play_page_info_card_diff.png"),
        );

        // Execute
        this.cut.player.val.emit("showSettings");

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_settings_card.png"),
          path.join(__dirname, "/golden/play_page_settings_card.png"),
          path.join(__dirname, "/play_page_settings_card_diff.png"),
        );

        // Execute
        await mouseMove(300, 300, 1);
        await mouseWheel(10, 50);
        await mouseMove(-1, -1, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_settings_card_scrolled.png"),
          path.join(__dirname, "/golden/play_page_settings_card_scrolled.png"),
          path.join(__dirname, "/play_page_settings_card_scrolled_diff.png"),
        );

        // Execute
        this.cut.dockToRightButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_settings_card_docked_to_right.png"),
          path.join(
            __dirname,
            "/golden/play_page_settings_card_docked_to_right.png",
          ),
          path.join(
            __dirname,
            "/play_page_settings_card_docked_to_right_diff.png",
          ),
        );

        // Execute
        this.cut.closeButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_closed_card.png"),
          path.join(__dirname, "/golden/play_page_small.png"),
          path.join(__dirname, "/play_page_closed_card_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "LargeViewport_CommentsCard_DockToBottom_CloseCard";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        await setViewport(1400, 1400);
        this.cut = new PlayPage(
          undefined,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              if (request.descriptor === GET_PLAYER_SETTINGS) {
                return {} as PlayerSettings;
              } else if (request.descriptor === GET_EPISODE_TO_PLAY) {
                return {
                  episode: createEpisodeToPlay(),
                } as GetEpisodeToPlayResponse;
              }
              throw new Error("Unexpected");
            }
          })(),
          (seasonId) => new MeterMock(seasonId),
          (episodeId) => new ViewSessionTrackerMock(episodeId),
          (playerSettings: PlayerSettings, episode: Episode) =>
            new PlayerMock(playerSettings, episode),
          (episodeId: string) => new CommentsCardMock(episodeId),
          (episode: EpisodeToPlay) => new InfoCardMock(episode),
          (playerSettings: PlayerSettings) =>
            new SettingsCardMock(playerSettings),
          (episodeId: string) => new CommentsPoolMock(episodeId, []),
          "ep1",
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_large.png"),
          path.join(__dirname, "/golden/play_page_large.png"),
          path.join(__dirname, "/play_page_large_diff.png"),
        );

        // Execute
        this.cut.player.val.commentButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_large_open_comments_card.png"),
          path.join(
            __dirname,
            "/golden/play_page_large_open_comments_card.png",
          ),
          path.join(__dirname, "/play_page_large_open_comments_card_diff.png"),
        );

        // Execute
        this.cut.dockToBottomButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/play_page_large_comments_card_dock_to_bottom.png",
          ),
          path.join(
            __dirname,
            "/golden/play_page_large_comments_card_dock_to_bottom.png",
          ),
          path.join(
            __dirname,
            "/play_page_large_comments_card_dock_to_bottom_diff.png",
          ),
        );

        // Execute
        this.cut.closeButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_large_close_card.png"),
          path.join(__dirname, "/golden/play_page_large.png"),
          path.join(__dirname, "/play_page_large_close_card_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "PlayWhileMeteringAndTrackingViewSessionAndAddingComments_ScrollDown";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        let meterMock: MeterMock;
        let trackerMock: ViewSessionTrackerMock;
        let playerMock: PlayerMock;
        this.cut = new PlayPage(
          window,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              if (request.descriptor === GET_PLAYER_SETTINGS) {
                return {} as PlayerSettings;
              } else if (request.descriptor === GET_EPISODE_TO_PLAY) {
                return {
                  episode: createEpisodeToPlay(),
                } as GetEpisodeToPlayResponse;
              }
              throw new Error("Unexpected");
            }
          })(),
          (seasonId) => {
            meterMock = new MeterMock(seasonId);
            return meterMock;
          },
          (episodeId) => {
            trackerMock = new ViewSessionTrackerMock(episodeId);
            return trackerMock;
          },
          (playerSettings: PlayerSettings, episode: Episode) => {
            playerMock = new PlayerMock(playerSettings, episode);
            return playerMock;
          },
          (episodeId: string) => new CommentsCardMock(episodeId),
          (episode: EpisodeToPlay) => new InfoCardMock(episode),
          (playerSettings: PlayerSettings) =>
            new SettingsCardMock(playerSettings),
          (episodeId: string) =>
            new CommentsPoolMock(episodeId, [
              createComment(10),
              createComment(20),
              createComment(1000),
              createComment(1300),
              createComment(1500),
              createComment(1500),
            ]),
          "ep1",
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Execute
        playerMock.nextVideoTimestamp = 0;
        this.cut.player.val.emit("playing");

        // Verify
        assertThat(meterMock.currentSeasonId, eq("season1"), "meter season id");
        assertThat(meterMock.currentTimestampMs, eq(0), "meter watch start");
        assertThat(
          trackerMock.currentEpisodeId,
          eq("ep1"),
          "tracker episode id",
        );
        assertThat(
          trackerMock.currentTimestampMs,
          eq(0),
          "tracker watch start",
        );

        // Execute
        await new Promise<void>((resolve) => setTimeout(resolve, 60));
        playerMock.nextVideoTimestamp = 30;
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        // Verify
        assertThat(meterMock.currentTimestampMs, eq(30), "meter watch update");

        // Execute
        this.cut.player.val.emit("notPlaying");

        // Verify
        assertThat(
          meterMock.currentTimestampMs,
          eq(undefined),
          "meter watch stop",
        );
        assertThat(
          trackerMock.currentTimestampMs,
          eq(30),
          "tracker watch stop",
        );
        this.cut.player.val.commentButton.val.click();
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_added_comments.png"),
          path.join(__dirname, "/golden/play_page_added_comments.png"),
          path.join(__dirname, "/play_page_added_comments_diff.png"),
        );

        // Execute
        this.cut.player.val.emit("playing");

        // Verify
        assertThat(meterMock.currentTimestampMs, eq(30), "meter watch start 2");
        assertThat(
          trackerMock.currentTimestampMs,
          eq(30),
          "tracker watch start 2",
        );

        // Execute
        await new Promise<void>((resolve) => setTimeout(resolve, 60));
        playerMock.nextVideoTimestamp = 1600;
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        // Verify
        assertThat(
          meterMock.currentTimestampMs,
          eq(1600),
          "meter watch update 2",
        );

        // Execute
        this.cut.player.val.emit("notPlaying");

        // Verify
        assertThat(
          meterMock.currentTimestampMs,
          eq(undefined),
          "meter watch stop 2",
        );
        assertThat(
          trackerMock.currentTimestampMs,
          eq(1600),
          "tracker watch stop 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_added_more_comments.png"),
          path.join(__dirname, "/golden/play_page_added_more_comments.png"),
          path.join(__dirname, "/play_page_added_more_comments_diff.png"),
        );

        // Execute
        await mouseMove(300, 500, 1);
        await mouseWheel(10, 30);
        await mouseMove(-1, -1, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_scrolled_down_comments.png"),
          path.join(__dirname, "/golden/play_page_scrolled_down_comments.png"),
          path.join(__dirname, "/play_page_scrolled_down_comments_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "FocusAccount_PlayNextEpisode";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        this.cut = new PlayPage(
          undefined,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              if (request.descriptor === GET_PLAYER_SETTINGS) {
                return {} as PlayerSettings;
              } else if (request.descriptor === GET_EPISODE_TO_PLAY) {
                return {
                  episode: createEpisodeToPlay(),
                } as GetEpisodeToPlayResponse;
              }
              throw new Error("Unexpected");
            }
          })(),
          (seasonId) => new MeterMock(seasonId),
          (episodeId) => new ViewSessionTrackerMock(episodeId),
          (playerSettings: PlayerSettings, episode: Episode) =>
            new PlayerMock(playerSettings, episode),
          (episodeId: string) => new CommentsCardMock(episodeId),
          (episode: EpisodeToPlay) => new InfoCardMock(episode),
          (playerSettings: PlayerSettings) =>
            new SettingsCardMock(playerSettings),
          (episodeId: string) => new CommentsPoolMock(episodeId, []),
          "ep1",
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let accountIdCaptured: string;
        this.cut.on(
          "focusAccount",
          (accountId) => (accountIdCaptured = accountId),
        );

        // Execute
        this.cut.infoCard.val.emit("focusAccount", "accountId1");

        // Verify
        assertThat(accountIdCaptured, eq("accountId1"), "focused account");

        // Prepare
        let nextEpisode: string;
        this.cut.on("play", (episodeId) => {
          nextEpisode = episodeId;
        });

        // Execute
        this.cut.infoCard.val.emit("play", "ep2");

        // Verify
        assertThat(nextEpisode, eq("ep2"), "next episode");
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SaveSettings_ApplySettings";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        let savePlayerSettingsRequest: any;
        let playerMock: PlayerMock;
        this.cut = new PlayPage(
          window,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              if (request.descriptor === GET_PLAYER_SETTINGS) {
                return {} as PlayerSettings;
              } else if (request.descriptor === GET_EPISODE_TO_PLAY) {
                return {
                  episode: createEpisodeToPlay(),
                } as GetEpisodeToPlayResponse;
              } else if (request.descriptor === SAVE_PLAYER_SETTINGS) {
                savePlayerSettingsRequest = request.body;
                return {} as SavePlayerSettingsResponse;
              }
              throw new Error("Unexpected");
            }
          })(),
          (seasonId) => new MeterMock(seasonId),
          (episodeId) => new ViewSessionTrackerMock(episodeId),
          (playerSettings: PlayerSettings, episode: Episode) => {
            playerMock = new PlayerMock(playerSettings, episode);
            return playerMock;
          },
          (episodeId: string) => new CommentsCardMock(episodeId),
          (episode: EpisodeToPlay) => new InfoCardMock(episode),
          (playerSettings: PlayerSettings) =>
            new SettingsCardMock(playerSettings),
          (episodeId: string) =>
            new CommentsPoolMock(episodeId, [
              createComment(10),
              createComment(20),
            ]),
          "ep1",
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Execute
        this.cut.player.val.emit("updateSettings");

        // Verify
        assertThat(
          (savePlayerSettingsRequest as SavePlayerSettingsRequestBody)
            .playerSettings.videoSettings.playbackSpeed,
          eq(1),
          "spot check playback speed",
        );

        // Prepare
        // Add danmaku to apply settings.
        playerMock.nextVideoTimestamp = 0;
        this.cut.player.val.emit("playing");
        await new Promise<void>((resolve) => setTimeout(resolve, 60));
        playerMock.nextVideoTimestamp = 30;
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
        this.cut.player.val.emit("notPlaying");

        // Execute
        this.cut.settingsCard.val.opacityOption.val.valueInput.val.value = "40";
        this.cut.settingsCard.val.opacityOption.val.valueInput.val.dispatchEvent(
          new KeyboardEvent("blur"),
        );

        // Verify
        assertThat(
          (savePlayerSettingsRequest as SavePlayerSettingsRequestBody)
            .playerSettings.danmakuSettings.opacity,
          eq(40),
          "updated opacity",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_updated_opacity.png"),
          path.join(__dirname, "/golden/play_page_updated_opacity.png"),
          path.join(__dirname, "/play_page_updated_opacity_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
