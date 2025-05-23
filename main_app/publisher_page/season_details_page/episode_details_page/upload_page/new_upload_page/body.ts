import EventEmitter = require("events");
import { SCHEME } from "../../../../../../common/color_scheme";
import {
  formatStoragePrice,
  formatUploadPrice,
} from "../../../../../../common/formatter/price";
import { SimpleIconButton } from "../../../../../../common/icon_button";
import { createQuestionMarkIcon } from "../../../../../../common/icons";
import { LOCALIZED_TEXT } from "../../../../../../common/locales/localized_text";
import { FONT_M, ICON_BUTTON_M, ICON_L } from "../../../../../../common/sizes";
import { ePage } from "../common/elements";
import { FileDropZone } from "../common/file_drop_zone";
import { fileTypesToString } from "../common/file_types_to_string";
import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_SUBTITLE_ZIP_TYPES,
  ACCEPTED_VIDEO_TYPES,
} from "@phading/constants/video";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface NewUploadPage {
  on(event: "back", listener: () => void): this;
  on(event: "upload", listener: (file: File) => void): this;
}

export class NewUploadPage extends EventEmitter {
  public static create(error?: string): NewUploadPage {
    return new NewUploadPage(() => new Date(), error);
  }

  public body: HTMLDivElement;
  public backButton = new Ref<SimpleIconButton>();
  public fileDropZone = new Ref<FileDropZone>();
  private errorMessage = new Ref<HTMLDivElement>();
  public videoQuestionMark = new Ref<HTMLDivElement>();
  public audioQuestionMark = new Ref<HTMLDivElement>();
  public subtitlesQuestionMark = new Ref<HTMLDivElement>();
  private videoTip = new Ref<HTMLDivElement>();
  private audioTip = new Ref<HTMLDivElement>();
  private subtitlesTip = new Ref<HTMLDivElement>();

