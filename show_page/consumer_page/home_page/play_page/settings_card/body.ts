import EventEmitter = require("events");
import { SCHEME } from "../../../../../common/color_scheme";
import { createResetIcon } from "../../../../../common/icons";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { FONT_L } from "../../../../../common/sizes";
import {
  BOTTOM_MARGIN_RANGE,
  DENSITY_RANGE,
  ENABLE_CHAT_SCROLLING_DEFAULT,
  FONT_FAMILY_DEFAULT,
  FONT_SIZE_RANGE,
  OPACITY_RANGE,
  SPEED_RANGE,
  STACKING_METHOD_DEFAULT,
  TOP_MARGIN_RANGE,
} from "../common/defaults";
import { DropdownOption } from "./dropdown_option";
import { SilderWithTextOption } from "./slider_with_text_option";
import { INPUT_WIDTH, LABEL_STYLE } from "./styles";
import { SwitchCheckboxOption } from "./switch_checkbox_option";
import { TextOption } from "./text_option";
import {
  PlayerSettings,
  StackingMethod,
} from "@phading/product_service_interface/consumer/show_app/player_settings";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface SettingsCard {
  on(event: "update", listener: () => void): this;
}

export class SettingsCard extends EventEmitter {
  public static create(playerSetings: PlayerSettings): SettingsCard {
    return new SettingsCard(playerSetings);
  }

  public body: HTMLDivElement;
  public enableOption = new Ref<SwitchCheckboxOption>();
  public opacityOption = new Ref<SilderWithTextOption>();
  public speedOption = new Ref<SilderWithTextOption>();
  public fontSizeOption = new Ref<SilderWithTextOption>();
  public fontFamilyOption = new Ref<TextOption>();
  public densityOption = new Ref<SilderWithTextOption>();
  public topMarginOption = new Ref<SilderWithTextOption>();
  public bottomMarginOption = new Ref<SilderWithTextOption>();
  public stackingMethodOption = new Ref<DropdownOption<StackingMethod>>();
  public resetButton = new Ref<HTMLDivElement>();

