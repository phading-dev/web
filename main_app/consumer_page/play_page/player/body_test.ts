import oneAudio = require("./test_data/one_audio.m3u8");
import oneAudioOneSubtitle = require("./test_data/one_audio_one_sub.m3u8");
import twoAudiosTwoSubtitles = require("./test_data/two_audios_two_subs.m3u8");
import videoOnlyUrl = require("./test_data/video_only.m3u8");
import path from "path";
import { normalizeBody } from "../../../../common/normalize_body";
import {
  setDesktopView,
  setPhoneView,
  setTabletView,
} from "../../../../common/view_port";
import { Player } from "./body";
import { VideoPlayerSettings } from "@phading/user_service_interface/web/self/video_player_settings";
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

let SETTINGS: VideoPlayerSettings = {
  videoSettings: {
    volume: 5,
    playbackSpeed: 1,
  },
};

TEST_RUNNER.run({
  name: "PlayerTest",
  cases: [
    new (class implements TestCase {
      public name =
        "DesktopView_TabletView_PhoneView_BreakpointView_WaitForFadeOut_ToggleShow_ToggleHide_NotToggle";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setDesktopView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoPlayerSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoPlayerSettings;
        let cut = new Player(window, settings, videoOnlyUrl, 0, false);
        cut.autoPlay = false;
        this.container.append(...cut.elements);
        await new Promise<void>((resolve) =>
          cut.once("metadataLoaded", resolve),
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
      }
    })(),
    new (class implements TestCase {
      public name =
        "AutoPlayWithContinueTimestamp_Pause_ResumeToEnd_SpaceToRestart_SpaceToPause_SpaceIgnored";
      private container: HTMLDivElement;
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
        let settings: VideoPlayerSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoPlayerSettings;
        let cut = new Player(window, settings, videoOnlyUrl, 1000, false);
        this.container.append(...cut.elements, input);
        await new Promise<void>((resolve) =>
          cut.once("metadataLoaded", resolve),
        );

        // Execute
        await new Promise<void>((resolve) => cut.once("playing", resolve));
        // Waits for roughly 1 sec.
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
        cut.pauseButton.val.click();
        await new Promise<void>((resolve) => cut.once("notPlaying", resolve));

        // Verify
        assertThat(cut.getCurrentTime(), eqAppr(1.9, 0.2), "current time");

        // Execute
        cut.playButton.val.click();
        await new Promise<void>((resolve) => cut.once("playing", resolve));
        let startTime = Date.now();
        await new Promise<void>((resolve) => cut.once("notPlaying", resolve));
        let timePlayed = Date.now() - startTime;
        // Clear chats at the end
        await new Promise<void>((resolve) => cut.once("clearChats", resolve));

        // Verify
        assertThat(timePlayed, lt(8500), "time played until the end");

        // Execute
        keyboardDown("Space");
        await new Promise<void>((resolve) => cut.once("playing", resolve));
        await keyboardUp("Space");

        // Verify
        assertThat(cut.getCurrentTime(), lt(1), "restarted time lt");

        // Execute
        keyboardDown("Space");
        await new Promise<void>((resolve) => cut.once("notPlaying", resolve));
        await keyboardUp("Space");

        // Verify
        assertThat(cut.getCurrentTime(), lt(1), "restarted time lt 2");

        // Prepare
        let playing = false;
        cut.on("playing", () => {
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
      }
    })(),
    new (class implements TestCase {
      public name =
        "ContinueTimestamp_SkipForward_SkipBackward_ArrowRightToSkipForward_ArrowLeftToSkipBackward";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoPlayerSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoPlayerSettings;
        let cut = new Player(window, settings, videoOnlyUrl, 1000, false);
        cut.autoPlay = false;
        this.container.append(...cut.elements);
        await new Promise<void>((resolve) =>
          cut.once("metadataLoaded", resolve),
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
        let clearChats = false;
        cut.on("clearChats", () => {
          clearChats = true;
        });

        // Execute
        cut.skipForwardButton.val.click();
        await mouseMove(10, 20, 1);

        // Verify
        assertThat(clearChats, eq(true), "clear chats due to seeking");
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_skip_forward.png"),
          path.join(__dirname, "./golden/player_skip_forward.png"),
          path.join(__dirname, "./player_skip_forward_diff.png"),
        );

        // Prepare
        clearChats = false;

        // Execute
        cut.skipBackwardButton.val.click();
        await mouseMove(10, 30, 1);

        // Verify
        assertThat(clearChats, eq(true), "clear chats due to seeking 2");
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_skip_backward.png"),
          path.join(__dirname, "./golden/player_skip_backward.png"),
          path.join(__dirname, "./player_skip_backward_diff.png"),
        );

        // Prepare
        clearChats = false;

        // Execute
        await keyboardDown("ArrowRight");
        await keyboardUp("ArrowRight");
        await mouseMove(10, 40, 1);

        // Verify
        assertThat(clearChats, eq(true), "clear chats due to seeking 3");
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_skip_forward_arrow_right.png"),
          path.join(__dirname, "./golden/player_skip_forward_arrow_right.png"),
          path.join(__dirname, "./player_skip_forward_arrow_right_diff.png"),
        );

        // Prepare
        clearChats = false;

        // Execute
        await keyboardDown("ArrowLeft");
        await keyboardUp("ArrowLeft");
        await mouseMove(10, 50, 1);

        // Verify
        assertThat(clearChats, eq(true), "clear chats due to seeking 4");
        await asyncAssertScreenshot(
          path.join(__dirname, "./player_skip_backward_arrow_left.png"),
          path.join(__dirname, "./golden/player_skip_backward_arrow_left.png"),
          path.join(__dirname, "./player_skip_backward_arrow_left_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ProgressBar_MouseMove_Down_Move_MoveTo0_Up_Move";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoPlayerSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoPlayerSettings;
        let cut = new Player(window, settings, videoOnlyUrl, 0, false);
        cut.autoPlay = false;
        this.container.append(...cut.elements);
        await new Promise<void>((resolve) =>
          cut.once("metadataLoaded", resolve),
        );
        // There is an inital seeking event when continue timestamp is set.
        await new Promise<void>((resolve) => cut.once("clearChats", resolve));

        let clearChats = false;
        cut.on("clearChats", () => {
          clearChats = true;
        });

        // Execute
        await mouseMove(100, 760, 1);

        // Verify
        assertThat(clearChats, eq(false), "not clear chats");
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
        assertThat(clearChats, eq(true), "clear chats due to seeking");

        // Prepare
        clearChats = false;

        // Execute
        await mouseMove(-10, 300, 1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_progress_seeking_to_0.png"),
          path.join(__dirname, "/golden/player_progress_seeking_to_0.png"),
          path.join(__dirname, "/player_progress_seeking_to_0_diff.png"),
        );
        assertThat(clearChats, eq(true), "clear chats due to seeking 2");

        // Prepare
        clearChats = false;

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
        assertThat(clearChats, eq(false), "not clear chats 2");
      }
      public async tearDown() {
        await forceMouseUp();
        await mouseMove(-1, -1, 1);
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "TouchProgressBar_MoveTo100_End";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoPlayerSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoPlayerSettings;
        let cut = new Player(window, settings, videoOnlyUrl, 0, false);
        cut.autoPlay = false;
        this.container.append(...cut.elements);
        await new Promise<void>((resolve) =>
          cut.once("metadataLoaded", resolve),
        );
        // There is an inital seeking event when continue timestamp is set.
        await new Promise<void>((resolve) => cut.once("clearChats", resolve));

        let clearChats = false;
        cut.on("clearChats", () => {
          clearChats = true;
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
        assertThat(clearChats, eq(true), "clear chats due to seeking");

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
      }
    })(),
    new (class implements TestCase {
      public name = "SpeedUpOnce_SpeedUpAgain_SpeedUpToMax_SpeedDownMax";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoPlayerSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoPlayerSettings;
        let cut = new Player(window, settings, videoOnlyUrl, 0, false);
        cut.autoPlay = false;
        this.container.append(...cut.elements);
        await new Promise<void>((resolve) =>
          cut.once("metadataLoaded", resolve),
        );

        let saveSettings = false;
        cut.on("saveSettings", () => {
          saveSettings = true;
        });

        // Execute
        cut.playbackSpeedUpButton.val.click();
        await mouseMove(10, 10, 1);

        // Verify
        assertThat(saveSettings, eq(true), "save settings");
        assertThat(
          settings.videoSettings.playbackSpeed,
          eqAppr(1.1, 0.1),
          "playback speed",
        );
        assertThat(
          cut.video.val.playbackRate,
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
        cut.playbackSpeedUpButton.val.click();
        await mouseMove(10, 20, 1);

        // Verify
        assertThat(saveSettings, eq(true), "save settings 2");
        assertThat(
          settings.videoSettings.playbackSpeed,
          eqAppr(1.25, 0.1),
          "playback speed 2",
        );
        assertThat(
          cut.video.val.playbackRate,
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
          cut.playbackSpeedUpButton.val.click();
        }
        await mouseMove(10, 30, 1);

        // Verify
        assertThat(saveSettings, eq(true), "save settings 3");
        assertThat(
          settings.videoSettings.playbackSpeed,
          eqAppr(8, 0.1),
          "playback speed 3",
        );
        assertThat(
          cut.video.val.playbackRate,
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
          cut.playbackSpeedDownButton.val.click();
        }
        await mouseMove(10, 40, 1);

        // Verify
        assertThat(saveSettings, eq(true), "save settings 4");
        assertThat(
          settings.videoSettings.playbackSpeed,
          eqAppr(0.25, 0.1),
          "playback speed 4",
        );
        assertThat(
          cut.video.val.playbackRate,
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
      }
    })(),
    new (class implements TestCase {
      public name =
        "VolumeDown_VolumeDownAgain_VolumeMin_VolumeUp_VolumeMax_ArrowDownToVolumeDown_ArrowUpToVolumeUp";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoPlayerSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoPlayerSettings;
        let cut = new Player(window, settings, videoOnlyUrl, 0, false);
        cut.autoPlay = false;
        this.container.append(...cut.elements);
        await new Promise<void>((resolve) =>
          cut.once("metadataLoaded", resolve),
        );

        let saveSettings = false;
        cut.on("saveSettings", () => {
          saveSettings = true;
        });

        // Execute
        cut.volumeDownButton.val.click();
        await mouseMove(10, 10, 1);

        // Verify
        assertThat(saveSettings, eq(true), "save settings");
        assertThat(settings.videoSettings.volume, eq(4), "volume");
        assertThat(cut.video.val.volume, eqAppr(0.4, 0.01), "video volume");
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_volume_down.png"),
          path.join(__dirname, "/golden/player_volume_down.png"),
          path.join(__dirname, "/player_volume_down_diff.png"),
        );

        // Prepare
        saveSettings = false;

        // Execute
        cut.volumeDownButton.val.click();
        await mouseMove(10, 20, 1);

        // Verify
        assertThat(saveSettings, eq(true), "save settings 2");
        assertThat(settings.videoSettings.volume, eq(3), "volume 2");
        assertThat(cut.video.val.volume, eqAppr(0.3, 0.01), "video volume 2");
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_volume_down_2.png"),
          path.join(__dirname, "/golden/player_volume_down_2.png"),
          path.join(__dirname, "/player_volume_down_2_diff.png"),
        );

        // Prepare
        saveSettings = false;

        // Execute
        for (let i = 0; i < 4; i++) {
          cut.volumeDownButton.val.click();
        }
        await mouseMove(10, 30, 1);

        // Verify
        assertThat(saveSettings, eq(true), "save settings 3");
        assertThat(settings.videoSettings.volume, eq(0), "volume 3");
        assertThat(cut.video.val.volume, eq(0), "video volume 3");
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_volume_min.png"),
          path.join(__dirname, "/golden/player_volume_min.png"),
          path.join(__dirname, "/player_volume_min_diff.png"),
        );

        // Prepare
        saveSettings = false;

        // Execute
        for (let i = 0; i < 12; i++) {
          cut.volumeUpButton.val.click();
        }
        await mouseMove(10, 40, 1);

        // Verify
        assertThat(saveSettings, eq(true), "save settings 4");
        assertThat(settings.videoSettings.volume, eq(10), "volume 4");
        assertThat(cut.video.val.volume, eqAppr(1, 0.01), "video volume 4");
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
        assertThat(settings.videoSettings.volume, eq(9), "volume 5");
        assertThat(cut.video.val.volume, eqAppr(0.9, 0.01), "video volume 5");

        // Prepare
        saveSettings = false;

        // Execute
        await keyboardDown("ArrowUp");
        await keyboardUp("ArrowUp");

        // Verify
        assertThat(saveSettings, eq(true), "save settings 6");
        assertThat(settings.videoSettings.volume, eq(10), "volume 6");
        assertThat(cut.video.val.volume, eqAppr(1, 0.01), "video volume 6");
      }
      public async tearDown() {
        await mouseMove(-1, -1, 1);
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "Back_PlayNext_ShowInfo_ShowComments_ShowSettings_GoFullscreen_ExitFullscreen";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoPlayerSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoPlayerSettings;
        let cut = new Player(window, settings, videoOnlyUrl, 0, true);
        cut.autoPlay = false;
        this.container.append(...cut.elements);
        await new Promise<void>((resolve) =>
          cut.once("metadataLoaded", resolve),
        );

        let back = false;
        cut.on("back", () => {
          back = true;
        });

        // Execute
        cut.backButton.val.click();

        // Verify
        assertThat(back, eq(true), "back");

        // Prepare
        let playNext = false;
        cut.on("playNext", () => {
          playNext = true;
        });

        // Execute
        cut.playNextButton.val.click();

        // Verify
        assertThat(playNext, eq(true), "play next");

        // Prepare
        let showInfo = false;
        cut.on("showInfo", () => {
          showInfo = true;
        });

        // Execute
        cut.showInfoButton.val.click();

        // Verify
        assertThat(showInfo, eq(true), "show info");

        // Prepare
        let showComments = false;
        cut.on("showComments", () => {
          showComments = true;
        });

        // Execute
        cut.showCommentsButton.val.click();

        // Verify
        assertThat(showComments, eq(true), "show comments");

        // Prepare
        let showSettings = false;
        cut.on("showSettings", () => {
          showSettings = true;
        });

        // Execute
        cut.showSettingsButton.val.click();

        // Verify
        assertThat(showSettings, eq(true), "show settings");

        // Prepare
        let goFullscreen = false;
        cut.on("goFullscreen", () => {
          goFullscreen = true;
        });

        // Execute
        cut.fullscreenButton.val.click();
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
        cut.on("exitFullscreen", () => {
          exitFullscreen = true;
        });

        // Execute
        cut.exitFullscreenButton.val.click();
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
      }
    })(),
    new (class implements TestCase {
      public name = "VideoOnlyNoAudioOrSubtitleTrack";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoPlayerSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoPlayerSettings;
        let cut = new Player(window, settings, videoOnlyUrl, 0, false);
        cut.autoPlay = false;
        this.container.append(...cut.elements);

        let audioTracks: Array<string>;
        let audioIndex: number;
        cut.on("audioTracksInited", (tracks, index) => {
          audioTracks = tracks;
          audioIndex = index;
        });
        let subtitleTracks: Array<string>;
        let subtitleIndex: number;
        cut.on("subtitleTracksInited", (tracks, index) => {
          subtitleTracks = tracks;
          subtitleIndex = index;
        });

        // Execute
        await new Promise<void>((resolve) =>
          cut.once("metadataLoaded", resolve),
        );

        // Verify no events
        assertThat(audioTracks, eq(undefined), "audio tracks");
        assertThat(audioIndex, eq(undefined), "audio index");
        assertThat(subtitleTracks, eq(undefined), "subtitle tracks");
        assertThat(subtitleIndex, eq(undefined), "subtitle index");
      }
      public async tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "VideoWithOneAudioTrackNoSubtitleTrack";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoPlayerSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoPlayerSettings;
        let cut = new Player(window, settings, oneAudio, 0, false);
        cut.autoPlay = false;
        this.container.append(...cut.elements);

        let audioTracks: Array<string>;
        let audioIndex: number;
        cut.on("audioTracksInited", (tracks, index) => {
          audioTracks = tracks;
          audioIndex = index;
        });
        let subtitleTracks: Array<string>;
        let subtitleIndex: number;
        cut.on("subtitleTracksInited", (tracks, index) => {
          subtitleTracks = tracks;
          subtitleIndex = index;
        });

        // Execute
        await new Promise<void>((resolve) =>
          cut.once("metadataLoaded", resolve),
        );

        // Verify
        assertThat(audioTracks, isArray([eq("English (US)")]), "audio tracks");
        assertThat(audioIndex, eq(0), "audio index");
        assertThat(subtitleTracks, eq(undefined), "subtitle tracks");
        assertThat(subtitleIndex, eq(undefined), "subtitle index");
      }
      public async tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "VideoWithOneAudioTrackOneSubtitleTrack_NoInitialSubtitle";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoPlayerSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoPlayerSettings;
        let cut = new Player(window, settings, oneAudioOneSubtitle, 0, false);
        cut.autoPlay = false;
        this.container.append(...cut.elements);

        let audioTracks: Array<string>;
        let audioIndex: number;
        cut.on("audioTracksInited", (tracks, index) => {
          audioTracks = tracks;
          audioIndex = index;
        });
        let subtitleTracks: Array<string>;
        let subtitleIndex: number;
        cut.on("subtitleTracksInited", (tracks, index) => {
          subtitleTracks = tracks;
          subtitleIndex = index;
        });

        // Execute
        await new Promise<void>((resolve) =>
          cut.once("metadataLoaded", resolve),
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
      }
    })(),
    new (class implements TestCase {
      public name =
        "VideoWithOneAudioTrackOneSubtitleTrack_WithInitialSubtitle_SelectNoSubtitle";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoPlayerSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoPlayerSettings;
        settings.videoSettings.preferredSubtitleName = "Korean";
        let cut = new Player(window, settings, oneAudioOneSubtitle, 0, false);
        cut.autoPlay = false;
        this.container.append(...cut.elements);

        let audioTracks: Array<string>;
        let audioIndex: number;
        cut.on("audioTracksInited", (tracks, index) => {
          audioTracks = tracks;
          audioIndex = index;
        });
        let subtitleTracks: Array<string>;
        let subtitleIndex: number;
        cut.on("subtitleTracksInited", (tracks, index) => {
          subtitleTracks = tracks;
          subtitleIndex = index;
        });

        // Execute
        await new Promise<void>((resolve) =>
          cut.once("metadataLoaded", resolve),
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
        cut.selectSubtitleTrack(-1);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_select_no_subtitle.png"),
          path.join(__dirname, "/golden/player_no_subtitle.png"),
          path.join(__dirname, "/player_select_no_subtitle_diff.png"),
        );
      }
      public async tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name =
        "VideoWithTwoAudioTracksTwoSubtitleTracks_WithInitAudioAndSubtitle_Select1stSubtitle";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoPlayerSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoPlayerSettings;
        settings.videoSettings.preferredAudioName = "Chinese";
        settings.videoSettings.preferredSubtitleName = "中文";
        let cut = new Player(window, settings, twoAudiosTwoSubtitles, 0, false);
        cut.autoPlay = false;
        this.container.append(...cut.elements);

        let audioTracks: Array<string>;
        let audioIndex: number;
        cut.on("audioTracksInited", (tracks, index) => {
          audioTracks = tracks;
          audioIndex = index;
        });
        let subtitleTracks: Array<string>;
        let subtitleIndex: number;
        cut.on("subtitleTracksInited", (tracks, index) => {
          subtitleTracks = tracks;
          subtitleIndex = index;
        });

        // Execute
        await new Promise<void>((resolve) =>
          cut.once("metadataLoaded", resolve),
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
        cut.selectSubtitleTrack(0);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/player_select_1st_subtitle.png"),
          path.join(__dirname, "/golden/player_korean_subtitle.png"),
          path.join(__dirname, "/player_select_1st_subtitle_diff.png"),
        );
      }
      public async tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Interrupted";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        await setTabletView();
        this.container = E.div({
          style: `width: 100%; height: 100%;`,
        });
        document.body.append(this.container);
        let settings: VideoPlayerSettings = JSON.parse(
          JSON.stringify(SETTINGS),
        ) as VideoPlayerSettings;
        let cut = new Player(window, settings, videoOnlyUrl, 0, false);
        cut.autoPlay = false;
        this.container.append(...cut.elements);
        await new Promise<void>((resolve) =>
          cut.once("metadataLoaded", resolve),
        );

        // Execute
        cut.interrupt("Interrupted!");
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
        cut.playButton.val.click();
        await new Promise<void>((resolve) => cut.once("playing", resolve));
        cut.interrupt("Interrupted!");
        await new Promise<void>((resolve) => cut.once("notPlaying", resolve));

        // Verify
        assertThat(
          cut.getCurrentTime(),
          lt(0.1),
          "current play time after interrupted",
        );
      }
      public async tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
