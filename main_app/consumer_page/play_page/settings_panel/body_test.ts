import path from "path";
import { SCHEME } from "../../../../common/color_scheme";
import { normalizeBody } from "../../../../common/normalize_body";
import { setTabletView } from "../../../../common/view_port";
import { SettingsPanel } from "./body";
import {
  ChatOverlayStyle,
  StackingMethod,
  VideoPlayerSettings,
} from "@phading/user_service_interface/web/self/video_player_settings";
import { E } from "@selfage/element/factory";
import { keyboardDown } from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";

normalizeBody();

let SETTINGS: VideoPlayerSettings = {
  videoSettings: {},
  chatOverlaySettings: {
    style: ChatOverlayStyle.SIDE,
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
  cut.setAvailableTracks(
    ["None", "English", "Spanish"],
    "English",
    ["Japanese", "Chinese"],
    "Japanese",
  );
  return { container, cut, settings };
}

TEST_RUNNER.run({
  name: "SettingsPanelTest",
  cases: [
    new (class implements TestCase {
      public name = "Default_WideScreen";
      private container: HTMLDivElement;
      public async execute() {
        // Execute
        ({ container: this.container } = await setUpSettingsPanel());

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_default.png"),
          path.join(__dirname, "/golden/settings_panel_default.png"),
          path.join(__dirname, "/settings_panel_default_diff.png"),
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
      public name = "SelectSubtitle";
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
        let subtitleSelected = false;
        cut.on("subtitleSelected", () => {
          subtitleSelected = true;
        });

        // Execute
        cut.subtitleOptions[0].click();

        // Verify
        assertThat(subtitleSelected, eq(true), "subtitleSelected");
        assertThat(
          settings.videoSettings.preferredSubtitleName,
          eq("None"),
          "settings.videoSettings.preferredSubtitleName",
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
        let audioSelected = false;
        cut.on("audioSelected", () => {
          audioSelected = true;
        });

        // Execute
        cut.audioOptions[1].click();

        // Verify
        assertThat(audioSelected, eq(true), "audioSelected");
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
      public name = "SelectDisabledChatOverlay_SelectDanmaku";
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
        let chatOverlayStyleChanged = false;
        cut.on("chatOverlayStyleChanged", () => {
          chatOverlayStyleChanged = true;
        });

        // Execute
        cut.chatOverlayDisabledOption.val.click();

        // Verify
        assertThat(
          chatOverlayStyleChanged,
          eq(true),
          "chatOverlayStyleChanged",
        );
        assertThat(
          settings.chatOverlaySettings.style,
          eq(ChatOverlayStyle.NONE),
          "settings.chatOverlaySettings.style",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/settings_panel_select_disabled_chat_overlay.png",
          ),
          path.join(
            __dirname,
            "/golden/settings_panel_select_disabled_chat_overlay.png",
          ),
          path.join(
            __dirname,
            "/settings_panel_select_disabled_chat_overlay_diff.png",
          ),
        );

        // Prepare
        chatOverlayStyleChanged = false;

        // Execute
        cut.chatOverlayDanmakuOption.val.click();

        // Verify
        assertThat(
          chatOverlayStyleChanged,
          eq(true),
          "chatOverlayStyleChanged 2",
        );
        assertThat(
          settings.chatOverlaySettings.style,
          eq(ChatOverlayStyle.DANMAKU),
          "settings.chatOverlaySettings.style 2",
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
        let opacityChanged = false;
        cut.on("chatOverlayOpacityChanged", () => {
          opacityChanged = true;
        });

        // Execute
        cut.chatOverlayOpacity.val.minusButton.val.click();

        // Verify
        assertThat(opacityChanged, eq(true), "opacityChanged");
        assertThat(
          settings.chatOverlaySettings.opacity,
          eq(70),
          "settings.chatOverlaySettings.opacity",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_opacity_decrement.png"),
          path.join(__dirname, "/golden/settings_panel_opacity_decrement.png"),
          path.join(__dirname, "/settings_panel_opacity_decrement_diff.png"),
        );

        // Prepare
        opacityChanged = false;

        // Execute
        for (let i = 0; i < 5; i++) {
          cut.chatOverlayOpacity.val.plusButton.val.click();
        }

        // Verify
        assertThat(
          opacityChanged,
          eq(true),
          "opacityChanged after incrementing",
        );
        assertThat(
          settings.chatOverlaySettings.opacity,
          eq(100),
          "settings.chatOverlaySettings.opacity after incrementing",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_opacity_max.png"),
          path.join(__dirname, "/golden/settings_panel_opacity_max.png"),
          path.join(__dirname, "/settings_panel_opacity_max_diff.png"),
        );

        // Prepare
        opacityChanged = false;

        // Execute
        cut.chatOverlayOpacity.val.input.val.focus();
        cut.chatOverlayOpacity.val.input.val.value = "";
        cut.chatOverlayOpacity.val.input.val.blur();

        // Verify
        assertThat(opacityChanged, eq(true), "opacityChanged after blur");
        assertThat(
          settings.chatOverlaySettings.opacity,
          eq(80),
          "settings.chatOverlaySettings.opacity after blur",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_panel_opacity_blur.png"),
          path.join(__dirname, "/golden/settings_panel_opacity_blur.png"),
          path.join(__dirname, "/settings_panel_opacity_blur_diff.png"),
        );

        // Prepare
        opacityChanged = false;

        // Execute
        cut.chatOverlayOpacity.val.input.val.focus();
        cut.chatOverlayOpacity.val.input.val.value = "-1";
        await keyboardDown("Enter");

        // Verify
        assertThat(opacityChanged, eq(true), "opacityChanged after enter");
        assertThat(
          settings.chatOverlaySettings.opacity,
          eq(0),
          "settings.chatOverlaySettings.opacity after enter",
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
        let fontSizeChanged = false;
        cut.on("chatOverlayFontSizeChanged", () => {
          fontSizeChanged = true;
        });

        // Execute
        cut.chatOverlayFontSize.val.plusButton.val.click();

        // Verify
        assertThat(
          fontSizeChanged,
          eq(true),
          "fontSizeChanged after incrementing",
        );
        assertThat(
          settings.chatOverlaySettings.fontSize,
          eq(21),
          "settings.chatOverlaySettings.fontSize.size after incrementing",
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
        cut.chatOverlayDanmakuOption.val.click();
        let danmakuOverlaySpeedChanged = false;
        cut.on("danmakuOverlaySpeedChanged", () => {
          danmakuOverlaySpeedChanged = true;
        });

        // Execute
        cut.danmakuOverlaySpeed.val.plusButton.val.click();

        // Verify
        assertThat(
          danmakuOverlaySpeedChanged,
          eq(true),
          "danmakuOverlaySpeedChanged after incrementing",
        );
        assertThat(
          settings.chatOverlaySettings.danmakuSettings.speed,
          eq(225),
          "settings.chatOverlaySettings.danmakuSettings.speed after incrementing",
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
        cut.chatOverlayDanmakuOption.val.click();
        let danmakuOverlayDensityChanged = false;
        cut.on("danmakuOverlayDensityChanged", () => {
          danmakuOverlayDensityChanged = true;
        });

        // Execute
        cut.danmakuOverlayDensity.val.minusButton.val.click();

        // Verify
        assertThat(
          danmakuOverlayDensityChanged,
          eq(true),
          "danmakuOverlayDensityChanged after decrementing",
        );
        assertThat(
          settings.chatOverlaySettings.danmakuSettings.density,
          eq(95),
          "settings.chatOverlaySettings.danmakuSettings.density after decrementing",
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
        cut.chatOverlayDanmakuOption.val.click();
        let danmakuStackingMethodChanged = false;
        cut.on("danmakuStackingMethodChanged", () => {
          danmakuStackingMethodChanged = true;
        });

        // Execute
        cut.danmakuStackingTopDownOption.val.click();

        // Verify
        assertThat(
          danmakuStackingMethodChanged,
          eq(true),
          "stackingMethodChanged after selection",
        );
        assertThat(
          settings.chatOverlaySettings.danmakuSettings.stackingMethod,
          eq(StackingMethod.TOP_DOWN),
          "settings.chatOverlaySettings.danmakuSettings.stackingMethod after selection",
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