  public constructor(private playerSetings: PlayerSettings) {
    super();
    this.body = E.div(
      {
        class: "settings-card",
        style: `width: 100%; height: 100%; overflow-y: auto; padding: 1rem 2rem; box-sizing: border-box; display: flex; flex-flow: column nowrap; gap: 1rem; background-color: ${SCHEME.neutral4};`,
      },
      E.div(
        {
          class: "settings-card-danmaku-settings",
          style: `align-self: center; font-size: ${FONT_L}rem; font-weight: 600; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.danmakuSettingsLabel),
      ),
      assign(
        this.enableOption,
        SwitchCheckboxOption.create(
          LOCALIZED_TEXT.danmakuEnableOption,
          ENABLE_CHAT_SCROLLING_DEFAULT,
          playerSetings.danmakuSettings.enable,
        ),
      ).body,
      assign(
        this.opacityOption,
        SilderWithTextOption.create(
          LOCALIZED_TEXT.danmakuOpacityOption,
          OPACITY_RANGE,
          playerSetings.danmakuSettings.opacity,
        ),
      ).body,
      assign(
        this.speedOption,
        SilderWithTextOption.create(
          LOCALIZED_TEXT.danmakuSpeedOption,
          SPEED_RANGE,
          playerSetings.danmakuSettings.speed,
        ),
      ).body,
      assign(
        this.fontSizeOption,
        SilderWithTextOption.create(
          LOCALIZED_TEXT.danmakuFontSizeOption,
          FONT_SIZE_RANGE,
          playerSetings.danmakuSettings.fontSize,
        ),
      ).body,
      assign(
        this.fontFamilyOption,
        TextOption.create(
          LOCALIZED_TEXT.danmakuFontFamilyOption,
          FONT_FAMILY_DEFAULT,
          playerSetings.danmakuSettings.fontFamily,
        ),
      ).body,
      assign(
        this.densityOption,
        SilderWithTextOption.create(
          LOCALIZED_TEXT.danmakuDensityOption,
          DENSITY_RANGE,
          playerSetings.danmakuSettings.density,
        ),
      ).body,
      assign(
        this.topMarginOption,
        SilderWithTextOption.create(
          LOCALIZED_TEXT.danmakuTopMarginOption,
          TOP_MARGIN_RANGE,
          playerSetings.danmakuSettings.topMargin,
        ),
      ).body,
      assign(
        this.bottomMarginOption,
        SilderWithTextOption.create(
          LOCALIZED_TEXT.danmakuBottomMarginOption,
          BOTTOM_MARGIN_RANGE,
          playerSetings.danmakuSettings.bottomMargin,
        ),
      ).body,
      assign(
        this.stackingMethodOption,
        DropdownOption.create(
          LOCALIZED_TEXT.danmakuStackingMethodOption,
          [
            {
              kind: StackingMethod.RANDOM,
              localizedMsg: LOCALIZED_TEXT.danmakuStackingRandomOption,
            },
            {
              kind: StackingMethod.TOP_DOWN,
              localizedMsg: LOCALIZED_TEXT.danmakuStackingTopDownOption,
            },
          ],
          STACKING_METHOD_DEFAULT,
          playerSetings.danmakuSettings.stackingMethod,
        ),
      ).body,
      E.div(
        {
          class: "settings-card-reset-entry",
          style: `display: flex; flex-flow: row nowrap; justify-content: space-between; align-items: center;`,
        },
        E.div(
          {
            class: "settings-card-reset-label",
            style: LABEL_STYLE,
          },
          E.text(LOCALIZED_TEXT.resetButtonLabel),
        ),
        E.divRef(
          this.resetButton,
          {
            class: "settings-card-reset-button",
            style: `width: ${INPUT_WIDTH}rem; height: ${INPUT_WIDTH}rem; padding: 1rem; box-sizing: border-box; cursor: pointer;`,
          },
          createResetIcon(SCHEME.neutral1),
        ),
      ),
    );

    this.enableOption.val.on("update", (value) =>
      this.updateEnableOption(value),
    );
    this.opacityOption.val.on("update", (value) =>
      this.updateOpacityOption(value),
    );
    this.speedOption.val.on("update", (value) => this.updateSpeedOption(value));
    this.fontSizeOption.val.on("update", (value) =>
      this.updateFontSizeOption(value),
    );
    this.fontFamilyOption.val.on("update", (value) =>
      this.updateFontFamilyOption(value),
    );
    this.densityOption.val.on("update", (value) =>
      this.updateDensityOption(value),
    );
    this.topMarginOption.val.on("update", (value) =>
      this.updateTopMarginOption(value),
    );
    this.bottomMarginOption.val.on("update", (value) =>
      this.updateBottomMarginOption(value),
    );
    this.stackingMethodOption.val.on("update", (value) =>
      this.updateStackingMethodOption(value),
    );
    this.resetButton.val.addEventListener("click", () => this.resetSettings());
  }

  private updateEnableOption(value: boolean): void {
    this.playerSetings.danmakuSettings.enable = value;
    this.emit("update");
  }

  private updateOpacityOption(value: number): void {
    this.playerSetings.danmakuSettings.opacity = value;
    this.emit("update");
  }

  private updateSpeedOption(value: number): void {
    this.playerSetings.danmakuSettings.speed = value;
    this.emit("update");
  }

  private updateFontSizeOption(value: number): void {
    this.playerSetings.danmakuSettings.fontSize = value;
    this.emit("update");
  }

  private updateFontFamilyOption(value: string): void {
    this.playerSetings.danmakuSettings.fontFamily = value;
    this.emit("update");
  }

  private updateDensityOption(value: number): void {
    this.playerSetings.danmakuSettings.density = value;
    this.emit("update");
  }

  private updateTopMarginOption(value: number): void {
    this.playerSetings.danmakuSettings.topMargin = value;
    this.emit("update");
  }

  private updateBottomMarginOption(value: number): void {
    this.playerSetings.danmakuSettings.bottomMargin = value;
    this.emit("update");
  }

  private updateStackingMethodOption(value: StackingMethod): void {
    this.playerSetings.danmakuSettings.stackingMethod = value;
    this.emit("update");
  }

  private resetSettings(): void {
    this.playerSetings.danmakuSettings.enable = this.enableOption.val.reset();
    this.playerSetings.danmakuSettings.opacity = this.opacityOption.val.reset();
    this.playerSetings.danmakuSettings.speed = this.speedOption.val.reset();
    this.playerSetings.danmakuSettings.fontSize =
      this.fontSizeOption.val.reset();
    this.playerSetings.danmakuSettings.fontFamily =
      this.fontFamilyOption.val.reset();
    this.playerSetings.danmakuSettings.density = this.densityOption.val.reset();
    this.playerSetings.danmakuSettings.topMargin =
      this.topMarginOption.val.reset();
    this.playerSetings.danmakuSettings.bottomMargin =
      this.bottomMarginOption.val.reset();
    this.playerSetings.danmakuSettings.stackingMethod =
      this.stackingMethodOption.val.reset();
    this.emit("update");
  }

  public remove(): void {
    this.body.remove();
  }
}
