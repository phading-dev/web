import mov = require("./test_data/mov1.mp4");
import userImage = require("./test_data/user_image.jpg");
import path = require("path");
import { PlayPage } from "./body";
import { CommentsCardMock } from "./comments_card/body_mock";
import { CommentsPoolMock } from "./comments_pool_mock";
import { InfoCardMock } from "./info_card/body_mock";
import { PlayerMock } from "./player/body_mock";
import { SettingsCardMock } from "./settings_card/body_mock";
import { Comment } from "@phading/comment_service_interface/show_app/comment";
import { PlayerSettings } from "@phading/product_service_interface/consumer/show_app/player_settings";
import { Show } from "@phading/product_service_interface/consumer/show_app/show";
import {
  GET_PLAYER_SETTINGS,
  SAVE_PLAYER_SETTINGS,
  SavePlayerSettingsRequestBody,
  SavePlayerSettingsResponse,
} from "@phading/product_service_interface/consumer/show_app/web/interface";
import {
  mouseMove,
  mouseWheel,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { WebServiceClientMock } from "@selfage/web_service_client/client_mock";
import "../../../../common/normalize_body";

function createComment(timestamp: number): Comment {
  return {
    author: {
      avatarSmallPath: userImage,
      naturalName: "First Second",
    },
    content: "Some some some comment comment comment comment comment",
    timestamp: timestamp,
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
        this.cut = new PlayPage(
          undefined,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              assertThat(
                request.descriptor,
                eq(GET_PLAYER_SETTINGS),
                "GetPlayerSettings service",
              );
              return {} as PlayerSettings;
            }
          })(),
          (playerSettings: PlayerSettings, show: Show) =>
            new PlayerMock(playerSettings, show),
          (showId: string) => new CommentsCardMock(showId),
          (show: Show) => new InfoCardMock(show),
          (playerSettings: PlayerSettings) =>
            new SettingsCardMock(playerSettings),
          (showId: string) => new CommentsPoolMock(showId, []),
          {
            showId: "id1",
            videoPath: mov,
            name: "This is a title",
            description: "Some kind of description",
            publishedTime: 1716826339, // 2024/05/27
            publisher: {
              naturalName: "Publisher name",
              avatarSmallPath: userImage,
            },
          },
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_small.png"),
          path.join(__dirname, "/golden/play_page_small.png"),
          path.join(__dirname, "/play_page_small_diff.png"),
        );

        // Execute
        this.cut.player.val.emit("showComments");

        // await stall(1000000);

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
              return {} as PlayerSettings;
            }
          })(),
          (playerSettings: PlayerSettings, show: Show) =>
            new PlayerMock(playerSettings, show),
          (showId: string) => new CommentsCardMock(showId),
          (show: Show) => new InfoCardMock(show),
          (playerSettings: PlayerSettings) =>
            new SettingsCardMock(playerSettings),
          (showId: string) => new CommentsPoolMock(showId, []),
          {
            showId: "id1",
            videoPath: mov,
            name: "This is a title",
            description: "Some kind of description",
            publishedTime: 1716826339, // 2024/05/27
            publisher: {
              naturalName: "Publisher name",
              avatarSmallPath: userImage,
            },
          },
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
      public name = "AddComments_ScrollDown";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        let playerMock: PlayerMock;
        this.cut = new PlayPage(
          window,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              return {} as PlayerSettings;
            }
          })(),
          (playerSettings: PlayerSettings, show: Show) => {
            playerMock = new PlayerMock(playerSettings, show);
            return playerMock;
          },
          (showId: string) => new CommentsCardMock(showId),
          (show: Show) => new InfoCardMock(show),
          (playerSettings: PlayerSettings) =>
            new SettingsCardMock(playerSettings),
          (showId: string) =>
            new CommentsPoolMock(showId, [
              createComment(10),
              createComment(20),
              createComment(1000),
              createComment(1300),
              createComment(1500),
              createComment(1500),
            ]),
          {
            showId: "id1",
            videoPath: mov,
            name: "This is a title",
            description: "Some kind of description",
            publishedTime: 1716826339, // 2024/05/27
            publisher: {
              naturalName: "Publisher name",
              avatarSmallPath: userImage,
            },
          },
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));

        // Execute
        playerMock.nextVideoTimestamp = 0;
        this.cut.player.val.emit("playing");
        await new Promise<void>((resolve) => setTimeout(resolve, 20));
        playerMock.nextVideoTimestamp = 30;
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
        this.cut.player.val.emit("notPlaying");

        // Verify
        this.cut.player.val.commentButton.val.click();
        await asyncAssertScreenshot(
          path.join(__dirname, "/play_page_added_comments.png"),
          path.join(__dirname, "/golden/play_page_added_comments.png"),
          path.join(__dirname, "/play_page_added_comments_diff.png"),
        );

        // Execute
        this.cut.player.val.emit("playing");
        await new Promise<void>((resolve) => setTimeout(resolve, 50));
        playerMock.nextVideoTimestamp = 1600;
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
        this.cut.player.val.emit("notPlaying");

        // Verify
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
      public name = "FocusUser";
      private cut: PlayPage;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        this.cut = new PlayPage(
          undefined,
          new (class extends WebServiceClientMock {
            public async send(request: any): Promise<any> {
              return {} as PlayerSettings;
            }
          })(),
          (playerSettings: PlayerSettings, show: Show) =>
            new PlayerMock(playerSettings, show),
          (showId: string) => new CommentsCardMock(showId),
          (show: Show) => new InfoCardMock(show),
          (playerSettings: PlayerSettings) =>
            new SettingsCardMock(playerSettings),
          (showId: string) => new CommentsPoolMock(showId, []),
          {
            showId: "id1",
            videoPath: mov,
            name: "This is a title",
            description: "Some kind of description",
            publishedTime: 1716826339, // 2024/05/27
            publisher: {
              naturalName: "Publisher name",
              avatarSmallPath: userImage,
            },
          },
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) => this.cut.once("loaded", resolve));
        let accountIdCaptured: string;
        this.cut.on(
          "focusUser",
          (accountId) => (accountIdCaptured = accountId),
        );

        // Execute
        this.cut.infoCard.val.emit("focusUser", "accountId1");

        // Verify
        assertThat(accountIdCaptured, eq("accountId1"), "focused user");
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
              if (request.descriptor === SAVE_PLAYER_SETTINGS) {
                savePlayerSettingsRequest = request.body;
                return {} as SavePlayerSettingsResponse;
              } else {
                return {} as PlayerSettings;
              }
            }
          })(),
          (playerSettings: PlayerSettings, show: Show) => {
            playerMock = new PlayerMock(playerSettings, show);
            return playerMock;
          },
          (showId: string) => new CommentsCardMock(showId),
          (show: Show) => new InfoCardMock(show),
          (playerSettings: PlayerSettings) =>
            new SettingsCardMock(playerSettings),
          (showId: string) =>
            new CommentsPoolMock(showId, [
              createComment(10),
              createComment(20),
            ]),
          {
            showId: "id1",
            videoPath: mov,
            name: "This is a title",
            description: "Some kind of description",
            publishedTime: 1716826339, // 2024/05/27
            publisher: {
              naturalName: "Publisher name",
              avatarSmallPath: userImage,
            },
          },
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
        await new Promise<void>((resolve) => setTimeout(resolve, 50));
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
