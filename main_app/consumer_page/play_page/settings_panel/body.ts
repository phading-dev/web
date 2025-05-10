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
  CommentOverlayStyle,
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
      class: "settings-panel-comment-overlay-options-line",
      style: `display: flex; flex-flow: row wrap; column-gap: 1.5rem; row-gap: 1rem; align-items: center; justify-content: flex-end;`,
    },
    E.div(
      {
        class: "settings-panel-comment-overlay-options-label",
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
      class: "settings-panel-comment-overlay-single-input-line",
      style: `display: flex; flex-flow: row wrap; align-items: center; justify-content: space-between;`,
    },
    E.div(
      {
        class: "settings-panel-comment-overlay-single-input-label",
        style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
      },
      E.text(label),
    ),
    element,
  );
}

export interface SettingsPanel {
  on(event: "selectSubtitle", listener: (index: number) => void): this;
  on(event: "selectAudio", listener: (index: number) => void): this;
  on(event: "updateCommentOverlaySettings", listener: () => void): this;
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
  private subtitleOptionsNotAvailable = new Ref<HTMLDivElement>();
  private audioOptionsContainer = new Ref<HTMLDivElement>();
  private audioOptionsNotAvailable = new Ref<HTMLDivElement>();
  private subtitles: Array<string>;
  public subtitleOptions: Array<OptionPill<number>>;
  private audios: Array<string>;
  public audioOptions: Array<OptionPill<number>>;
  public commentOverlayDisabledOption = new Ref<
    OptionPill<CommentOverlayStyle>
  >();
  public commentOverlaySideOption = new Ref<OptionPill<CommentOverlayStyle>>();
  public commentOverlayDanmakuOption = new Ref<
    OptionPill<CommentOverlayStyle>
  >();
  public commentOverlayOpacity = new Ref<RangedNumberInput>();
  public commentOverlayFontSize = new Ref<RangedNumberInput>();
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
        style: `flex-flow: column nowrap; gap: 2rem; ${customeStyle}`,
      },
      eSection(
        LOCALIZED_TEXT.videoPlayGeneralSettingsLabel,
        assign(
          this.subtitleOptionsContainer,
          eRadioOptionsLine(
            LOCALIZED_TEXT.subtitleOptionsLabel,
            E.divRef(
              this.subtitleOptionsNotAvailable,
              {
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral1};`,
              },
              E.text(LOCALIZED_TEXT.subtitleOptionsNotAvailable),
            ),
          ),
        ),
        assign(
          this.audioOptionsContainer,
          eRadioOptionsLine(
            LOCALIZED_TEXT.audioOptionsLabel,
            E.divRef(
              this.audioOptionsNotAvailable,
              {
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral1};`,
              },
              E.text(LOCALIZED_TEXT.audioOptionsNotAvailable),
            ),
          ),
        ),
      ),
      eSection(
        LOCALIZED_TEXT.commentOverlaySettingsLabel,
        eRadioOptionsLine(
          LOCALIZED_TEXT.commentOverlayStyleLabel,
          assign(
            this.commentOverlayDisabledOption,
            OptionPill.create(
              LOCALIZED_TEXT.commentOverlayStyleDisabledOptionLabel,
              CommentOverlayStyle.NONE,
            ),
          ).body,
          assign(
            this.commentOverlaySideOption,
            OptionPill.create(
              LOCALIZED_TEXT.commentOverlayStyleSideOptionLabel,
              CommentOverlayStyle.SIDE,
            ),
          ).body,
          assign(
            this.commentOverlayDanmakuOption,
            OptionPill.create(
              LOCALIZED_TEXT.commentOverlayStyleDanmakuOptionLabel,
              CommentOverlayStyle.DANMAKU,
            ),
          ).body,
        ),
        eSingleInputLine(
          LOCALIZED_TEXT.commentOverlayOpacityLabel,
          assign(
            this.commentOverlayOpacity,
            new RangedNumberInput(
              OPACITY_RANGE,
              this.settings.commentOverlaySettings.opacity,
              10,
            ),
          ).body,
        ),
        eSingleInputLine(
          LOCALIZED_TEXT.commentOverlayFontSizeLabel,
          assign(
            this.commentOverlayFontSize,
            new RangedNumberInput(
              FONT_SIZE_RANGE,
              this.settings.commentOverlaySettings.fontSize,
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
                this.settings.commentOverlaySettings.danmakuSettings.speed,
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
                this.settings.commentOverlaySettings.danmakuSettings.density,
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
    this.show();

    this.showOrHideDanmkauSettings(settings.commentOverlaySettings.style);
    RadioOptionPillsGroup.create([
      this.commentOverlayDisabledOption.val,
      this.commentOverlaySideOption.val,
      this.commentOverlayDanmakuOption.val,
    ])
      .setValue(settings.commentOverlaySettings.style)
      .on("selected", (value) => {
        this.showOrHideDanmkauSettings(value);
        this.settings.commentOverlaySettings.style = value;
        this.emit("updateCommentOverlaySettings");
      });

    this.commentOverlayOpacity.val.on("changed", (value) => {
      this.settings.commentOverlaySettings.opacity = value;
      this.emit("updateCommentOverlaySettings");
    });
    this.commentOverlayFontSize.val.on("changed", (value) => {
      this.settings.commentOverlaySettings.fontSize = value;
      this.emit("updateCommentOverlaySettings");
    });
    this.danmakuOverlaySpeed.val.on("changed", (value) => {
      this.settings.commentOverlaySettings.danmakuSettings.speed = value;
      this.emit("updateCommentOverlaySettings");
    });
    this.danmakuOverlayDensity.val.on("changed", (value) => {
      this.settings.commentOverlaySettings.danmakuSettings.density = value;
      this.emit("updateCommentOverlaySettings");
    });
    RadioOptionPillsGroup.create([
      this.danmakuStackingRandomOption.val,
      this.danmakuStackingTopDownOption.val,
    ])
      .setValue(settings.commentOverlaySettings.danmakuSettings.stackingMethod)
      .on("selected", (value) => {
        this.settings.commentOverlaySettings.danmakuSettings.stackingMethod =
          value;
        this.emit("updateCommentOverlaySettings");
      });
  }

  public addAvailableSubtitleTracks(
    subtitles: Array<string>,
    initIndex: number,
  ): void {
    this.subtitles = subtitles;
    this.subtitleOptions = [
      OptionPill.create(LOCALIZED_TEXT.subtitleOptionOff, -1),
      ...this.subtitles.map((subtitle, index) =>
        OptionPill.create(subtitle, index),
      ),
    ];
    this.subtitleOptionsNotAvailable.val.remove();
    this.subtitleOptionsContainer.val.append(
      ...this.subtitleOptions.map((option) => option.body),
    );
    RadioOptionPillsGroup.create(this.subtitleOptions)
      .setValue(initIndex)
      .on("selected", (value) => {
        if (value === -1) {
          this.settings.videoSettings.preferredSubtitleName = undefined;
        } else {
          this.settings.videoSettings.preferredSubtitleName =
            this.subtitles[value];
        }
        this.emit("selectSubtitle", value);
      });
  }

  public addAvailableAudioTracks(
    audios: Array<string>,
    initIndex: number,
  ): void {
    this.audios = audios;
    this.audioOptions = this.audios.map((audio, index) =>
      OptionPill.create(audio, index),
    );
    this.audioOptionsNotAvailable.val.remove();
    this.audioOptionsContainer.val.append(
      ...this.audioOptions.map((option) => option.body),
    );
    RadioOptionPillsGroup.create(this.audioOptions)
      .setValue(initIndex)
      .on("selected", (value) => {
        this.settings.videoSettings.preferredAudioName = this.audios[value];
        this.emit("selectAudio", value);
      });
  }

  private showOrHideDanmkauSettings(value: CommentOverlayStyle): void {
    if (value === CommentOverlayStyle.DANMAKU) {
      this.danmakuOverlayOptionsContainer.val.style.display = "flex";
    } else {
      this.danmakuOverlayOptionsContainer.val.style.display = "none";
    }
  }

  public show(): void {
    this.body.style.display = "flex";
  }

  public hide(): void {
    this.body.style.display = "none";
  }
}
