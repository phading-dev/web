import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import {
  OptionPill,
  RadioOptionPillsGroup,
} from "../../../../common/option_pills";
import { FONT_M, FONT_WEIGHT_600 } from "../../../../common/sizes";
import {
  DENSITY_RANGE,
  FONT_SIZE_RANGE,
  OPACITY_RANGE,
  SPEED_RANGE,
} from "../common/defaults";
import { RangedNumberInput } from "./ranged_number_input";
import {
  ChatOverlayStyle,
  StackingMethod,
  VideoPlayerSettings,
} from "@phading/user_service_interface/web/self/video_player_settings";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

function eSection(
  title: string,
  ...elements: Array<HTMLElement>
): HTMLDivElement {
  return E.div(
    {
      class: "settings-panel-section",
      style: `display: flex; flex-flow: column nowrap; gap: 2rem;`,
    },
    E.div(
      {
        class: "settings-panel-section-title",
        style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; font-weight: ${FONT_WEIGHT_600};`,
      },
      E.text(title),
    ),
    ...elements,
  );
}

function eRadioOptionsLine(
  label: string,
  ...elements: Array<HTMLElement>
): HTMLDivElement {
  return E.div(
    {
      class: "settings-panel-chat-overlay-options-line",
      style: `display: flex; flex-flow: row wrap; column-gap: 1.5rem; row-gap: 1rem; align-items: center; justify-content: flex-end;`,
    },
    E.div(
      {
        class: "settings-panel-chat-overlay-options-label",
        style: `flex: 1 0 auto; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
      },
      E.text(label),
    ),
    ...elements,
  );
}

function eSingleInputLine(label: string, element: HTMLElement): HTMLDivElement {
  return E.div(
    {
      class: "settings-panel-chat-overlay-single-input-line",
      style: `display: flex; flex-flow: row wrap; align-items: center; justify-content: space-between;`,
    },
    E.div(
      {
        class: "settings-panel-chat-overlay-single-input-label",
        style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
      },
      E.text(label),
    ),
    element,
  );
}

export interface SettingsPanel {
  on(event: "subtitleSelected", listener: () => void): this;
  on(event: "audioSelected", listener: () => void): this;
  on(event: "chatOverlayStyleChanged", listener: () => void): this;
  on(event: "chatOverlayOpacityChanged", listener: () => void): this;
  on(event: "chatOverlayFontSizeChanged", listener: () => void): this;
  on(event: "danmakuOverlaySpeedChanged", listener: () => void): this;
  on(event: "danmakuOverlayDensityChanged", listener: () => void): this;
  on(event: "danmakuStackingMethodChanged", listener: () => void): this;
}

export class SettingsPanel extends EventEmitter {
  public static create(
    customeStyle: string,
    settings: VideoPlayerSettings,
  ): SettingsPanel {
    return new SettingsPanel(customeStyle, settings);
  }

  public body: HTMLDivElement;
  private subtitleOptionsContainer = new Ref<HTMLDivElement>();
  private audioOptionsContainer = new Ref<HTMLDivElement>();
  public subtitleOptions: Array<OptionPill<string>>;
  public audioOptions: Array<OptionPill<string>>;
  public chatOverlayDisabledOption = new Ref<OptionPill<ChatOverlayStyle>>();
  public chatOverlaySideOption = new Ref<OptionPill<ChatOverlayStyle>>();
  public chatOverlayDanmakuOption = new Ref<OptionPill<ChatOverlayStyle>>();
  public chatOverlayOpacity = new Ref<RangedNumberInput>();
  public chatOverlayFontSize = new Ref<RangedNumberInput>();
  public danmakuOverlaySpeed = new Ref<RangedNumberInput>();
  public danmakuOverlayDensity = new Ref<RangedNumberInput>();
  private danmakuOverlayOptionsContainer = new Ref<HTMLDivElement>();
  public danmakuStackingRandomOption = new Ref<OptionPill<StackingMethod>>();
  public danmakuStackingTopDownOption = new Ref<OptionPill<StackingMethod>>();

