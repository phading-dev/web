import oneAudio = require("../common/test_data/one_audio.m3u8");
import oneAudioOneSubtitle = require("../common/test_data/one_audio_one_sub.m3u8");
import twoAudiosTwoSubtitles = require("../common/test_data/two_audios_two_subs.m3u8");
import videoOnlyUrl = require("../common/test_data/video_only.m3u8");
import path from "path";
import { normalizeBody } from "../../../../common/normalize_body";
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../../common/view_port";
import { Player } from "./body";
import { VideoSettings } from "@phading/user_service_interface/web/self/video_player_settings";
import { E } from "@selfage/element/factory";
import {
  forceMouseUp,
  keyboardDown,
  keyboardUp,
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
import { assertThat, eq, eqAppr, isArray, lt } from "@selfage/test_matcher";

normalizeBody();

let SETTINGS: VideoSettings = {
  volume: 5,
  playbackSpeed: 1,
};

TEST_RUNNER.run({
  name: "PlayerTest",
  cases: [
    new (class implements TestCase {
      public name =
        "DesktopView_TabletView_PhoneView_BreakpointView_WaitForFadeOut_ToggleShow_ToggleHide_NotToggle";
      private container: HTMLDivElement;
      private cut: Player;
      public async execute() {
        // Prepare
        await setDesktopView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoSettings;
        this.cut = new Player(
          window,
          settings,
          videoOnlyUrl,
          0,
          "season1",
          undefined,
          false,
        );
        this.container.append(...this.cut.elements);
        await new Promise<void>((resolve) =>
          this.cut.once("metadataLoaded", resolve),
        );

        // Execute
        await mouseMove(10, 10, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_desktop_view.png"),
          path.join(__dirname, "./golden/player_desktop_view.png"),
          path.join(__dirname, "./player_desktop_view_diff.png"),
        );

        // Execute
        await setTabletView();
        await mouseMove(10, 20, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_tablet_view.png"),
          path.join(__dirname, "./golden/player_tablet_view.png"),
          path.join(__dirname, "./player_tablet_view_diff.png"),
        );

        // Execute
        await setPhoneView();
        await mouseMove(10, 30, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_phone_view.png"),
          path.join(__dirname, "./golden/player_phone_view.png"),
          path.join(__dirname, "./player_phone_view_diff.png"),
        );

        // Execute
        await setViewport(540, 800);
        await mouseMove(10, 100, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_breakpoint_view.png"),
          path.join(__dirname, "./golden/player_breakpoint_view.png"),
          path.join(__dirname, "./player_breakpoint_view_diff.png"),
        );

        // Execute
        await setPhoneView();
        // Wait for the controls to fade out
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_phone_view_faded_out.png"),
          path.join(__dirname, "./golden/player_phone_view_faded_out.png"),
          path.join(__dirname, "./player_phone_view_faded_out_diff.png"),
        );

        // Execute
        await mouseDown();
        await mouseUp();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_phone_view_toggled_show.png"),
          path.join(__dirname, "./golden/player_phone_view.png"),
          path.join(__dirname, "./player_phone_view_toggled_show_diff.png"),
        );

        // Execute
        await mouseDown();
        await mouseUp();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_phone_view_toggled_hide.png"),
          path.join(__dirname, "./golden/player_phone_view_faded_out.png"),
          path.join(__dirname, "./player_phone_view_toggled_hide_diff.png"),
        );

        // Execute
        await mouseMove(10, 10, 1);
        await mouseDown();
        await mouseUp();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_phone_view_not_toggled.png"),
          path.join(__dirname, "./golden/player_phone_view.png"),
          path.join(__dirname, "./player_phone_view_not_toggled_diff.png"),
        );
      }
      public async tearDown() {
        await forceMouseUp();
        await mouseMove(-1, -1, 1);
        this.container.remove();
        this.cut.destroy();
      }
    })(),
    new (class implements TestCase {
      public name =
        "AutoPlayWithContinueTimestamp_Pause_ResumeToEnd_SpaceToRestart_SpaceToPause_SpaceIgnored";
      private container: HTMLDivElement;
      private cut: Player;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let input = E.input({
          style: "display: block;",
        });
        let settings: VideoSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoSettings;
        this.cut = new Player(window, settings, videoOnlyUrl, 1000, "season1");
        this.container.append(...this.cut.elements, input);
        await new Promise<void>((resolve) =>
          this.cut.once("metadataLoaded", resolve),
        );

        // Execute
        await new Promise<void>((resolve) => this.cut.once("playing", resolve));
        // Waits for roughly 1 sec.
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
        this.cut.pauseButton.val.click();
        await new Promise<void>((resolve) =>
          this.cut.once("notPlaying", resolve),
        );

        // Verify
        assertThat(
          this.cut.getCurrentVideoTimeMs(),
          eqAppr(1900, 0.2),
          "current time",
        );

        // Execute
        this.cut.playButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("playing", resolve));
        let startTime = Date.now();
        await new Promise<void>((resolve) =>
          this.cut.once("notPlaying", resolve),
        );
        let timePlayed = Date.now() - startTime;

        // Verify
        assertThat(timePlayed, lt(8500), "time played until the end");

        // Execute
        keyboardDown("Space");
        await new Promise<void>((resolve) => this.cut.once("playing", resolve));
        await keyboardUp("Space");

        // Verify
        assertThat(
          this.cut.getCurrentVideoTimeMs(),
          lt(1000),
          "restarted time lt",
        );

        // Execute
        keyboardDown("Space");
        await new Promise<void>((resolve) =>
          this.cut.once("notPlaying", resolve),
        );
        await keyboardUp("Space");

        // Verify
        assertThat(
          this.cut.getCurrentVideoTimeMs(),
          lt(1000),
          "restarted time lt 2",
        );

        // Prepare
        let playing = false;
        this.cut.on("playing", () => {
          playing = true;
        });

        // Execute
        input.focus();
        await keyboardDown("Space");
        await keyboardUp("Space");
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        // Verify
        assertThat(
          playing,
          eq(false),
          "space key ignored when input is focused",
        );
      }
      public tearDown() {
        this.container.remove();
        this.cut.destroy();
      }
    })(),
    new (class implements TestCase {
      public name =
        "ContinueTimestamp_SkipForward_SkipBackward_ArrowRightToSkipForward_ArrowLeftToSkipBackward";
      private container: HTMLDivElement;
      private cut: Player;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoSettings;
        this.cut = new Player(
          window,
          settings,
          videoOnlyUrl,
          1000,
          "season1",
          undefined,
          false,
        );
        this.container.append(...this.cut.elements);
        await new Promise<void>((resolve) =>
          this.cut.once("metadataLoaded", resolve),
        );

        // Execute
        await mouseMove(10, 10, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_continue_timestamp.png"),
          path.join(__dirname, "./golden/player_continue_timestamp.png"),
          path.join(__dirname, "./player_continue_timestamp_diff.png"),
        );

        // Prepare
        let clearComments = false;
        this.cut.on("clearComments", () => {
          clearComments = true;
        });

        // Execute
        this.cut.skipForwardButton.val.click();
        await mouseMove(10, 20, 1);

        // Verify
        assertThat(clearComments, eq(true), "clear chats due to seeking");
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_skip_forward.png"),
          path.join(__dirname, "./golden/player_skip_forward.png"),
          path.join(__dirname, "./player_skip_forward_diff.png"),
        );

        // Prepare
        clearComments = false;

        // Execute
        this.cut.skipBackwardButton.val.click();
        await mouseMove(10, 30, 1);

        // Verify
        assertThat(clearComments, eq(true), "clear chats due to seeking 2");
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_skip_backward.png"),
          path.join(__dirname, "./golden/player_skip_backward.png"),
          path.join(__dirname, "./player_skip_backward_diff.png"),
        );

        // Prepare
        clearComments = false;

        // Execute
        await keyboardDown("ArrowRight");
        await keyboardUp("ArrowRight");
        await mouseMove(10, 40, 1);

        // Verify
        assertThat(clearComments, eq(true), "clear chats due to seeking 3");
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_skip_forward_arrow_right.png"),
          path.join(__dirname, "./golden/player_skip_forward_arrow_right.png"),
          path.join(__dirname, "./player_skip_forward_arrow_right_diff.png"),
        );

        // Prepare
        clearComments = false;

        // Execute
        await keyboardDown("ArrowLeft");
        await keyboardUp("ArrowLeft");
        await mouseMove(10, 50, 1);

        // Verify
        assertThat(clearComments, eq(true), "clear chats due to seeking 4");
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_skip_backward_arrow_left.png"),
          path.join(__dirname, "./golden/player_skip_backward_arrow_left.png"),
          path.join(__dirname, "./player_skip_backward_arrow_left_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.container.remove();
        this.cut.destroy();
      }
    })(),
    new (class implements TestCase {
      public name = "ProgressBar_MouseMove_Down_Move_MoveTo0_Up_Move";
      private container: HTMLDivElement;
      private cut: Player;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoSettings;
        this.cut = new Player(
          window,
          settings,
          videoOnlyUrl,
          0,
          "season1",
          undefined,
          false,
        );
        this.container.append(...this.cut.elements);
        await new Promise<void>((resolve) =>
          this.cut.once("metadataLoaded", resolve),
        );
        // There is an inital seeking event when continue timestamp is set.
        await new Promise<void>((resolve) =>
          this.cut.once("clearComments", resolve),
        );

        let clearComments = false;
        this.cut.on("clearComments", () => {
          clearComments = true;
        });

        // Execute
        await mouseMove(100, 760, 1);

        // Verify
        assertThat(clearComments, eq(false), "not clear chats");
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_expand_progress_bar.png"),
          path.join(__dirname, "/golden/player_expand_progress_bar.png"),
          path.join(__dirname, "/player_expand_progress_bar_diff.png"),
        );

        // Execute
        await mouseDown();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_progress_bar_mouse_down.png"),
          path.join(__dirname, "/golden/player_progress_bar_mouse_down.png"),
          path.join(__dirname, "/player_progress_bar_mouse_down_diff.png"),
        );
        assertThat(clearComments, eq(true), "clear chats due to seeking");

        // Prepare
        clearComments = false;

        // Execute
        await mouseMove(-10, 300, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_progress_seeking_to_0.png"),
          path.join(__dirname, "/golden/player_progress_seeking_to_0.png"),
          path.join(__dirname, "/player_progress_seeking_to_0_diff.png"),
        );
        assertThat(clearComments, eq(true), "clear chats due to seeking 2");

        // Prepare
        clearComments = false;

        // Execute
        await mouseUp();
        await mouseMove(600, 760, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_progress_seeking_ended_moved.png"),
          path.join(
            __dirname,
            "/golden/player_progress_seeking_ended_moved.png",
          ),
          path.join(__dirname, "/player_progress_seeking_ended_moved_diff.png"),
        );
        assertThat(clearComments, eq(false), "not clear chats 2");
      }
      public async tearDown() {
        await forceMouseUp();
        await mouseMove(-1, -1, 1);
        this.container.remove();
        this.cut.destroy();
      }
    })(),
    new (class implements TestCase {
      public name = "TouchProgressBar_MoveTo100_End";
      private container: HTMLDivElement;
      private cut: Player;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoSettings;
        this.cut = new Player(
          window,
          settings,
          videoOnlyUrl,
          0,
          "season1",
          undefined,
          false,
        );
        this.container.append(...this.cut.elements);
        await new Promise<void>((resolve) =>
          this.cut.once("metadataLoaded", resolve),
        );
        // There is an inital seeking event when continue timestamp is set.
        await new Promise<void>((resolve) =>
          this.cut.once("clearComments", resolve),
        );

        let clearComments = false;
        this.cut.on("clearComments", () => {
          clearComments = true;
        });

        // Execute
        await touchStart(60, 760);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_touch_progress.png"),
          path.join(__dirname, "/golden/player_touch_progress.png"),
          path.join(__dirname, "/player_touch_progress_diff.png"),
        );

        await touchMove(720, 600);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_touch_moved_to_100.png"),
          path.join(__dirname, "/golden/player_touch_moved_to_100.png"),
          path.join(__dirname, "/player_touch_moved_to_100_diff.png"),
        );
        assertThat(clearComments, eq(true), "clear chats due to seeking");

        // Execute
        await touchEnd();

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_touch_ended_progress.png"),
          path.join(__dirname, "/golden/player_touch_ended_progress.png"),
          path.join(__dirname, "/player_touch_ended_progress_diff.png"),
        );
      }
      public async tearDown() {
        try {
          await touchEnd();
        } catch (e) {}
        this.container.remove();
        this.cut.destroy();
      }
    })(),
    new (class implements TestCase {
      public name = "SpeedUpOnce_SpeedUpAgain_SpeedUpToMax_SpeedDownMax";
      private container: HTMLDivElement;
      private cut: Player;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoSettings;
        this.cut = new Player(
          window,
          settings,
          videoOnlyUrl,
          0,
          "season1",
          undefined,
          false,
        );
        this.container.append(...this.cut.elements);
        await new Promise<void>((resolve) =>
          this.cut.once("metadataLoaded", resolve),
        );

        let saveSettings = false;
        this.cut.on("saveSettings", () => {
          saveSettings = true;
        });

        // Execute
        this.cut.playbackSpeedUpButton.val.click();
        await mouseMove(10, 10, 1);

        // Verify
        assertThat(saveSettings, eq(true), "save settings");
        assertThat(settings.playbackSpeed, eqAppr(1.1, 0.1), "playback speed");
        assertThat(
          this.cut.video.val.playbackRate,
          eqAppr(1.1, 0.01),
          "video speed",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_speed_up.png"),
          path.join(__dirname, "/golden/player_speed_up.png"),
          path.join(__dirname, "/player_speed_up_diff.png"),
        );

        // Prepare
        saveSettings = false;

        // Execute
        this.cut.playbackSpeedUpButton.val.click();
        await mouseMove(10, 20, 1);

        // Verify
        assertThat(saveSettings, eq(true), "save settings 2");
        assertThat(
          settings.playbackSpeed,
          eqAppr(1.25, 0.1),
          "playback speed 2",
        );
        assertThat(
          this.cut.video.val.playbackRate,
          eqAppr(1.25, 0.01),
          "video speed 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_speed_up_2.png"),
          path.join(__dirname, "/golden/player_speed_up_2.png"),
          path.join(__dirname, "/player_speed_up_2_diff.png"),
        );

        // Prepare
        saveSettings = false;

        // Execute
        for (let i = 0; i < 8; i++) {
          this.cut.playbackSpeedUpButton.val.click();
        }
        await mouseMove(10, 30, 1);

        // Verify
        assertThat(saveSettings, eq(true), "save settings 3");
        assertThat(settings.playbackSpeed, eqAppr(8, 0.1), "playback speed 3");
        assertThat(
          this.cut.video.val.playbackRate,
          eqAppr(8, 0.01),
          "video speed 3",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_speed_up_max.png"),
          path.join(__dirname, "/golden/player_speed_up_max.png"),
          path.join(__dirname, "/player_speed_up_max_diff.png"),
        );

        // Prepare
        saveSettings = false;

        // Execute
        for (let i = 0; i < 14; i++) {
          this.cut.playbackSpeedDownButton.val.click();
        }
        await mouseMove(10, 40, 1);

        // Verify
        assertThat(saveSettings, eq(true), "save settings 4");
        assertThat(
          settings.playbackSpeed,
          eqAppr(0.25, 0.1),
          "playback speed 4",
        );
        assertThat(
          this.cut.video.val.playbackRate,
          eqAppr(0.25, 0.01),
          "video speed 4",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_speed_down_max.png"),
          path.join(__dirname, "/golden/player_speed_down_max.png"),
          path.join(__dirname, "/player_speed_down_max_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.container.remove();
        this.cut.destroy();
      }
    })(),
    new (class implements TestCase {
      public name =
        "VolumeDown_VolumeDownAgain_VolumeMin_VolumeUp_VolumeMax_ArrowDownToVolumeDown_ArrowUpToVolumeUp";
      private container: HTMLDivElement;
      private cut: Player;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoSettings;
        this.cut = new Player(
          window,
          settings,
          videoOnlyUrl,
          0,
          "season1",
          undefined,
          false,
        );
        this.container.append(...this.cut.elements);
        await new Promise<void>((resolve) =>
          this.cut.once("metadataLoaded", resolve),
        );

        let saveSettings = false;
        this.cut.on("saveSettings", () => {
          saveSettings = true;
        });

        // Execute
        this.cut.volumeDownButton.val.click();
        await mouseMove(10, 10, 1);

        // Verify
        assertThat(saveSettings, eq(true), "save settings");
        assertThat(settings.volume, eq(4), "volume");
        assertThat(
          this.cut.video.val.volume,
          eqAppr(0.4, 0.01),
          "video volume",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_volume_down.png"),
          path.join(__dirname, "/golden/player_volume_down.png"),
          path.join(__dirname, "/player_volume_down_diff.png"),
        );

        // Prepare
        saveSettings = false;

        // Execute
        this.cut.volumeDownButton.val.click();
        await mouseMove(10, 20, 1);

        // Verify
        assertThat(saveSettings, eq(true), "save settings 2");
        assertThat(settings.volume, eq(3), "volume 2");
        assertThat(
          this.cut.video.val.volume,
          eqAppr(0.3, 0.01),
          "video volume 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_volume_down_2.png"),
          path.join(__dirname, "/golden/player_volume_down_2.png"),
          path.join(__dirname, "/player_volume_down_2_diff.png"),
        );

        // Prepare
        saveSettings = false;

        // Execute
        for (let i = 0; i < 4; i++) {
          this.cut.volumeDownButton.val.click();
        }
        await mouseMove(10, 30, 1);

        // Verify
        assertThat(saveSettings, eq(true), "save settings 3");
        assertThat(settings.volume, eq(0), "volume 3");
        assertThat(this.cut.video.val.volume, eq(0), "video volume 3");
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_volume_min.png"),
          path.join(__dirname, "/golden/player_volume_min.png"),
          path.join(__dirname, "/player_volume_min_diff.png"),
        );

        // Prepare
        saveSettings = false;

        // Execute
        for (let i = 0; i < 12; i++) {
          this.cut.volumeUpButton.val.click();
        }
        await mouseMove(10, 40, 1);

        // Verify
        assertThat(saveSettings, eq(true), "save settings 4");
        assertThat(settings.volume, eq(10), "volume 4");
        assertThat(
          this.cut.video.val.volume,
          eqAppr(1, 0.01),
          "video volume 4",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_volume_max.png"),
          path.join(__dirname, "/golden/player_volume_max.png"),
          path.join(__dirname, "/player_volume_max_diff.png"),
        );

        // Prepare
        saveSettings = false;

        // Execute
        await keyboardDown("ArrowDown");
        await keyboardUp("ArrowDown");

        // Verify
        assertThat(saveSettings, eq(true), "save settings 5");
        assertThat(settings.volume, eq(9), "volume 5");
        assertThat(
          this.cut.video.val.volume,
          eqAppr(0.9, 0.01),
          "video volume 5",
        );

        // Prepare
        saveSettings = false;

        // Execute
        await keyboardDown("ArrowUp");
        await keyboardUp("ArrowUp");

        // Verify
        assertThat(saveSettings, eq(true), "save settings 6");
        assertThat(settings.volume, eq(10), "volume 6");
        assertThat(
          this.cut.video.val.volume,
          eqAppr(1, 0.01),
          "video volume 6",
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.container.remove();
        this.cut.destroy();
      }
    })(),
    new (class implements TestCase {
      public name =
        "Back_PlayNext_ShowInfo_ShowComments_ShowSettings_GoFullscreen_ExitFullscreen";
      private container: HTMLDivElement;
      private cut: Player;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoSettings;
        this.cut = new Player(
          window,
          settings,
          videoOnlyUrl,
          0,
          "season1",
          "episode2",
          false,
        );
        this.container.append(...this.cut.elements);
        await new Promise<void>((resolve) =>
          this.cut.once("metadataLoaded", resolve),
        );

        let back = false;
        this.cut.on("back", () => {
          back = true;
        });

        // Execute
        this.cut.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "back");

        // Prepare
        let playNextSeasonId: string;
        let playNextEpisodeId: string;
        this.cut.on("play", (seasonId, episodeId) => {
          playNextSeasonId = seasonId;
          playNextEpisodeId = episodeId;
        });

        // Execute
        this.cut.playNextButton.val.click();

        // Verify
        assertThat(playNextSeasonId, eq("season1"), "play next season");
        assertThat(playNextEpisodeId, eq("episode2"), "play next episode");

        // Prepare
        let showInfo = false;
        this.cut.on("showInfo", () => {
          showInfo = true;
        });

        // Execute
        this.cut.showInfoButton.val.click();

        // Verify
        assertThat(showInfo, eq(true), "show info");

        // Prepare
        let showComments = false;
        this.cut.on("showComments", () => {
          showComments = true;
        });

        // Execute
        this.cut.showCommentsButton.val.click();

        // Verify
        assertThat(showComments, eq(true), "show comments");

        // Prepare
        let showSettings = false;
        this.cut.on("showSettings", () => {
          showSettings = true;
        });

        // Execute
        this.cut.showSettingsButton.val.click();

        // Verify
        assertThat(showSettings, eq(true), "show settings");

        // Prepare
        let goFullscreen = false;
        this.cut.on("goFullscreen", () => {
          goFullscreen = true;
        });

        // Execute
        this.cut.fullscreenButton.val.click();
        await this.container.requestFullscreen();
        await mouseMove(10, 10, 1);

        // Verify
        assertThat(goFullscreen, eq(true), "go fullscreen");
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_go_fullscreen.png"),
          path.join(__dirname, "/golden/player_go_fullscreen.png"),
          path.join(__dirname, "/player_go_fullscreen_diff.png"),
        );

        // Prepare
        let exitFullscreen = false;
        this.cut.on("exitFullscreen", () => {
          exitFullscreen = true;
        });

        // Execute
        this.cut.exitFullscreenButton.val.click();
        await document.exitFullscreen();
        await mouseMove(10, 20, 1);

        // Verify
        assertThat(exitFullscreen, eq(true), "exit fullscreen");
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_exit_fullscreen.png"),
          path.join(__dirname, "/golden/player_exit_fullscreen.png"),
          path.join(__dirname, "/player_exit_fullscreen_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.container.remove();
        this.cut.destroy();
      }
    })(),
    new (class implements TestCase {
      public name = "VideoOnlyNoAudioOrSubtitleTrack";
      private container: HTMLDivElement;
      private cut: Player;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoSettings;
        this.cut = new Player(
          window,
          settings,
          videoOnlyUrl,
          0,
          "season1",
          undefined,
          false,
        );
        this.container.append(...this.cut.elements);

        let audioTracks: Array<string>;
        let audioIndex: number;
        this.cut.on("addAvailableAudioTracks", (tracks, index) => {
          audioTracks = tracks;
          audioIndex = index;
        });
        let subtitleTracks: Array<string>;
        let subtitleIndex: number;
        this.cut.on("addAvailableSubtitleTracks", (tracks, index) => {
          subtitleTracks = tracks;
          subtitleIndex = index;
        });

        // Execute
        await new Promise<void>((resolve) =>
          this.cut.once("metadataLoaded", resolve),
        );

        // Verify no events
        assertThat(audioTracks, eq(undefined), "audio tracks");
        assertThat(audioIndex, eq(undefined), "audio index");
        assertThat(subtitleTracks, eq(undefined), "subtitle tracks");
        assertThat(subtitleIndex, eq(undefined), "subtitle index");
      }
      public async tearDown() {
        this.container.remove();
        this.cut.destroy();
      }
    })(),
    new (class implements TestCase {
      public name = "VideoWithOneAudioTrackNoSubtitleTrack";
      private container: HTMLDivElement;
      private cut: Player;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoSettings;
        this.cut = new Player(
          window,
          settings,
          oneAudio,
          0,
          "season1",
          undefined,
          false,
        );
        this.container.append(...this.cut.elements);

        let audioTracks: Array<string>;
        let audioIndex: number;
        this.cut.on("addAvailableAudioTracks", (tracks, index) => {
          audioTracks = tracks;
          audioIndex = index;
        });
        let subtitleTracks: Array<string>;
        let subtitleIndex: number;
        this.cut.on("addAvailableSubtitleTracks", (tracks, index) => {
          subtitleTracks = tracks;
          subtitleIndex = index;
        });

        // Execute
        await new Promise<void>((resolve) =>
          this.cut.once("metadataLoaded", resolve),
        );

        // Verify
        assertThat(audioTracks, isArray([eq("English (US)")]), "audio tracks");
        assertThat(audioIndex, eq(0), "audio index");
        assertThat(subtitleTracks, eq(undefined), "subtitle tracks");
        assertThat(subtitleIndex, eq(undefined), "subtitle index");
      }
      public async tearDown() {
        this.container.remove();
        this.cut.destroy();
      }
    })(),
    new (class implements TestCase {
      public name = "VideoWithOneAudioTrackOneSubtitleTrack_NoInitialSubtitle";
      private container: HTMLDivElement;
      private cut: Player;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoSettings;
        this.cut = new Player(
          window,
          settings,
          oneAudioOneSubtitle,
          0,
          "season1",
          undefined,
          false,
        );
        this.container.append(...this.cut.elements);

        let audioTracks: Array<string>;
        let audioIndex: number;
        this.cut.on("addAvailableAudioTracks", (tracks, index) => {
          audioTracks = tracks;
          audioIndex = index;
        });
        let subtitleTracks: Array<string>;
        let subtitleIndex: number;
        this.cut.on("addAvailableSubtitleTracks", (tracks, index) => {
          subtitleTracks = tracks;
          subtitleIndex = index;
        });

        // Execute
        await new Promise<void>((resolve) =>
          this.cut.once("metadataLoaded", resolve),
        );

        // Verify
        assertThat(audioTracks, isArray([eq("English (US)")]), "audio tracks");
        assertThat(audioIndex, eq(0), "audio index");
        assertThat(subtitleTracks, isArray([eq("Korean")]), "subtitle tracks");
        assertThat(subtitleIndex, eq(-1), "subtitle index");
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_init_no_subtitle.png"),
          path.join(__dirname, "/golden/player_no_subtitle.png"),
          path.join(__dirname, "/player_init_no_subtitle_diff.png"),
        );
      }
      public async tearDown() {
        this.container.remove();
        this.cut.destroy();
      }
    })(),
    new (class implements TestCase {
      public name =
        "VideoWithOneAudioTrackOneSubtitleTrack_WithInitialSubtitle_SelectNoSubtitle";
      private container: HTMLDivElement;
      private cut: Player;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoSettings;
        settings.preferredSubtitleName = "Korean";
        this.cut = new Player(
          window,
          settings,
          oneAudioOneSubtitle,
          0,
          "season1",
          undefined,
          false,
        );
        this.container.append(...this.cut.elements);

        let audioTracks: Array<string>;
        let audioIndex: number;
        this.cut.on("addAvailableAudioTracks", (tracks, index) => {
          audioTracks = tracks;
          audioIndex = index;
        });
        let subtitleTracks: Array<string>;
        let subtitleIndex: number;
        this.cut.on("addAvailableSubtitleTracks", (tracks, index) => {
          subtitleTracks = tracks;
          subtitleIndex = index;
        });

        // Execute
        await new Promise<void>((resolve) =>
          this.cut.once("metadataLoaded", resolve),
        );

        // Verify
        assertThat(audioTracks, isArray([eq("English (US)")]), "audio tracks");
        assertThat(audioIndex, eq(0), "audio index");
        assertThat(subtitleTracks, isArray([eq("Korean")]), "subtitle tracks");
        assertThat(subtitleIndex, eq(0), "subtitle index");
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_init_subtitle.png"),
          path.join(__dirname, "/golden/player_korean_subtitle.png"),
          path.join(__dirname, "/player_init_subtitle_diff.png"),
        );

        // Execute
        this.cut.selectSubtitleTrack(-1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_select_no_subtitle.png"),
          path.join(__dirname, "/golden/player_no_subtitle.png"),
          path.join(__dirname, "/player_select_no_subtitle_diff.png"),
        );
      }
      public async tearDown() {
        this.container.remove();
        this.cut.destroy();
      }
    })(),
    new (class implements TestCase {
      public name =
        "VideoWithTwoAudioTracksTwoSubtitleTracks_WithInitAudioAndSubtitle_Select1stSubtitle";
      private container: HTMLDivElement;
      private cut: Player;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoSettings;
        settings.preferredAudioName = "Chinese";
        settings.preferredSubtitleName = "中文";
        this.cut = new Player(
          window,
          settings,
          twoAudiosTwoSubtitles,
          0,
          "season1",
          undefined,
          false,
        );
        this.container.append(...this.cut.elements);

        let audioTracks: Array<string>;
        let audioIndex: number;
        this.cut.on("addAvailableAudioTracks", (tracks, index) => {
          audioTracks = tracks;
          audioIndex = index;
        });
        let subtitleTracks: Array<string>;
        let subtitleIndex: number;
        this.cut.on("addAvailableSubtitleTracks", (tracks, index) => {
          subtitleTracks = tracks;
          subtitleIndex = index;
        });

        // Execute
        await new Promise<void>((resolve) =>
          this.cut.once("metadataLoaded", resolve),
        );

        // Verify
        assertThat(
          audioTracks,
          isArray([eq("English (US)"), eq("Chinese")]),
          "audio tracks",
        );
        assertThat(audioIndex, eq(1), "audio index");
        assertThat(
          subtitleTracks,
          isArray([eq("Korean"), eq("中文")]),
          "subtitle tracks",
        );
        assertThat(subtitleIndex, eq(1), "subtitle index");
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_init_2nd_subtitle.png"),
          path.join(__dirname, "/golden/player_chinese_subtitle.png"),
          path.join(__dirname, "/player_init_2nd_subtitle_diff.png"),
        );

        // Execute
        this.cut.selectSubtitleTrack(0);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_select_1st_subtitle.png"),
          path.join(__dirname, "/golden/player_korean_subtitle.png"),
          path.join(__dirname, "/player_select_1st_subtitle_diff.png"),
        );
      }
      public async tearDown() {
        this.container.remove();
        this.cut.destroy();
      }
    })(),
    new (class implements TestCase {
      public name = "Interrupted";
      private container: HTMLDivElement;
      private cut: Player;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoSettings;
        this.cut = new Player(
          window,
          settings,
          videoOnlyUrl,
          0,
          "season1",
          undefined,
          false,
        );
        this.container.append(...this.cut.elements);
        await new Promise<void>((resolve) =>
          this.cut.once("metadataLoaded", resolve),
        );

        // Execute
        this.cut.interrupt("Interrupted!");
        await new Promise<void>((resolve) => setTimeout(resolve, 500));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_interrupted.png"),
          path.join(__dirname, "/golden/player_interrupted.png"),
          path.join(__dirname, "/player_interrupted_diff.png"),
        );

        // Execute
        await new Promise<void>((resolve) => setTimeout(resolve, 5000));

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_interrupt_cleared.png"),
          path.join(__dirname, "/golden/player_interrupt_cleared.png"),
          path.join(__dirname, "/player_interrupt_cleared_diff.png"),
        );

        // Execute
        this.cut.playButton.val.click();
        await new Promise<void>((resolve) => this.cut.once("playing", resolve));
        this.cut.interrupt("Interrupted!");
        await new Promise<void>((resolve) =>
          this.cut.once("notPlaying", resolve),
        );

        // Verify
        assertThat(
          this.cut.getCurrentVideoTimeMs(),
          lt(100),
          "current play time after interrupted",
        );
      }
      public async tearDown() {
        this.container.remove();
        this.cut.destroy();
      }
    })(),
  ],
});
