import EventEmitter = require("events");
import { SCHEME } from "../../../../../../common/color_scheme";
import {
  formatStoragePrice,
  formatUploadPrice,
} from "../../../../../../common/formatter/price";
import { formatBytesShort } from "../../../../../../common/formatter/quantity";
import { SimpleIconButton } from "../../../../../../common/icon_button";
import { createQuestionMarkIcon } from "../../../../../../common/icons";
import { LOCALIZED_TEXT } from "../../../../../../common/locales/localized_text";
import { FONT_M, ICON_BUTTON_M, ICON_L } from "../../../../../../common/sizes";
import { ePage } from "../common/elements";
import { FileDropZone } from "../common/file_drop_zone";
import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_SUBTITLE_ZIP_TYPES,
  ACCEPTED_VIDEO_TYPES,
  MAX_MEDIA_CONTENT_LENGTH,
  MAX_SUBTITLE_ZIP_CONTENT_LENGTH,
} from "@phading/constants/video";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface NewUploadPage {
  on(event: "back", listener: () => void): this;
  on(event: "upload", listener: (file: File) => void): this;
}

export class NewUploadPage extends EventEmitter {
  public static create(): NewUploadPage {
    return new NewUploadPage(
      MAX_MEDIA_CONTENT_LENGTH,
      MAX_SUBTITLE_ZIP_CONTENT_LENGTH,
      () => new Date(),
    );
  }

  public body: HTMLDivElement;
  public backButton = new Ref<SimpleIconButton>();
  public fileDropZone = new Ref<FileDropZone>();
  public videoQuestionMark = new Ref<HTMLDivElement>();
  public audioQuestionMark = new Ref<HTMLDivElement>();
  public subtitlesQuestionMark = new Ref<HTMLDivElement>();
  private errorMessage = new Ref<HTMLDivElement>();
  private videoTip = new Ref<HTMLDivElement>();
  private audioTip = new Ref<HTMLDivElement>();
  private subtitlesTip = new Ref<HTMLDivElement>();

  public constructor(
    private maxMediaContentLength: number,
    private maxSubtitleZipContentLength: number,
    private getNowDate: () => Date,
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
            `${LOCALIZED_TEXT.videoFileTipOne[0]}${this.fileTypesToString(
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
            `${LOCALIZED_TEXT.audioFileTipOne[0]}${this.fileTypesToString(
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
            `${LOCALIZED_TEXT.subtitlesFileTipOne[0]}${this.fileTypesToString(Array.from(ACCEPTED_SUBTITLE_ZIP_TYPES))}${LOCALIZED_TEXT.subtitlesFileTipOne[1]}`,
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
    this.fileDropZone.val.on("selected", (file) =>
      this.validateFileAndSelect(file),
    );
    this.backButton.val.on("action", () => this.emit("back"));
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

  public async validateFileAndSelect(file: File) {
    let fileType = file.name.split(".").pop();
    if (
      !ACCEPTED_VIDEO_TYPES.has(fileType) &&
      !ACCEPTED_AUDIO_TYPES.has(fileType) &&
      !ACCEPTED_SUBTITLE_ZIP_TYPES.has(fileType)
    ) {
      this.errorMessage.val.style.display = "block";
      this.errorMessage.val.textContent = `${LOCALIZED_TEXT.fileTypeNotAccepted[0]}${this.fileTypesToString(
        Array.from(ACCEPTED_VIDEO_TYPES)
          .concat(Array.from(ACCEPTED_AUDIO_TYPES))
          .concat(Array.from(ACCEPTED_SUBTITLE_ZIP_TYPES)),
      )}${LOCALIZED_TEXT.fileTypeNotAccepted[1]}`;
      return;
    }
    if (
      (ACCEPTED_VIDEO_TYPES.has(fileType) ||
        ACCEPTED_AUDIO_TYPES.has(fileType)) &&
      file.size > this.maxMediaContentLength
    ) {
      this.errorMessage.val.style.display = "block";
      this.errorMessage.val.textContent = `${LOCALIZED_TEXT.fileSizeTooLarge[0]}${formatBytesShort(
        this.maxMediaContentLength,
      )}${LOCALIZED_TEXT.fileSizeTooLarge[1]}`;
      return;
    }
    if (
      ACCEPTED_SUBTITLE_ZIP_TYPES.has(fileType) &&
      file.size > this.maxSubtitleZipContentLength
    ) {
      this.errorMessage.val.style.display = "block";
      this.errorMessage.val.textContent = `${LOCALIZED_TEXT.fileSizeTooLarge[0]}${formatBytesShort(
        this.maxSubtitleZipContentLength,
      )}${LOCALIZED_TEXT.fileSizeTooLarge[1]}`;
      return;
    }
    this.emit("upload", file);
  }

  private fileTypesToString(types: Array<string>): string {
    if (types.length > 1) {
      let lastType = types.pop();
      return (
        types.map((type) => `.${type}`).join(LOCALIZED_TEXT.fileTypeJoinComma) +
        LOCALIZED_TEXT.fileTypesJoinOr +
        `.${lastType}`
      );
    } else {
      return `.${types[0]}`;
    }
  }

  public remove() {
    this.body.remove();
  }
}