  public constructor(
    private getNowDate: () => Date,
    error?: string,
  ) {
    super();
    this.body = ePage(
      this.backButton,
      LOCALIZED_TEXT.startNewUploadTitle,
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      assign(this.fileDropZone, new FileDropZone()).body,
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      E.divRef(this.errorMessage, {
        class: "upload-page-drop-zone-error-message",
        style: `display: none; margin-bottom: .5rem; font-size: ${FONT_M}rem; color: ${SCHEME.error0};`,
      }),
      E.div(
        {
          class: "upload-page-drop-zone-instructions",
          style: `display: flex; flex-flow: row wrap; align-items: center; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.newUploadInstructions[0]),
        E.divRef(
          this.videoQuestionMark,
          {
            class: "upload-page-drop-zone-video-question-mark",
            style: `cursor: pointer; width: ${ICON_BUTTON_M}rem; height: ${ICON_BUTTON_M}rem; box-sizing: border-box; padding: ${(ICON_BUTTON_M - ICON_L) / 2}rem;`,
          },
          createQuestionMarkIcon(SCHEME.neutral1),
        ),
        E.text(LOCALIZED_TEXT.newUploadInstructions[1]),
        E.divRef(
          this.audioQuestionMark,
          {
            class: "upload-page-drop-zone-audio-question-mark",
            style: `cursor: pointer; width: ${ICON_BUTTON_M}rem; height: ${ICON_BUTTON_M}rem; box-sizing: border-box; padding: ${(ICON_BUTTON_M - ICON_L) / 2}rem;`,
          },
          createQuestionMarkIcon(SCHEME.neutral1),
        ),
        E.text(LOCALIZED_TEXT.newUploadInstructions[2]),
        E.divRef(
          this.subtitlesQuestionMark,
          {
            class: "upload-page-drop-zone-subtitles-question-mark",
            style: `cursor: pointer; width: ${ICON_BUTTON_M}rem; height: ${ICON_BUTTON_M}rem; box-sizing: border-box; padding: ${(ICON_BUTTON_M - ICON_L) / 2}rem;`,
          },
          createQuestionMarkIcon(SCHEME.neutral1),
        ),
        E.text(LOCALIZED_TEXT.newUploadInstructions[3]),
      ),
      E.divRef(
        this.videoTip,
        {
          class: "upload-page-drop-zone-video-tip",
          style: `margin-top: .5rem; flex-flow: column nowrap; gap: .5rem;`,
        },
        E.div(
          {
            class: "upload-page-drop-zone-video-tip-text1",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${LOCALIZED_TEXT.videoFileTipOne[0]}${fileTypesToString(
              Array.from(ACCEPTED_VIDEO_TYPES),
            )}${LOCALIZED_TEXT.videoFileTipOne[1]}`,
          ),
        ),
        E.div(
          {
            class: "upload-page-drop-zone-video-tip-text2",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.videoFileTipTwo),
        ),
        E.div(
          {
            class: "upload-page-drop-zone-video-tip-text3",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.videoFileTipThree),
        ),
        E.div(
          {
            class: "upload-page-drop-zone-video-tip-text4",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.videoFileTipFour),
        ),
      ),
      E.divRef(
        this.audioTip,
        {
          class: "upload-page-drop-zone-audio-tip",
          style: `margin-top: .5rem; flex-flow: column nowrap; gap: .5rem;`,
        },
        E.div(
          {
            class: "upload-page-drop-zone-audio-tip-text1",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${LOCALIZED_TEXT.audioFileTipOne[0]}${fileTypesToString(
              Array.from(ACCEPTED_AUDIO_TYPES),
            )}${LOCALIZED_TEXT.audioFileTipOne[1]}`,
          ),
        ),
        E.div(
          {
            class: "upload-page-drop-zone-audio-tip-text2",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.audioFileTipTwo),
        ),
        E.div(
          {
            class: "upload-page-drop-zone-audio-tip-text3",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.audioFileTipThree),
        ),
      ),
      E.divRef(
        this.subtitlesTip,
        {
          class: "upload-page-drop-zone-subtitles-tip",
          style: `margin-top: .5rem; flex-flow: column nowrap; gap: .5rem;`,
        },
        E.div(
          {
            class: "upload-page-drop-zone-subtitles-tip-text1",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(
            `${LOCALIZED_TEXT.subtitlesFileTipOne[0]}${fileTypesToString(Array.from(ACCEPTED_SUBTITLE_ZIP_TYPES))}${LOCALIZED_TEXT.subtitlesFileTipOne[1]}`,
          ),
        ),
        E.div(
          {
            class: "upload-page-drop-zone-subtitles-tip-text1",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.subtitlesFileTipTwo),
        ),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      E.div(
        {
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          `${LOCALIZED_TEXT.uploadPricing[0]}${formatUploadPrice(this.getNowDate())}${LOCALIZED_TEXT.uploadPricing[1]}${formatStoragePrice(this.getNowDate())}${LOCALIZED_TEXT.uploadPricing[2]}`,
        ),
      ),
    );
    this.backButton.val.on("action", () => this.emit("back"));
    this.fileDropZone.val.on("selected", (file) => this.emit("upload", file));
    if (error) {
      this.errorMessage.val.textContent = error;
      this.errorMessage.val.style.display = "block";
    }

    this.hideTips();
    this.videoQuestionMark.val.addEventListener("click", () =>
      this.showVideoTip(),
    );
    this.audioQuestionMark.val.addEventListener("click", () =>
      this.showAudioTip(),
    );
    this.subtitlesQuestionMark.val.addEventListener("click", () =>
      this.showSubtitlesTip(),
    );
  }

  private hideTips() {
    this.videoTip.val.style.display = "none";
    this.subtitlesTip.val.style.display = "none";
    this.audioTip.val.style.display = "none";
  }

  private showVideoTip() {
    this.hideTips();
    this.videoTip.val.style.display = "flex";
  }

  private showAudioTip() {
    this.hideTips();
    this.audioTip.val.style.display = "flex";
  }

  private showSubtitlesTip() {
    this.hideTips();
    this.subtitlesTip.val.style.display = "flex";
  }

  public remove() {
    this.body.remove();
  }
}
