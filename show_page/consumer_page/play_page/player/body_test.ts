import mov = require("./test_data/mov1.mp4");
import path = require("path");
import { Player } from "./body";
import { DanmakuCanvasMock } from "./danmaku_canvas/body_mock";
import {
  PlayerSettings,
  StackingMethod,
} from "@phading/product_service_interface/consumer/frontend/show/player_settings";
import { E } from "@selfage/element/factory";
import {
  forceMouseUp,
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
import { assertThat, eq, eqAppr, ge, gt, le, lt } from "@selfage/test_matcher";
import "../../../../common/normalize_body";

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

let container: HTMLDivElement;

TEST_RUNNER.run({
  name: "PlayerTest",
  environment: {
    setUp: () => {
      container = E.div({
        style: "width: 100vw; height: 100vh; display: flex;",
      });
      document.body.append(container);
    },
    tearDown: () => {
      container.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Default_MoveToShowActions_ClickToPlay_ClickToPause";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        this.cut = new Player(
          window,
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(5, reservedBottomMargin, danmakuSettigns),
          createPlayerSettings(),
          {
            videoPath: mov,
          },
        );
        this.cut.autoPlay = false;

        // Execute
        container.append(this.cut.body);
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
        mouseClick(1, 100);
        await new Promise<void>((resolve) => this.cut.on("playing", resolve));
        // Waits for roughly 1 sec.
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
        mouseClick(1, 100);
        await new Promise<void>((resolve) =>
          this.cut.on("notPlaying", resolve),
        );

        // Verify
        assertThat(
          this.cut.video.val.currentTime,
          eqAppr(0.9, 0.2),
          "current time",
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "AutoPlayWithContinueTimestamp_PlayToTheEnd";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        this.cut = new Player(
          window,
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(5, reservedBottomMargin, danmakuSettigns),
          createPlayerSettings(),
          {
            videoPath: mov,
            continueTimestamp: 9,
          },
        );
        container.append(this.cut.body);

        // Execute
        await new Promise<void>((resolve) => this.cut.once("playing", resolve));
        let startTime = Date.now();
        await new Promise<void>((resolve) =>
          this.cut.once("notPlaying", resolve),
        );
        let elapsedTime = Date.now() - startTime;

        // Verify
        assertThat(elapsedTime, lt(2000), "remaining playtime");
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_play_ended.png"),
          path.join(__dirname, "/golden/player_play_ended.png"),
          path.join(__dirname, "/player_play_ended_diff.png"),
        );

        // Execute
        // To re-play
        mouseClick(5, 50);
        await new Promise<void>((resolve) => this.cut.on("playing", resolve));

        // Verify
        // Restarted.
        assertThat(
          this.cut.video.val.currentTime,
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
          window,
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(5, reservedBottomMargin, danmakuSettigns),
          createPlayerSettings(),
          {
            videoPath: mov,
          },
        );
        this.cut.autoPlay = false;

        // Execute
        container.append(this.cut.body);
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
      public name = "Interrupted";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        this.cut = new Player(
          window,
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(5, reservedBottomMargin, danmakuSettigns),
          createPlayerSettings(),
          {
            videoPath: mov,
          },
        );
        container.append(this.cut.body);

        // Execute
        await new Promise<void>((resolve) => this.cut.on("playing", resolve));
        this.cut.interrupt("Interrupted!");
        await new Promise<void>((resolve) => setTimeout(resolve, 500));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_interrupted.png"),
          path.join(__dirname, "/golden/player_interrupted.png"),
          path.join(__dirname, "/player_interrupted_diff.png"),
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
        await new Promise<void>((resolve) => setTimeout(resolve, 4500));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_interrupt_clear.png"),
          path.join(__dirname, "/golden/player_interrupt_clear.png"),
          path.join(__dirname, "/player_interrupt_clear_diff.png"),
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
          window,
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(5, reservedBottomMargin, danmakuSettigns),
          createPlayerSettings(),
          {
            videoPath: mov,
          },
        );
        this.cut.autoPlay = false;
        container.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );

        // Execute
        this.cut.skipForwardButton.val.click();

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
        this.cut.skipForwardButton.val.click();

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
        this.cut.skipForwardButton.val.click();

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
        this.cut.skipBackwardButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_skip_backward.png"),
          path.join(__dirname, "/golden/player_skip_backward.png"),
          path.join(__dirname, "/player_skip_backward_diff.png"),
        );

        // Execute
        this.cut.skipBackwardButton.val.click();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_skip_backward_2.png"),
          path.join(__dirname, "/golden/player_skip_backward_2.png"),
          path.join(__dirname, "/player_skip_backward_2_diff.png"),
        );

        // Execute
        this.cut.skipBackwardButton.val.click();

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
      public name = "ProgressBar_MouseMove_Down_Move_MoveTo0_Up_Move";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        this.cut = new Player(
          window,
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(5, reservedBottomMargin, danmakuSettigns),
          createPlayerSettings(),
          {
            videoPath: mov,
          },
        );
        this.cut.autoPlay = false;
        container.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );

        // Execute
        await mouseMove(5, 560, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_expand_progress_bar.png"),
          path.join(__dirname, "/golden/player_expand_progress_bar.png"),
          path.join(__dirname, "/player_expand_progress_bar_diff.png"),
        );

        // Execute
        await mouseMove(30, 560, 1);

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
        await mouseMove(590, 560, 1);

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
        await mouseMove(590, 530, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_collapse_progress_bar.png"),
          path.join(__dirname, "/golden/player_collapse_progress_bar.png"),
          path.join(__dirname, "/player_collapse_progress_bar_diff.png"),
        );
      }
      public async tearDown() {
        await forceMouseUp();
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
          window,
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(5, reservedBottomMargin, danmakuSettigns),
          createPlayerSettings(),
          {
            videoPath: mov,
          },
        );
        this.cut.autoPlay = false;
        container.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );

        // Execute
        await touchStart(60, 560);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_touched_progress.png"),
          path.join(__dirname, "/golden/player_touched_progress.png"),
          path.join(__dirname, "/player_touched_progress_diff.png"),
        );

        // Execute
        await touchMove(620, 640);

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
        this.cut = new Player(
          window,
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(5, reservedBottomMargin, danmakuSettigns),
          playerSettings,
          {
            videoPath: mov,
          },
        );
        this.cut.autoPlay = false;
        container.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );
        let updatedSettings = 0;
        this.cut.on("updateSettings", () => updatedSettings++);

        // Execute
        this.cut.showActions();
        this.cut.speedUpButton.val.click();

        // Verify
        assertThat(updatedSettings, eq(1), "update settings");
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

        // Prepare
        updatedSettings = 0;

        // Execute
        this.cut.speedUpButton.val.click();

        // Verify
        assertThat(updatedSettings, eq(1), "update settings again");
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

        // Prepare
        updatedSettings = 0;

        // Execute
        for (let i = 0; i < 6; i++) {
          this.cut.speedUpButton.val.click();
        }

        // Verify
        assertThat(updatedSettings, gt(1), "update settings multiple times");
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
        mouseClick(5, 50);
        let startTime = Date.now();
        await new Promise<void>((resolve) =>
          this.cut.once("notPlaying", resolve),
        );
        let elapsedTime = Date.now() - startTime;

        // Verify
        assertThat(elapsedTime, eqAppr(2700, 0.1), "max speed playback time");

        // Prepare
        updatedSettings = 0;

        // Execute
        for (let i = 0; i < 11; i++) {
          this.cut.speedDownButton.val.click();
        }

        // Verify
        assertThat(updatedSettings, gt(1), "update settings multiple times");
        assertThat(
          playerSettings.videoSettings.playbackSpeed,
          eq(0.25),
          "speed 4",
        );
        // Make sure not to hide actions.
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
          window,
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(5, reservedBottomMargin, danmakuSettigns),
          createPlayerSettings(),
          {
            videoPath: mov,
          },
        );
        this.cut.autoPlay = false;
        container.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );
        // 4x speed
        for (let i = 0; i < 7; i++) {
          this.cut.speedUpButton.val.click();
        }

        // Execute
        this.cut.noLoopButton.val.click();

        // Verify
        this.cut.showActions();
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_enabled_looping.png"),
          path.join(__dirname, "/golden/player_enabled_looping.png"),
          path.join(__dirname, "/player_enabled_looping_diff.png"),
        );

        // Execute
        mouseClick(5, 50);
        await new Promise<void>((resolve) =>
          this.cut.on("notPlaying", resolve),
        );
        await new Promise<void>((resolve) => this.cut.on("playing", resolve));
        mouseClick(5, 50);
        await new Promise<void>((resolve) =>
          this.cut.on("notPlaying", resolve),
        );

        // Verify
        // Looped.
        assertThat(
          this.cut.video.val.currentTime,
          ge(0),
          "current video time in a new loop",
        );

        // Execute
        this.cut.loopButton.val.click();

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
        mouseClick(5, 50);

        // Verify
        await new Promise<void>((resolve) =>
          this.cut.once("notPlaying", resolve),
        );
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
        assertThat(
          this.cut.video.val.currentTime,
          gt(10),
          "current video time stays at the end",
        );
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
        let playerSettings = createPlayerSettings();
        this.cut = new Player(
          window,
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(5, reservedBottomMargin, danmakuSettigns),
          playerSettings,
          {
            videoPath: mov,
          },
        );
        this.cut.autoPlay = false;
        container.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );
        let updatedSettings = 0;
        this.cut.on("updateSettings", () => updatedSettings++);

        // Execute
        await mouseMove(570, 373, 1);
        await mouseDown();

        // Verify
        assertThat(this.cut.video.val.volume, eqAppr(0.1), "volume 1");
        assertThat(updatedSettings, eq(1), "updated settings");
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

        // Prepare
        updatedSettings = 0;

        // Execute
        await mouseMove(300, 300, 1);
        await mouseUp();

        // Verify
        assertThat(this.cut.video.val.volume, eq(1), "volume 2");
        assertThat(updatedSettings, gt(1), "updated settings 2");
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

        // Prepare
        updatedSettings = 0;

        // Execute
        this.cut.volumeButton.val.click();

        // Verify
        assertThat(this.cut.video.val.volume, eq(0), "volume muted");
        assertThat(updatedSettings, eq(1), "updated settings 3");
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

        // Prepare
        updatedSettings = 0;

        // Execute
        await mouseClick(570, 366);

        // Verify
        assertThat(this.cut.video.val.volume, eq(0), "volume remain muted");
        assertThat(updatedSettings, gt(1), "updated settings 4");
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

        // Prepare
        updatedSettings = 0;

        // Execute
        this.cut.volumeMutedButton.val.click();

        // Verify
        assertThat(this.cut.video.val.volume, eqAppr(0.2), "volume restored");
        assertThat(updatedSettings, eq(1), "updated settings 5");
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
        await forceMouseUp();
        await mouseMove(-1, -1, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "AddDanmaku_ApplySettings_Disable_Reenable";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        let playerSettings = createPlayerSettings();
        this.cut = new Player(
          window,
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(5, reservedBottomMargin, danmakuSettigns),
          playerSettings,
          {
            videoPath: mov,
          },
        );
        this.cut.autoPlay = false;
        container.append(this.cut.body);
        await new Promise<void>((resolve) =>
          this.cut.once("canplaythrough", resolve),
        );
        // .25x speed
        for (let i = 0; i < 3; i++) {
          this.cut.speedDownButton.val.click();
        }
        let updatedSettings = 0;
        this.cut.on("updateSettings", () => updatedSettings++);
        // Wait for DanmakuCanvas's ResizeObserver to catch up.
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        // Execute
        this.cut.addDanmaku([
          {
            content: "This is some content.",
          },
          {
            content: "This is some content 2.",
          },
        ]);
        mouseClick(5, 50);
        await new Promise<void>((resolve) => this.cut.on("playing", resolve));
        mouseClick(5, 50);
        await new Promise<void>((resolve) =>
          this.cut.on("notPlaying", resolve),
        );

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
        this.cut.applySettings();

        // Verify
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
        this.cut.danmakuButton.val.click();

        // Verify
        assertThat(updatedSettings, eq(1), "updated settings");
        assertThat(
          playerSettings.danmakuSettings.enable,
          eq(false),
          "disabled danmaku",
        );
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
        this.cut.addDanmaku([
          {
            content: "This is some content.",
          },
          {
            content: "This is some content 2.",
          },
        ]);
        mouseClick(5, 50);
        await new Promise<void>((resolve) => this.cut.on("playing", resolve));
        mouseClick(5, 50);
        await new Promise<void>((resolve) =>
          this.cut.on("notPlaying", resolve),
        );

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

        // Prepare
        updatedSettings = 0;

        // Execute
        this.cut.noDanmakuButton.val.click();

        // Verify
        assertThat(updatedSettings, eq(1), "updated settings again");
        assertThat(
          playerSettings.danmakuSettings.enable,
          eq(true),
          "enabled danmaku",
        );
        this.cut.addDanmaku([
          {
            content: "This is some content.",
          },
          {
            content: "This is some content 2.",
          },
        ]);
        mouseClick(5, 50);
        await new Promise<void>((resolve) => this.cut.on("playing", resolve));
        mouseClick(5, 50);
        await new Promise<void>((resolve) =>
          this.cut.on("notPlaying", resolve),
        );
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
      public name = "ShowSettings_ShowComment_ShowMoreInfo";
      private cut: Player;
      public async execute() {
        // Prepare
        await setViewport(600, 600);
        this.cut = new Player(
          window,
          (reservedBottomMargin, danmakuSettigns) =>
            new DanmakuCanvasMock(5, reservedBottomMargin, danmakuSettigns),
          createPlayerSettings(),
          {
            videoPath: mov,
          },
        );
        this.cut.autoPlay = false;
        container.append(this.cut.body);
        let showSettings = false;
        this.cut.on("showSettings", () => (showSettings = true));

        // Execute
        this.cut.settingsButton.val.click();

        // Verify
        assertThat(showSettings, eq(true), "show settings");

        // Prepare
        let showComments = false;
        this.cut.on("showComments", () => (showComments = true));

        // Execute
        this.cut.commentButton.val.click();

        // Verify
        assertThat(showComments, eq(true), "show comments");

        // Prepare
        let showMoreInfo = false;
        this.cut.on("showMoreInfo", () => (showMoreInfo = true));

        // Execute
        this.cut.moreInfoButton.val.click();

        // Verify
        assertThat(showMoreInfo, eq(true), "show more info");
      }
      public async tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