  public constructor(
    customeStyle: string,
    private settings: VideoPlayerSettings, // Normalized settings
  ) {
    super();
    this.body = E.div(
      {
        class: "settings-panel",
        style: `display: flex; flex-flow: column nowrap; gap: 2rem; ${customeStyle}`,
      },
      eSection(
        LOCALIZED_TEXT.videoPlayGeneralSettingsLabel,
        assign(
          this.subtitleOptionsContainer,
          eRadioOptionsLine(LOCALIZED_TEXT.subtitleOptionsLabel),
        ),
        assign(
          this.audioOptionsContainer,
          eRadioOptionsLine(LOCALIZED_TEXT.audioOptionsLabel),
        ),
      ),
      eSection(
        LOCALIZED_TEXT.chatOverlaySettingsLabel,
        eRadioOptionsLine(
          LOCALIZED_TEXT.chatOverlayStyleLabel,
          assign(
            this.chatOverlayDisabledOption,
            OptionPill.create(
              LOCALIZED_TEXT.chatOverlayStyleDisabledOptionLabel,
              ChatOverlayStyle.NONE,
            ),
          ).body,
          assign(
            this.chatOverlaySideOption,
            OptionPill.create(
              LOCALIZED_TEXT.chatOverlayStyleSideOptionLabel,
              ChatOverlayStyle.SIDE,
            ),
          ).body,
          assign(
            this.chatOverlayDanmakuOption,
            OptionPill.create(
              LOCALIZED_TEXT.chatOverlayStyleDanmakuOptionLabel,
              ChatOverlayStyle.DANMAKU,
            ),
          ).body,
        ),
        eSingleInputLine(
          LOCALIZED_TEXT.chatOverlayOpacityLabel,
          assign(
            this.chatOverlayOpacity,
            new RangedNumberInput(
              OPACITY_RANGE,
              this.settings.chatOverlaySettings.opacity,
              10,
            ),
          ).body,
        ),
        eSingleInputLine(
          LOCALIZED_TEXT.chatOverlayFontSizeLabel,
          assign(
            this.chatOverlayFontSize,
            new RangedNumberInput(
              FONT_SIZE_RANGE,
              this.settings.chatOverlaySettings.fontSize,
              1,
            ),
          ).body,
        ),
      ),
      assign(
        this.danmakuOverlayOptionsContainer,
        eSection(
          LOCALIZED_TEXT.danmakuOverlaySettingsLabel,
          eSingleInputLine(
            LOCALIZED_TEXT.danmakuOverlaySpeedLabel,
            assign(
              this.danmakuOverlaySpeed,
              new RangedNumberInput(
                SPEED_RANGE,
                this.settings.chatOverlaySettings.danmakuSettings.speed,
                25,
              ),
            ).body,
          ),
          eSingleInputLine(
            LOCALIZED_TEXT.danmakuOverlayDensityLabel,
            assign(
              this.danmakuOverlayDensity,
              new RangedNumberInput(
                DENSITY_RANGE,
                this.settings.chatOverlaySettings.danmakuSettings.density,
                5,
              ),
            ).body,
          ),
          eRadioOptionsLine(
            LOCALIZED_TEXT.danmakuOverlayStackingMethodLabel,
            assign(
              this.danmakuStackingRandomOption,
              OptionPill.create(
                LOCALIZED_TEXT.danmakuOverlayStackingRandomOptionLabel,
                StackingMethod.RANDOM,
              ),
            ).body,
            assign(
              this.danmakuStackingTopDownOption,
              OptionPill.create(
                LOCALIZED_TEXT.danmakuOverlayStackingTopDownOptionLabel,
                StackingMethod.TOP_DOWN,
              ),
            ).body,
          ),
        ),
      ),
    );
    this.showOrHideDanmkauSettings(settings.chatOverlaySettings.style);
    RadioOptionPillsGroup.create([
      this.chatOverlayDisabledOption.val,
      this.chatOverlaySideOption.val,
      this.chatOverlayDanmakuOption.val,
    ])
      .setValue(settings.chatOverlaySettings.style)
      .on("selected", (value) => {
        this.showOrHideDanmkauSettings(value);
        this.settings.chatOverlaySettings.style = value;
        this.emit("chatOverlayStyleChanged");
      });
    this.chatOverlayOpacity.val.on("changed", (value) => {
      this.settings.chatOverlaySettings.opacity = value;
      this.emit("chatOverlayOpacityChanged");
    });
    this.chatOverlayFontSize.val.on("changed", (value) => {
      this.settings.chatOverlaySettings.fontSize = value;
      this.emit("chatOverlayFontSizeChanged");
    });
    this.danmakuOverlaySpeed.val.on("changed", (value) => {
      this.settings.chatOverlaySettings.danmakuSettings.speed = value;
      this.emit("danmakuOverlaySpeedChanged");
    });
    this.danmakuOverlayDensity.val.on("changed", (value) => {
      this.settings.chatOverlaySettings.danmakuSettings.density = value;
      this.emit("danmakuOverlayDensityChanged");
    });
    RadioOptionPillsGroup.create([
      this.danmakuStackingRandomOption.val,
      this.danmakuStackingTopDownOption.val,
    ])
      .setValue(settings.chatOverlaySettings.danmakuSettings.stackingMethod)
      .on("selected", (value) => {
        this.settings.chatOverlaySettings.danmakuSettings.stackingMethod =
          value;
        this.emit("danmakuStackingMethodChanged");
      });
  }

  public setAvailableTracks(
    subtitles: Array<string>,
    initSubtitle: string,
    audios: Array<string>,
    initAudio: string,
  ): void {
    this.subtitleOptions = subtitles.map((subtitle) =>
      OptionPill.create(subtitle, subtitle),
    );
    this.subtitleOptionsContainer.val.append(
      ...this.subtitleOptions.map((option) => option.body),
    );
    RadioOptionPillsGroup.create(this.subtitleOptions)
      .setValue(initSubtitle)
      .on("selected", (value) => {
        this.settings.videoSettings.preferredSubtitleName = value;
        this.emit("subtitleSelected", value);
      });

    this.audioOptions = audios.map((audio) => OptionPill.create(audio, audio));
    this.audioOptionsContainer.val.append(
      ...this.audioOptions.map((option) => option.body),
    );
    RadioOptionPillsGroup.create(this.audioOptions)
      .setValue(initAudio)
      .on("selected", (value) => {
        this.settings.videoSettings.preferredAudioName = value;
        this.emit("audioSelected", value);
      });
  }

  private showOrHideDanmkauSettings(value: ChatOverlayStyle): void {
    if (value === ChatOverlayStyle.DANMAKU) {
      this.danmakuOverlayOptionsContainer.val.style.display = "flex";
    } else {
      this.danmakuOverlayOptionsContainer.val.style.display = "none";
    }
  }
}
