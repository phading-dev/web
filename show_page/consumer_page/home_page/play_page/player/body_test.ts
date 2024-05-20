import mov = require("./test_data/mov1.mp4");
import path = require("path");
import { Player } from "./body";
import { DanmakuCanvasMock } from "./danmaku_canvas/body_mock";
import {
  PlayerSettings,
  StackingMethod,
} from "@phading/product_service_interface/consumer/show_app/player_settings";
import { Liking } from "@phading/product_service_interface/consumer/show_app/show";
import {
  LIKE_SHOW,
  LIKE_SHOW_REQUEST_BODY,
  SAVE_PLAYER_SETTINGS,
  SAVE_PLAYER_SETTINGS_REQUEST_BODY,
} from "@phading/product_service_interface/consumer/show_app/web/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import {
  mouseClick,
  mouseDown,
  mouseMove,
  mouseUp,
  setViewport,
  touchEnd,
  touchMove,
  touchStart,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq, eqAppr, le } from "@selfage/test_matcher";
import { WebServiceClient } from "@selfage/web_service_client";
import "../../../../../common/normalize_body";

// Make sure every test gets its own copy.
function createPlayerSettings(): PlayerSettings {
  return {
    videoSettings: {
      muted: false,
      volume: 0.5,
      playbackSpeed: 1,
    },
    danmakuSettings: {
      enable: true,
      stackingMethod: StackingMethod.TOP_DOWN,
      density: 100,
      topMargin: 0,
      bottomMargin: 0,
      fontSize: 18,
      opacity: 80,
      speed: 100,
      fontFamily: "cursive",
    },
  };
}

