import path from "path";
import { SCHEME } from "../../../../common/color_scheme";
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { SettingsPanel } from "./body";
import {
  CommentOverlayStyle,
  StackingMethod,
  VideoPlayerSettings,
} from "@phading/user_service_interface/web/self/video_player_settings";
import { E } from "@selfage/element/factory";
import { keyboardDown, keyboardUp } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

let SETTINGS: VideoPlayerSettings = {
  videoSettings: {},
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
};

async function setUpSettingsPanel(): Promise<{
  container: HTMLDivElement;
  cut: SettingsPanel;
  settings: VideoPlayerSettings;
}> {
  // Prepare
  await setTabletView();
  let container = E.div({
    style: `width: 35rem; background-color: ${SCHEME.neutral4}; padding: 1rem;`,
  });
  document.body.appendChild(container);
  let settings: VideoPlayerSettings = JSON.parse(JSON.stringify(SETTINGS));
  let cut = new SettingsPanel("width: 100%;", settings);

  container.append(cut.body);
  return { container, cut, settings };
}

TEST_RUNNER.run({
  name: "SettingsPanelTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_AddTracks_WideScreen";
      private container: HTMLDivElement;
      public async execute() {
        // Execute
        let cut: SettingsPanel;
        ({ container: this.container, cut } = await setUpSettingsPanel());

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_default.png"),
          path.join(__dirname, "/golden/settings_panel_default.png"),
          path.join(__dirname, "/settings_panel_default_diff.png"),
        );

        // Execute
        cut.addAvailableSubtitleTracks(["English", "Spanish"], 1);
        cut.addAvailableAudioTracks(["Japanese", "Chinese"], 0);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_with_tracks.png"),
          path.join(__dirname, "/golden/settings_panel_with_tracks.png"),
          path.join(__dirname, "/settings_panel_with_tracks_diff.png"),
        );

        // Execute
        this.container.style.width = "60rem";

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_wide_screen.png"),
          path.join(__dirname, "/golden/settings_panel_wide_screen.png"),
          path.join(__dirname, "/settings_panel_wide_screen_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SelectSubtitleOff";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut: SettingsPanel;
        let settings: VideoPlayerSettings;
        ({
          container: this.container,
          cut,
          settings,
        } = await setUpSettingsPanel());
        cut.addAvailableSubtitleTracks(["English", "Spanish"], 1);
        let selectSubtitleIndex: number;
        cut.on("selectSubtitle", (index) => {
          selectSubtitleIndex = index;
        });

        // Execute
        cut.subtitleOptions[0].click();

        // Verify
        assertThat(selectSubtitleIndex, eq(-1), "selectSubtitleIndex");
        assertThat(
          settings.videoSettings.preferredSubtitleName,
          eq(undefined),
          "settings.videoSettings.preferredSubtitleName",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_select_subtitle_off.png"),
          path.join(
            __dirname,
            "/golden/settings_panel_select_subtitle_off.png",
          ),
          path.join(__dirname, "/settings_panel_select_subtitle_off_diff.png"),
        );

        // Execute
        cut.subtitleOptions[1].click();

        // Verify
        assertThat(selectSubtitleIndex, eq(0), "selectSubtitleIndex 2");
        assertThat(
          settings.videoSettings.preferredSubtitleName,
          eq("English"),
          "settings.videoSettings.preferredSubtitleName 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_select_subtitle.png"),
          path.join(__dirname, "/golden/settings_panel_select_subtitle.png"),
          path.join(__dirname, "/settings_panel_select_subtitle_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SelectAudio";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut: SettingsPanel;
        let settings: VideoPlayerSettings;
        ({
          container: this.container,
          cut,
          settings,
        } = await setUpSettingsPanel());
        cut.addAvailableAudioTracks(["Japanese", "Chinese"], 0);
        let selectAudioIndex = -1;
        cut.on("selectAudio", (index) => {
          selectAudioIndex = index;
        });

        // Execute
        cut.audioOptions[1].click();

        // Verify
        assertThat(selectAudioIndex, eq(1), "selectAudioIndex");
        assertThat(
          settings.videoSettings.preferredAudioName,
          eq("Chinese"),
          "settings.videoSettings.preferredAudioName",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_select_audio.png"),
          path.join(__dirname, "/golden/settings_panel_select_audio.png"),
          path.join(__dirname, "/settings_panel_select_audio_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "SelectDisabledCommentOverlay_SelectDanmaku";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut: SettingsPanel;
        let settings: VideoPlayerSettings;
        ({
          container: this.container,
          cut,
          settings,
        } = await setUpSettingsPanel());
        let updateCommentOverlaySettings = false;
        cut.on("updateCommentOverlaySettings", () => {
          updateCommentOverlaySettings = true;
        });

        // Execute
        cut.commentOverlayDisabledOption.val.click();

        // Verify
        assertThat(
          updateCommentOverlaySettings,
          eq(true),
          "updateCommentOverlaySettings",
        );
        assertThat(
          settings.commentOverlaySettings.style,
          eq(CommentOverlayStyle.NONE),
          "settings.commentOverlaySettings.style",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/settings_panel_select_disabled_comment_overlay.png",
          ),
          path.join(
            __dirname,
            "/golden/settings_panel_select_disabled_comment_overlay.png",
          ),
          path.join(
            __dirname,
            "/settings_panel_select_disabled_comment_overlay_diff.png",
          ),
        );

        // Prepare
        updateCommentOverlaySettings = false;

        // Execute
        cut.commentOverlayDanmakuOption.val.click();

        // Verify
        assertThat(
          updateCommentOverlaySettings,
          eq(true),
          "updateCommentOverlaySettings 2",
        );
        assertThat(
          settings.commentOverlaySettings.style,
          eq(CommentOverlayStyle.DANMAKU),
          "settings.commentOverlaySettings.style 2",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_select_danmaku.png"),
          path.join(__dirname, "/golden/settings_panel_select_danmaku.png"),
          path.join(__dirname, "/settings_panel_select_danmaku_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "OpacityInput_AllInteractions";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut: SettingsPanel;
        let settings: VideoPlayerSettings;
        ({
          container: this.container,
          cut,
          settings,
        } = await setUpSettingsPanel());
        let updateCommentOverlaySettings = false;
        cut.on("updateCommentOverlaySettings", () => {
          updateCommentOverlaySettings = true;
        });

        // Execute
        cut.commentOverlayOpacity.val.minusButton.val.click();

        // Verify
        assertThat(
          updateCommentOverlaySettings,
          eq(true),
          "updateCommentOverlaySettings",
        );
        assertThat(
          settings.commentOverlaySettings.opacity,
          eq(70),
          "settings.commentOverlaySettings.opacity",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_opacity_decrement.png"),
          path.join(__dirname, "/golden/settings_panel_opacity_decrement.png"),
          path.join(__dirname, "/settings_panel_opacity_decrement_diff.png"),
        );

        // Prepare
        updateCommentOverlaySettings = false;

        // Execute
        for (let i = 0; i < 5; i++) {
          cut.commentOverlayOpacity.val.plusButton.val.click();
        }

        // Verify
        assertThat(
          updateCommentOverlaySettings,
          eq(true),
          "updateCommentOverlaySettings after incrementing",
        );
        assertThat(
          settings.commentOverlaySettings.opacity,
          eq(100),
          "settings.commentOverlaySettings.opacity after incrementing",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_opacity_max.png"),
          path.join(__dirname, "/golden/settings_panel_opacity_max.png"),
          path.join(__dirname, "/settings_panel_opacity_max_diff.png"),
        );

        // Prepare
        updateCommentOverlaySettings = false;

        // Execute
        cut.commentOverlayOpacity.val.input.val.focus();
        cut.commentOverlayOpacity.val.input.val.value = "";
        cut.commentOverlayOpacity.val.input.val.blur();

        // Verify
        assertThat(
          updateCommentOverlaySettings,
          eq(true),
          "updateCommentOverlaySettings after blur",
        );
        assertThat(
          settings.commentOverlaySettings.opacity,
          eq(80),
          "settings.commentOverlaySettings.opacity after blur",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_opacity_blur.png"),
          path.join(__dirname, "/golden/settings_panel_opacity_blur.png"),
          path.join(__dirname, "/settings_panel_opacity_blur_diff.png"),
        );

        // Prepare
        updateCommentOverlaySettings = false;

        // Execute
        cut.commentOverlayOpacity.val.input.val.focus();
        cut.commentOverlayOpacity.val.input.val.value = "-1";
        await keyboardDown("Enter");
        await keyboardUp("Enter");

        // Verify
        assertThat(
          updateCommentOverlaySettings,
          eq(true),
          "updateCommentOverlaySettings after enter",
        );
        assertThat(
          settings.commentOverlaySettings.opacity,
          eq(0),
          "settings.commentOverlaySettings.opacity after enter",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_opacity_enter.png"),
          path.join(__dirname, "/golden/settings_panel_opacity_enter.png"),
          path.join(__dirname, "/settings_panel_opacity_enter_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "FontSizeInput";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut: SettingsPanel;
        let settings: VideoPlayerSettings;
        ({
          container: this.container,
          cut,
          settings,
        } = await setUpSettingsPanel());
        let updateCommentOverlaySettings = false;
        cut.on("updateCommentOverlaySettings", () => {
          updateCommentOverlaySettings = true;
        });

        // Execute
        cut.commentOverlayFontSize.val.plusButton.val.click();

        // Verify
        assertThat(
          updateCommentOverlaySettings,
          eq(true),
          "updateCommentOverlaySettings after incrementing",
        );
        assertThat(
          settings.commentOverlaySettings.fontSize,
          eq(21),
          "settings.commentOverlaySettings.fontSize.size after incrementing",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_font_size_increment.png"),
          path.join(
            __dirname,
            "/golden/settings_panel_font_size_increment.png",
          ),
          path.join(__dirname, "/settings_panel_font_size_increment_diff.png"),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DanmakuSpeedInput";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut: SettingsPanel;
        let settings: VideoPlayerSettings;
        ({
          container: this.container,
          cut,
          settings,
        } = await setUpSettingsPanel());
        cut.commentOverlayDanmakuOption.val.click();
        let updateCommentOverlaySettings = false;
        cut.on("updateCommentOverlaySettings", () => {
          updateCommentOverlaySettings = true;
        });

        // Execute
        cut.danmakuOverlaySpeed.val.plusButton.val.click();

        // Verify
        assertThat(
          updateCommentOverlaySettings,
          eq(true),
          "updateCommentOverlaySettings after incrementing",
        );
        assertThat(
          settings.commentOverlaySettings.danmakuSettings.speed,
          eq(225),
          "settings.commentOverlaySettings.danmakuSettings.speed after incrementing",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_danmaku_speed_increment.png"),
          path.join(
            __dirname,
            "/golden/settings_panel_danmaku_speed_increment.png",
          ),
          path.join(
            __dirname,
            "/settings_panel_danmaku_speed_increment_diff.png",
          ),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "DanmakuDensityInput";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut: SettingsPanel;
        let settings: VideoPlayerSettings;
        ({
          container: this.container,
          cut,
          settings,
        } = await setUpSettingsPanel());
        cut.commentOverlayDanmakuOption.val.click();
        let updateCommentOverlaySettings = false;
        cut.on("updateCommentOverlaySettings", () => {
          updateCommentOverlaySettings = true;
        });

        // Execute
        cut.danmakuOverlayDensity.val.minusButton.val.click();

        // Verify
        assertThat(
          updateCommentOverlaySettings,
          eq(true),
          "updateCommentOverlaySettings after decrementing",
        );
        assertThat(
          settings.commentOverlaySettings.danmakuSettings.density,
          eq(95),
          "settings.commentOverlaySettings.danmakuSettings.density after decrementing",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_danmaku_density_decrement.png"),
          path.join(
            __dirname,
            "/golden/settings_panel_danmaku_density_decrement.png",
          ),
          path.join(
            __dirname,
            "/settings_panel_danmaku_density_decrement_diff.png",
          ),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "StackingMethodOption";
      private container: HTMLDivElement;
      public async execute() {
        // Prepare
        let cut: SettingsPanel;
        let settings: VideoPlayerSettings;
        ({
          container: this.container,
          cut,
          settings,
        } = await setUpSettingsPanel());
        cut.commentOverlayDanmakuOption.val.click();
        let updateCommentOverlaySettings = false;
        cut.on("updateCommentOverlaySettings", () => {
          updateCommentOverlaySettings = true;
        });

        // Execute
        cut.danmakuStackingTopDownOption.val.click();

        // Verify
        assertThat(
          updateCommentOverlaySettings,
          eq(true),
          "stackingMethodChanged after selection",
        );
        assertThat(
          settings.commentOverlaySettings.danmakuSettings.stackingMethod,
          eq(StackingMethod.TOP_DOWN),
          "settings.commentOverlaySettings.danmakuSettings.stackingMethod after selection",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_stacking_method_top_down.png"),
          path.join(
            __dirname,
            "/golden/settings_panel_stacking_method_top_down.png",
          ),
          path.join(
            __dirname,
            "/settings_panel_stacking_method_top_down_diff.png",
          ),
        );
      }
      public tearDown() {
        this.container.remove();
      }
    })(),
  ],
});
