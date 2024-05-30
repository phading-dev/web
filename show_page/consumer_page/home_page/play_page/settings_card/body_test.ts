import path = require("path");
import { SettingsCard } from "./body";
import {
  PLAYER_SETTINGS,
  PlayerSettings,
  StackingMethod,
} from "@phading/product_service_interface/consumer/show_app/player_settings";
import { E } from "@selfage/element/factory";
import { eqMessage } from "@selfage/message/test_matcher";
import {
  keyboardDown,
  keyboardType,
  mouseClick,
  mouseMove,
  mouseWheel,
  setViewport,
} from "@selfage/puppeteer_test_executor_api";
import { TEST_RUNNER, TestCase } from "@selfage/puppeteer_test_runner";
import { asyncAssertScreenshot } from "@selfage/screenshot_test_matcher";
import { assertThat, eq, gt } from "@selfage/test_matcher";
import "../../../../../common/normalize_body";

function createPlayerSettings(): PlayerSettings {
  return {
    danmakuSettings: {
      opacity: 80,
      speed: 200,
      density: 100,
      bottomMargin: 1,
      topMargin: 1,
      fontFamily: "Arial",
      fontSize: 25,
      stackingMethod: StackingMethod.RANDOM,
    },
  };
}

let container: HTMLDivElement;