TEST_RUNNER.run({
  name: "PlayerTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_MoveToShowActions_ClickToPlay_PlayToTheEnd";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        this.cut = new Player(
          (callback, ms) => window.setTimeout(callback, ms),
          (id) => window.clearTimeout(id),
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(reservedBottomMargin, 5, danmakuSettigns),
          undefined,
          createPlayerSettings(),
          {
            videoPath: mov,
            liking: Liking.NEUTRAL,
          },
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_default.png"),
          path.join(__dirname, "/golden/player_default.png"),
          path.join(__dirname, "/player_default_diff.png"),
        );

        // Execute
        this.cut.showActions();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_show_actions.png"),
          path.join(__dirname, "/golden/player_show_actions.png"),
          path.join(__dirname, "/player_show_actions_diff.png"),
        );

        // Execute
        await mouseClick(1, 100);
        // Waits for roughly 1 sec.
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));

        // Verify
        assertThat(this.cut.video.currentTime, eqAppr(1, 0.1), "current time");

        // Execute
        await new Promise<void>((resolve) => this.cut.once("ended", resolve));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_play_ended.png"),
          path.join(__dirname, "/golden/player_play_ended.png"),
          path.join(__dirname, "/player_play_ended_diff.png"),
        );

        // Execute
        // To play
        await mouseClick(5, 5);

        // Verify
        // Restarted.
        assertThat(
          this.cut.video.currentTime,
          le(0.1),
          "current time restarted",
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Mobile";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(400, 800);
        this.cut = new Player(
          (callback, ms) => window.setTimeout(callback, ms),
          (id) => window.clearTimeout(id),
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(reservedBottomMargin, 5, danmakuSettigns),
          undefined,
          createPlayerSettings(),
          {
            videoPath: mov,
            liking: Liking.NEUTRAL,
          },
        );

        // Execute
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );
        this.cut.showActions();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_mobile.png"),
          path.join(__dirname, "/golden/player_mobile.png"),
          path.join(__dirname, "/player_mobile_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SkipForward3times_SkipBackward3times";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        this.cut = new Player(
          (callback, ms) => 1,
          (id) => {},
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(reservedBottomMargin, 5, danmakuSettigns),
          undefined,
          createPlayerSettings(),
          {
            videoPath: mov,
            liking: Liking.NEUTRAL,
          },
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );

        // Execute
        this.cut.skipForwardButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_skip_forward.png"),
          path.join(__dirname, "/golden/player_skip_forward.png"),
          path.join(__dirname, "/player_skip_forward_diff.png"),
        );

        // Execute
        this.cut.showActions();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_skip_forward_with_actions.png"),
          path.join(__dirname, "/golden/player_skip_forward_with_actions.png"),
          path.join(__dirname, "/player_skip_forward_with_actions_diff.png"),
        );

        // Execute
        this.cut.skipForwardButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_skip_forward_2_with_actions.png"),
          path.join(
            __dirname,
            "/golden/player_skip_forward_2_with_actions.png",
          ),
          path.join(__dirname, "/player_skip_forward_2_with_actions_diff.png"),
          {
            excludedAreas: [
              {
                x: 90,
                y: 190,
                width: 210,
                height: 250,
              },
            ],
          },
        );

        // Execute
        this.cut.hideActions();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_skip_forward_2.png"),
          path.join(__dirname, "/golden/player_skip_forward_2.png"),
          path.join(__dirname, "/player_skip_forward_2_diff.png"),
          {
            excludedAreas: [
              {
                x: 90,
                y: 190,
                width: 210,
                height: 250,
              },
            ],
          },
        );

        // Execute
        this.cut.skipForwardButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_skip_forward_3.png"),
          path.join(__dirname, "/golden/player_skip_forward_3.png"),
          path.join(__dirname, "/player_skip_forward_3_diff.png"),
          {
            excludedAreas: [
              {
                x: 90,
                y: 190,
                width: 210,
                height: 250,
              },
            ],
          },
        );

        // Execute
        this.cut.skipBackwardButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_skip_backward.png"),
          path.join(__dirname, "/golden/player_skip_backward.png"),
          path.join(__dirname, "/player_skip_backward_diff.png"),
        );

        // Execute
        this.cut.skipBackwardButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_skip_backward_2.png"),
          path.join(__dirname, "/golden/player_skip_backward_2.png"),
          path.join(__dirname, "/player_skip_backward_2_diff.png"),
        );

        // Execute
        this.cut.skipBackwardButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_skip_backward_3.png"),
          path.join(__dirname, "/golden/player_skip_backward_3.png"),
          path.join(__dirname, "/player_skip_backward_3_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "MouseMove_Down_Move_MoveTo0_Up_Move";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        this.cut = new Player(
          (callback, ms) => 1,
          (id) => {},
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(reservedBottomMargin, 5, danmakuSettigns),
          undefined,
          createPlayerSettings(),
          {
            videoPath: mov,
            liking: Liking.NEUTRAL,
          },
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );
        // await stall(100000);

        // Execute
        await mouseMove(5, 530, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_expand_progress_bar.png"),
          path.join(__dirname, "/golden/player_expand_progress_bar.png"),
          path.join(__dirname, "/player_expand_progress_bar_diff.png"),
        );

        // Execute
        await mouseMove(30, 530, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_progress_before_seeking.png"),
          path.join(__dirname, "/golden/player_progress_before_seeking.png"),
          path.join(__dirname, "/player_progress_before_seeking_diff.png"),
        );

        // Execute
        await mouseDown();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_progress_seeking.png"),
          path.join(__dirname, "/golden/player_progress_seeking.png"),
          path.join(__dirname, "/player_progress_seeking_diff.png"),
        );

        // Execute
        await mouseMove(-10, 300, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_progress_seeking_to_0.png"),
          path.join(__dirname, "/golden/player_progress_seeking_to_0.png"),
          path.join(__dirname, "/player_progress_seeking_to_0_diff.png"),
        );

        // Execute
        await mouseUp();
        await mouseMove(590, 530, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_progress_seeking_ended_moved.png"),
          path.join(
            __dirname,
            "/golden/player_progress_seeking_ended_moved.png",
          ),
          path.join(__dirname, "/player_progress_seeking_ended_moved_diff.png"),
        );

        // Execute
        await mouseMove(590, 550, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_collapse_progress_bar.png"),
          path.join(__dirname, "/golden/player_collapse_progress_bar.png"),
          path.join(__dirname, "/player_collapse_progress_bar_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TouchProgressBar_MoveTo100_End";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        this.cut = new Player(
          (callback, ms) => 1,
          (id) => {},
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(reservedBottomMargin, 5, danmakuSettigns),
          undefined,
          createPlayerSettings(),
          {
            videoPath: mov,
            liking: Liking.NEUTRAL,
          },
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );

        // Execute
        await touchStart(60, 530);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_touched_progress.png"),
          path.join(__dirname, "/golden/player_touched_progress.png"),
          path.join(__dirname, "/player_touched_progress_diff.png"),
        );

        // Execute
        await touchMove(620, 600);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_touch_moved_to_100.png"),
          path.join(__dirname, "/golden/player_touch_moved_to_100.png"),
          path.join(__dirname, "/player_touch_moved_to_100_diff.png"),
          {
            excludedAreas: [
              {
                x: 100,
                y: 190,
                width: 200,
                height: 210,
              },
            ],
          },
        );

        // Execute
        await touchEnd();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_touch_ended_progress.png"),
          path.join(__dirname, "/golden/player_touch_ended_progress.png"),
          path.join(__dirname, "/player_touch_ended_progress_diff.png"),
          {
            excludedAreas: [
              {
                x: 100,
                y: 190,
                width: 200,
                height: 210,
              },
            ],
          },
        );
      }
      public async tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SpeedUpToMax_SpeedDownMax";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        let playerSettings = createPlayerSettings();
        let requestCaptured: any;
        let responseToSend: any;
        this.cut = new Player(
          (callback, ms) => 1,
          (id) => {},
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(reservedBottomMargin, 5, danmakuSettigns),
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<any> {
              requestCaptured = request;
              return responseToSend;
            }
          })(),
          playerSettings,
          {
            videoPath: mov,
            liking: Liking.NEUTRAL,
          },
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );

        // Execute
        this.cut.showActions();
        this.cut.speedUpbutton.click();

        // Verify
        assertThat(
          requestCaptured.descriptor,
          eq(SAVE_PLAYER_SETTINGS),
          "service",
        );
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              playerSettings,
            },
            SAVE_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "request body",
        );
        assertThat(
          playerSettings.videoSettings.playbackSpeed,
          eq(1.25),
          "speed",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_speed_up.png"),
          path.join(__dirname, "/golden/player_speed_up.png"),
          path.join(__dirname, "/player_speed_up_diff.png"),
        );

        // Execute
        this.cut.speedUpbutton.click();

        // Verify
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              playerSettings,
            },
            SAVE_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "request body 2",
        );
        assertThat(
          playerSettings.videoSettings.playbackSpeed,
          eq(1.5),
          "speed 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_speed_up_2.png"),
          path.join(__dirname, "/golden/player_speed_up_2.png"),
          path.join(__dirname, "/player_speed_up_2_diff.png"),
        );

        // Execute
        for (let i = 0; i < 6; i++) {
          this.cut.speedUpbutton.click();
        }

        // Verify
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              playerSettings,
            },
            SAVE_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "request body 3",
        );
        assertThat(
          playerSettings.videoSettings.playbackSpeed,
          eq(4),
          "speed 3",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_speed_up_max.png"),
          path.join(__dirname, "/golden/player_speed_up_max.png"),
          path.join(__dirname, "/player_speed_up_max_diff.png"),
        );

        // Execute
        await mouseClick(5, 5);
        let startTime = Date.now();
        await new Promise<void>((resolve) => this.cut.once("ended", resolve));
        let elapsedTime = Date.now() - startTime;

        // Verify
        assertThat(elapsedTime, eqAppr(2700, 0.1), "max speed playback time");

        // Execute
        for (let i = 0; i < 11; i++) {
          this.cut.speedDownButton.click();
        }

        // Verify
        // Make sure not to hide actions.
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              playerSettings,
            },
            SAVE_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "request body 4",
        );
        assertThat(
          playerSettings.videoSettings.playbackSpeed,
          eq(0.25),
          "speed 4",
        );
        await mouseMove(10, 5, 1);
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_speed_down_max.png"),
          path.join(__dirname, "/golden/player_speed_down_max.png"),
          path.join(__dirname, "/player_speed_down_max_diff.png"),
          {
            excludedAreas: [
              {
                x: 100,
                y: 190,
                width: 200,
                height: 210,
              },
            ],
          },
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "EnableLooping_DisableLooping";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        this.cut = new Player(
          (callback, ms) => 1,
          (id) => {},
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(reservedBottomMargin, 5, danmakuSettigns),
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(): Promise<any> {
              return {};
            }
          })(),
          createPlayerSettings(),
          {
            videoPath: mov,
            liking: Liking.NEUTRAL,
          },
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );
        // 4x speed
        for (let i = 0; i < 7; i++) {
          this.cut.speedUpbutton.click();
        }

        // Execute
        this.cut.noLoopButton.click();

        // Verify
        this.cut.showActions();
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_enabled_looping.png"),
          path.join(__dirname, "/golden/player_enabled_looping.png"),
          path.join(__dirname, "/player_enabled_looping_diff.png"),
        );

        // Execute
        await mouseClick(5, 5);
        await new Promise<void>((resolve) => setTimeout(resolve, 3000));

        // Verify
        // Looped.
        assertThat(
          this.cut.video.currentTime,
          le(4),
          "current video time in a new loop",
        );

        // Prepare
        await mouseClick(5, 5);

        // Execute
        this.cut.loopButton.click();

        // Verify
        this.cut.showActions();
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_disabled_looping.png"),
          path.join(__dirname, "/golden/player_disabled_looping.png"),
          path.join(__dirname, "/player_disabled_looping_diff.png"),
          {
            excludedAreas: [
              {
                x: 0,
                y: 100,
                width: 600,
                height: 500,
              },
            ],
          },
        );

        // Execute
        await mouseClick(5, 5);

        // Verify
        // Vidoe can be ended.
        await new Promise<void>((resolve) => this.cut.once("ended", resolve));
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "MouseChangingVolume_Mute_ChangeWhenMuted_UnmuteToRestore";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        let requestCaptured: any;
        let responseToReturn: any;
        let playerSettings = createPlayerSettings();
        this.cut = new Player(
          (callback, ms) => 1,
          (id) => {},
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(reservedBottomMargin, 5, danmakuSettigns),
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<void> {
              requestCaptured = request;
              return responseToReturn;
            }
          })(),
          playerSettings,
          {
            videoPath: mov,
            liking: Liking.NEUTRAL,
          },
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );

        // Execute
        await mouseMove(560, 293, 1);
        await mouseDown();

        // Verify
        assertThat(this.cut.video.volume, eqAppr(0.1), "volume 1");
        assertThat(
          requestCaptured.descriptor,
          eq(SAVE_PLAYER_SETTINGS),
          "service",
        );
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              playerSettings,
            },
            SAVE_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "request body",
        );
        assertThat(
          playerSettings.videoSettings.volume,
          eqAppr(0.1),
          "volume in video settings",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_volume_changing.png"),
          path.join(__dirname, "/golden/player_volume_changing.png"),
          path.join(__dirname, "/player_volume_changing_diff.png"),
        );

        // Execute
        await mouseMove(300, 220, 1);
        await mouseUp();

        // Verify
        assertThat(this.cut.video.volume, eq(1), "volume 2");
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              playerSettings,
            },
            SAVE_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "request body",
        );
        assertThat(
          playerSettings.videoSettings.volume,
          eqAppr(1),
          "volume 2 in video settings",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_volume_changing_max.png"),
          path.join(__dirname, "/golden/player_volume_changing_max.png"),
          path.join(__dirname, "/player_volume_changing_max_diff.png"),
        );

        // Execute
        this.cut.volumeButton.click();

        // Verify
        assertThat(this.cut.video.volume, eq(0), "volume muted");
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              playerSettings,
            },
            SAVE_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "request body",
        );
        assertThat(
          playerSettings.videoSettings.muted,
          eq(true),
          "muted in video settings",
        );
        assertThat(
          playerSettings.videoSettings.volume,
          eqAppr(1),
          "original volume when muted in video settings",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_volume_muted.png"),
          path.join(__dirname, "/golden/player_volume_muted.png"),
          path.join(__dirname, "/player_volume_muted_diff.png"),
        );

        // Execute
        await mouseClick(560, 286);

        // Verify
        assertThat(this.cut.video.volume, eq(0), "volume remain muted");
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              playerSettings,
            },
            SAVE_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "request body",
        );
        assertThat(
          playerSettings.videoSettings.muted,
          eq(true),
          "remain muted in video settings",
        );
        assertThat(
          playerSettings.videoSettings.volume,
          eqAppr(0.2),
          "changed volume when muted in video settings",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_volume_remain_muted.png"),
          path.join(__dirname, "/golden/player_volume_remain_muted.png"),
          path.join(__dirname, "/player_volume_remain_muted_diff.png"),
        );

        // Execute
        this.cut.volumeMutedButton.click();

        // Verify
        assertThat(this.cut.video.volume, eqAppr(0.2), "volume restored");
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              playerSettings,
            },
            SAVE_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "request body",
        );
        assertThat(
          playerSettings.videoSettings.muted,
          eq(false),
          "un-muted in video settings",
        );
        assertThat(
          playerSettings.videoSettings.volume,
          eqAppr(0.2),
          "restored volume when un-muted in video settings",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_volume_restored.png"),
          path.join(__dirname, "/golden/player_volume_restored.png"),
          path.join(__dirname, "/player_volume_restored_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "AddDanmaku_UpdateSettings_Disable_Reenable";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        let requestCaptured: any;
        let responseToReturn: any;
        let playerSettings = createPlayerSettings();
        this.cut = new Player(
          (callback, ms) => 1,
          (id) => {},
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(reservedBottomMargin, 5, danmakuSettigns),
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<void> {
              requestCaptured = request;
              return responseToReturn;
            }
          })(),
          playerSettings,
          {
            videoPath: mov,
            liking: Liking.NEUTRAL,
          },
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );
        // .25x speed
        for (let i = 0; i < 3; i++) {
          this.cut.speedDownButton.click();
        }

        // Execute
        await mouseClick(5, 5);
        // Only when the video is playing, we can add danmaku.
        this.cut.addDanmaku([
          {
            content: "This is some content.",
          },
          {
            content: "This is some content 2.",
          },
        ]);
        await mouseClick(5, 5);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_added_danmaku.png"),
          path.join(__dirname, "/golden/player_added_danmaku.png"),
          path.join(__dirname, "/player_added_danmaku_diff.png"),
          {
            excludedAreas: [
              {
                x: 0,
                y: 130,
                width: 600,
                height: 340,
              },
            ],
          },
        );

        // Execute
        playerSettings.danmakuSettings.fontFamily = "Aria";
        this.cut.updateSettings();

        // Verify
        assertThat(
          requestCaptured.descriptor,
          eq(SAVE_PLAYER_SETTINGS),
          "service",
        );
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              playerSettings,
            },
            SAVE_PLAYER_SETTINGS_REQUEST_BODY,
          ),
          "request body",
        );
        assertThat(
          playerSettings.danmakuSettings.fontFamily,
          eq("Aria"),
          "font",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_update_danmaku_settings.png"),
          path.join(__dirname, "/golden/player_update_danmaku_settings.png"),
          path.join(__dirname, "/player_update_danmaku_settings_diff.png"),
          {
            excludedAreas: [
              {
                x: 0,
                y: 130,
                width: 600,
                height: 340,
              },
            ],
          },
        );

        // Execute
        this.cut.danmakuButton.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_danmaku_disabled.png"),
          path.join(__dirname, "/golden/player_danmaku_disabled.png"),
          path.join(__dirname, "/player_danmaku_disabled_diff.png"),
          {
            excludedAreas: [
              {
                x: 0,
                y: 130,
                width: 600,
                height: 340,
              },
            ],
          },
        );

        // Execute
        await mouseClick(5, 5);
        // Only when the video is playing, we can add danmaku.
        this.cut.addDanmaku([
          {
            content: "This is some content.",
          },
          {
            content: "This is some content 2.",
          },
        ]);
        await mouseClick(5, 5);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_danmaku_not_added.png"),
          path.join(__dirname, "/golden/player_danmaku_disabled.png"),
          path.join(__dirname, "/player_danmaku_not_added_diff.png"),
          {
            excludedAreas: [
              {
                x: 0,
                y: 130,
                width: 600,
                height: 340,
              },
            ],
          },
        );

        // Execute
        this.cut.noDanmakuButton.click();

        // Verify
        await mouseClick(5, 5);
        // Only when the video is playing, we can add danmaku.
        this.cut.addDanmaku([
          {
            content: "This is some content.",
          },
          {
            content: "This is some content 2.",
          },
        ]);
        await mouseClick(5, 5);
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_danmaku_reenabled.png"),
          path.join(__dirname, "/golden/player_update_danmaku_settings.png"),
          path.join(__dirname, "/player_danmaku_reenabled_diff.png"),
          {
            excludedAreas: [
              {
                x: 0,
                y: 130,
                width: 600,
                height: 340,
              },
            ],
          },
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "LikeShow";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        let requestCaptured: any;
        let responseToReturn: any;
        this.cut = new Player(
          (callback, ms) => 1,
          (id) => {},
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(reservedBottomMargin, 5, danmakuSettigns),
          new (class extends WebServiceClient {
            public constructor() {
              super(undefined, undefined);
            }
            public async send(request: any): Promise<void> {
              requestCaptured = request;
              return responseToReturn;
            }
          })(),
          createPlayerSettings(),
          {
            showId: "id1",
            videoPath: mov,
            liking: Liking.NEUTRAL,
          },
        );
        document.body.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );

        // Execute
        this.cut.showActions();
        this.cut.likeDislikeButtons.thumbUpButton.val.click();

        // Verify
        assertThat(requestCaptured.descriptor, eq(LIKE_SHOW), "service");
        assertThat(
          requestCaptured.body,
          eqMessage(
            {
              liking: Liking.LIKE,
              showId: "id1",
            },
            LIKE_SHOW_REQUEST_BODY,
          ),
          "request body",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_liked_show.png"),
          path.join(__dirname, "/golden/player_liked_show.png"),
          path.join(__dirname, "/player_liked_show_diff.png"),
        );
      }
      public async tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ShowSettings_ShowComment_ShowMoreInfo";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        this.cut = new Player(
          (callback, ms) => 1,
          (id) => {},
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(reservedBottomMargin, 5, danmakuSettigns),
          undefined,
          createPlayerSettings(),
          {
            videoPath: mov,
            liking: Liking.NEUTRAL,
          },
        );
        document.body.append(this.cut.body);
        let showSettings = false;
        this.cut.on("showSettings", () => (showSettings = true));

        // Execute
        this.cut.settingsButton.click();

        // Verify
        assertThat(showSettings, eq(true), "show settings");

        // Prepare
        let showComments = false;
        this.cut.on("showComments", () => (showComments = true));

        // Execute
        this.cut.commentButton.click();

        // Verify
        assertThat(showComments, eq(true), "show comments");

        // Prepare
        let showMoreInfo = false;
        this.cut.on("showMoreInfo", () => (showMoreInfo = true));

        // Execute
        this.cut.moreInfoButton.click();

        // Verify
        assertThat(showMoreInfo, eq(true), "show more info");
      }
      public async tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