TEST_RUNNER.run({
  name: "SettingsCardTest",
  environment: {
    setUp: () => {
      container = E.div({
        style: `width: 100vm; height: 100vh; display: flex;`,
      });
      document.body.append(container);
    },
    tearDown: () => {
      container.remove();
    },
  },
  cases: [
    new (class implements TestCase {
      public name = "Default";
      private cut: SettingsCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        let settings = createPlayerSettings();
        this.cut = new SettingsCard(settings).show();

        // Execute
        container.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_card_default.png"),
          path.join(__dirname, "/golden/settings_card_default.png"),
          path.join(__dirname, "/settings_card_default_diff.png"),
        );
      }
      public async tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "Wide_ShortWindow_ScrollDown";
      private cut: SettingsCard;
      public async execute() {
        // Prepare
        await setViewport(600, 300);
        let settings = createPlayerSettings();
        this.cut = new SettingsCard(settings).show();

        // Execute
        container.append(this.cut.body);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_card_short.png"),
          path.join(__dirname, "/golden/settings_card_short.png"),
          path.join(__dirname, "/settings_card_short_diff.png"),
        );

        // Execute
        await mouseWheel(100, 200);

        // Verify
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_card_short_scroll_down.png"),
          path.join(__dirname, "/golden/settings_card_short_scroll_down.png"),
          path.join(__dirname, "/settings_card_short_scroll_down_diff.png"),
        );
      }
      public tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateOpacity";
      private cut: SettingsCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        let settings = createPlayerSettings();
        this.cut = new SettingsCard(settings).show();
        container.append(this.cut.body);
        let updates = 0;
        this.cut.on("update", () => updates++);

        // Execute
        this.cut.opacityOption.val.valueInput.val.focus();
        await keyboardType("120");
        await keyboardDown("Enter");

        // Verify
        assertThat(updates, eq(1), "1 update");
        assertThat(settings.danmakuSettings.opacity, eq(100), "opacity input");
        this.cut.opacityOption.val.valueInput.val.blur();
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_card_danmaku_opacity_input.png"),
          path.join(
            __dirname,
            "/golden/settings_card_danmaku_opacity_input.png",
          ),
          path.join(__dirname, "/settings_card_danmaku_opacity_input_diff.png"),
        );

        // Execute
        await mouseClick(199, 73);

        // Verify
        assertThat(updates, gt(1), "more updates");
        assertThat(settings.danmakuSettings.opacity, eq(52), "opacity slider");
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_card_danmaku_opacity_slider.png"),
          path.join(
            __dirname,
            "/golden/settings_card_danmaku_opacity_slider.png",
          ),
          path.join(
            __dirname,
            "/settings_card_danmaku_opacity_slider_diff.png",
          ),
        );
      }
      public async tearDown() {
        await mouseMove(0, 0, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateSpeed";
      private cut: SettingsCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        let settings = createPlayerSettings();
        this.cut = new SettingsCard(settings).show();
        container.append(this.cut.body);
        let updates = 0;
        this.cut.on("update", () => updates++);

        // Execute
        this.cut.speedOption.val.valueInput.val.value = "";
        this.cut.speedOption.val.valueInput.val.focus();
        await keyboardType("120");
        this.cut.speedOption.val.valueInput.val.blur();

        // Verify
        assertThat(updates, eq(1), "1 update");
        assertThat(settings.danmakuSettings.speed, eq(120), "speed input");
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_card_danmaku_speed_input.png"),
          path.join(__dirname, "/golden/settings_card_danmaku_speed_input.png"),
          path.join(__dirname, "/settings_card_danmaku_speed_input_diff.png"),
        );

        // Execute
        await mouseClick(188, 130);

        // Verify
        assertThat(updates, gt(1), "more updates");
        assertThat(settings.danmakuSettings.speed, eq(185), "speed slider");
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_card_danmaku_speed_slider.png"),
          path.join(
            __dirname,
            "/golden/settings_card_danmaku_speed_slider.png",
          ),
          path.join(__dirname, "/settings_card_danmaku_speed_slider_diff.png"),
        );
      }
      public async tearDown() {
        await mouseMove(0, 0, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateFontSize";
      private cut: SettingsCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        let settings = createPlayerSettings();
        this.cut = new SettingsCard(settings).show();
        container.append(this.cut.body);
        let updates = 0;
        this.cut.on("update", () => updates++);

        // Execute
        this.cut.fontSizeOption.val.valueInput.val.value = "";
        this.cut.fontSizeOption.val.valueInput.val.focus();
        await keyboardType("18");
        this.cut.fontSizeOption.val.valueInput.val.blur();

        // Verify
        assertThat(updates, eq(1), "1 update");
        assertThat(
          settings.danmakuSettings.fontSize,
          eq(18),
          "font size input",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_card_danmaku_font_size_input.png"),
          path.join(
            __dirname,
            "/golden/settings_card_danmaku_font_size_input.png",
          ),
          path.join(
            __dirname,
            "/settings_card_danmaku_font_size_input_diff.png",
          ),
        );

        // Execute
        await mouseClick(150, 190);

        // Verify
        assertThat(updates, gt(1), "more updates");
        assertThat(
          settings.danmakuSettings.fontSize,
          eq(10),
          "font size slider",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_card_danmaku_font_size_slider.png"),
          path.join(
            __dirname,
            "/golden/settings_card_danmaku_font_size_slider.png",
          ),
          path.join(
            __dirname,
            "/settings_card_danmaku_font_size_slider_diff.png",
          ),
        );
      }
      public async tearDown() {
        await mouseMove(0, 0, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateFontFamily";
      private cut: SettingsCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        let settings = createPlayerSettings();
        this.cut = new SettingsCard(settings).show();
        container.append(this.cut.body);
        let updates = 0;
        this.cut.on("update", () => updates++);

        // Execute
        this.cut.fontFamilyOption.val.input.val.value = "";
        this.cut.fontFamilyOption.val.input.val.focus();
        await keyboardType("cursive");
        this.cut.fontFamilyOption.val.input.val.blur();

        // Verify
        assertThat(updates, eq(1), "1 update");
        assertThat(
          settings.danmakuSettings.fontFamily,
          eq("cursive"),
          "font family input",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_card_danmaku_font_family_input.png"),
          path.join(
            __dirname,
            "/golden/settings_card_danmaku_font_family_input.png",
          ),
          path.join(
            __dirname,
            "/settings_card_danmaku_font_family_input_diff.png",
          ),
        );
      }
      public async tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateDensity";
      private cut: SettingsCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        let settings = createPlayerSettings();
        this.cut = new SettingsCard(settings).show();
        container.append(this.cut.body);
        let updates = 0;
        this.cut.on("update", () => updates++);

        // Execute
        this.cut.densityOption.val.valueInput.val.value = "";
        this.cut.densityOption.val.valueInput.val.focus();
        await keyboardType("20");
        this.cut.densityOption.val.valueInput.val.blur();

        // Verify
        assertThat(updates, eq(1), "1 update");
        assertThat(settings.danmakuSettings.density, eq(20), "density input");
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_card_danmaku_density_input.png"),
          path.join(
            __dirname,
            "/golden/settings_card_danmaku_density_input.png",
          ),
          path.join(__dirname, "/settings_card_danmaku_density_input_diff.png"),
        );

        // Execute
        await mouseClick(200, 275);

        // Verify
        assertThat(updates, gt(1), "more updates");
        assertThat(settings.danmakuSettings.density, eq(52), "density slider");
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_card_danmaku_density_slider.png"),
          path.join(
            __dirname,
            "/golden/settings_card_danmaku_density_slider.png",
          ),
          path.join(
            __dirname,
            "/settings_card_danmaku_density_slider_diff.png",
          ),
        );
      }
      public async tearDown() {
        await mouseMove(0, 0, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateTopMargin";
      private cut: SettingsCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        let settings = createPlayerSettings();
        this.cut = new SettingsCard(settings).show();
        container.append(this.cut.body);
        let updates = 0;
        this.cut.on("update", () => updates++);

        // Execute
        this.cut.topMarginOption.val.valueInput.val.value = "";
        this.cut.topMarginOption.val.valueInput.val.focus();
        await keyboardType("20");
        this.cut.topMarginOption.val.valueInput.val.blur();

        // Verify
        assertThat(updates, eq(1), "1 update");
        assertThat(
          settings.danmakuSettings.topMargin,
          eq(20),
          "top margin input",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_card_danmaku_top_margin_input.png"),
          path.join(
            __dirname,
            "/golden/settings_card_danmaku_top_margin_input.png",
          ),
          path.join(
            __dirname,
            "/settings_card_danmaku_top_margin_input_diff.png",
          ),
        );

        // Execute
        await mouseClick(200, 333);

        // Verify
        assertThat(updates, gt(1), "more updates");
        assertThat(
          settings.danmakuSettings.topMargin,
          eq(52),
          "top margin slider",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_card_danmaku_top_margin_slider.png"),
          path.join(
            __dirname,
            "/golden/settings_card_danmaku_top_margin_slider.png",
          ),
          path.join(
            __dirname,
            "/settings_card_danmaku_top_margin_slider_diff.png",
          ),
        );
      }
      public async tearDown() {
        await mouseMove(0, 0, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateBottomMargin";
      private cut: SettingsCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        let settings = createPlayerSettings();
        this.cut = new SettingsCard(settings).show();
        container.append(this.cut.body);
        let updates = 0;
        this.cut.on("update", () => updates++);

        // Execute
        this.cut.bottomMarginOption.val.valueInput.val.value = "";
        this.cut.bottomMarginOption.val.valueInput.val.focus();
        await keyboardType("20");
        this.cut.bottomMarginOption.val.valueInput.val.blur();

        // Verify
        assertThat(updates, eq(1), "1 update");
        assertThat(
          settings.danmakuSettings.bottomMargin,
          eq(20),
          "bottom margin input",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/settings_card_danmaku_bottom_margin_input.png",
          ),
          path.join(
            __dirname,
            "/golden/settings_card_danmaku_bottom_margin_input.png",
          ),
          path.join(
            __dirname,
            "/settings_card_danmaku_bottom_margin_input_diff.png",
          ),
        );

        // Execute
        await mouseClick(200, 390);

        // Verify
        assertThat(updates, gt(1), "more updates");
        assertThat(
          settings.danmakuSettings.bottomMargin,
          eq(52),
          "bottom margin slider",
        );
        await asyncAssertScreenshot(
          path.join(
            __dirname,
            "/settings_card_danmaku_bottom_margin_slider.png",
          ),
          path.join(
            __dirname,
            "/golden/settings_card_danmaku_bottom_margin_slider.png",
          ),
          path.join(
            __dirname,
            "/settings_card_danmaku_bottom_margin_slider_diff.png",
          ),
        );
      }
      public async tearDown() {
        await mouseMove(0, 0, 1);
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "UpdateStackingMethod";
      private cut: SettingsCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        let settings = createPlayerSettings();
        this.cut = new SettingsCard(settings).show();
        container.append(this.cut.body);
        let updates = 0;
        this.cut.on("update", () => updates++);

        // Execute
        this.cut.stackingMethodOption.val.dropdownList.val.dropdownEntries[1].select();

        // Verify
        assertThat(updates, eq(1), "1 update");
        assertThat(
          settings.danmakuSettings.stackingMethod,
          eq(StackingMethod.TOP_DOWN),
          "stacking method option",
        );
        await asyncAssertScreenshot(
          path.join(__dirname, "/settings_card_danmaku_stacking_method.png"),
          path.join(
            __dirname,
            "/golden/settings_card_danmaku_stacking_method.png",
          ),
          path.join(
            __dirname,
            "/settings_card_danmaku_stacking_method_diff.png",
          ),
        );
      }
      public async tearDown() {
        this.cut.remove();
      }
    })(),
    new (class implements TestCase {
      public name = "ResetSettings";
      private cut: SettingsCard;
      public async execute() {
        // Prepare
        await setViewport(400, 600);
        let settings: PlayerSettings = {
          danmakuSettings: {
            opacity: 0,
            speed: 100,
            fontSize: 10,
            fontFamily: "Cursive",
            density: 10,
            topMargin: 50,
            bottomMargin: 50,
            stackingMethod: StackingMethod.TOP_DOWN,
          },
        };
        this.cut = new SettingsCard(settings).show();
        container.append(this.cut.body);
        let updates = 0;
        this.cut.on("update", () => updates++);

        // Execute
        this.cut.resetButton.val.click();

        // Verify
        assertThat(updates, eq(1), "1 update");
        assertThat(
          settings,
          eqMessage(
            {
              danmakuSettings: {
                opacity: 80,
                speed: 200,
                fontSize: 25,
                fontFamily: "Arial",
                density: 100,
                topMargin: 1,
                bottomMargin: 10,
                stackingMethod: StackingMethod.RANDOM,
              },
            },
            PLAYER_SETTINGS,
          ),
          "reset settings",
        );
      }
      public async tearDown() {
        this.cut.remove();
      }
    })(),
  ],
});
