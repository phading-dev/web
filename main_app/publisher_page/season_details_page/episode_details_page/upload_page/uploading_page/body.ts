import EventEmitter = require("events");
import SparkMD5 = require("spark-md5");
import { OUTLINE_BUTTON_STYLE } from "../../../../../../common/button_styles";
import { SCHEME } from "../../../../../../common/color_scheme";
import {
  calculateEstimatedUploadMoneyAndFormat,
  formatStorageEstimatedMonthlyPrice,
} from "../../../../../../common/formatter/price";
import { formatBytesShort } from "../../../../../../common/formatter/quantity";
import { SimpleIconButton } from "../../../../../../common/icon_button";
import { LOCALIZED_TEXT } from "../../../../../../common/locales/localized_text";
import { FONT_M, FONT_S } from "../../../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../../../common/web_service_client";
import { ChunkedUpload } from "../common/chunked_upload";
import { ePage } from "../common/elements";
import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_SUBTITLE_ZIP_TYPES,
  ACCEPTED_VIDEO_TYPES,
  MAX_MEDIA_CONTENT_LENGTH,
  MAX_SUBTITLE_ZIP_CONTENT_LENGTH,
} from "@phading/constants/video";
import {
  newCompleteUploadingRequest,
  newStartUploadingRequest,
} from "@phading/product_service_interface/show/web/publisher/client";
import { ResumableUploadingState } from "@phading/video_service_interface/node/video_container";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export type CreateUploadingPageFn = (
  seasonId: string,
  episodeId: string,
  file: File,
  uploadingState?: ResumableUploadingState,
) => UploadingPage;

export interface UploadingPage {
  on(event: "back", listener: () => void): this;
  on(event: "reSelect", listener: (error: string) => void): this;
  on(event: "cancel", listener: () => void): this;
  on(event: "started", listener: () => void): this;
  on(event: "failed", listener: () => void): this;
}

export class UploadingPage extends EventEmitter {
  public static create(
    seasonId: string,
    episodeId: string,
    file: File,
    uploadingState?: ResumableUploadingState,
  ): UploadingPage {
    return new UploadingPage(
      MAX_MEDIA_CONTENT_LENGTH,
      MAX_SUBTITLE_ZIP_CONTENT_LENGTH,
      ChunkedUpload.create,
      SERVICE_CLIENT,
      () => new Date(),
      seasonId,
      episodeId,
      file,
      uploadingState,
    );
  }

  public body: HTMLDivElement;
  public backButton = new Ref<SimpleIconButton>();
  private progressTip = new Ref<HTMLDivElement>();
  private progressBarFill = new Ref<HTMLDivElement>();
  private uploadingText = new Ref<Text>();
  public cancelButton = new Ref<HTMLDivElement>();
  public chunkedUpload: ChunkedUpload;
  private removed = false;

  public constructor(
    private maxMediaContentLength: number,
    private maxSubtitleZipContentLength: number,
    private createChunkedUpload: (
      blob: Blob,
      resumeUrl: string,
      byteOffset: number,
    ) => ChunkedUpload,
    private serviceClient: WebServiceClient,
    private getNowDate: () => Date,
    private seasonId: string,
    private episodeId: string,
    private file: File,
    private uploadingState?: ResumableUploadingState,
  ) {
    super();
    this.body = ePage(
      this.backButton,
      LOCALIZED_TEXT.uploadingTitle,
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      E.divRef(this.progressTip, {
        class: "upload-page-progress-tip",
        style: `font-size: ${FONT_S}rem; color: ${SCHEME.neutral0}; text-align: center;`,
      }),
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      E.div(
        {
          class: "upload-page-uploading-progress-bar",
          style: `position: relative; width: 100%; height: 2rem; background-color: ${SCHEME.neutral2}; border-radius: 1rem; overflow: hidden;`,
        },
        E.divRef(this.progressBarFill, {
          class: "upload-page-uploading-progress-bar-fill",
          style: `position: absolute; top: 0; left: 0; height: 100%; background-color: ${SCHEME.primary1};`,
        }),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      E.div(
        {
          class: "upload-page-uploading-progress",
          style: `width: 100%; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; text-align: center;`,
        },
        E.textRef(this.uploadingText),
        E.text(` / ${formatBytesShort(this.file.size)}`),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      E.div(
        {
          class: "upload-page-pricing-tip",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(
          `${LOCALIZED_TEXT.uploadingEstimatedFees[0]}${calculateEstimatedUploadMoneyAndFormat(this.file.size, this.getNowDate())}${LOCALIZED_TEXT.uploadingEstimatedFees[1]}${formatStorageEstimatedMonthlyPrice(this.file.size, this.getNowDate())}${LOCALIZED_TEXT.uploadingEstimatedFees[2]}`,
        ),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      E.div(
        {
          class: "upload-page-uploading-actions",
          style: `display: flex; flex-flow: row nowrap; justify-content: flex-end; align-items: center; gap: 2rem;`,
        },
        E.divRef(
          this.cancelButton,
          {
            class: "upload-page-uploading-cancel-button",
            style: OUTLINE_BUTTON_STYLE,
          },
          E.text(LOCALIZED_TEXT.cancelButtonLabel),
        ),
      ),
    );
    this.setProgress(0);
    this.upload();
    this.backButton.val.on("action", () => this.emit("back"));
    this.cancelButton.val.addEventListener("click", () => this.emit("cancel"));
  }

  private async upload() {
    this.progressTip.val.textContent = LOCALIZED_TEXT.uploadingPreparingTip;
    let { error, fileExt, md5 } = await this.validateFile();
    if (error) {
      this.emit("reSelect", error);
      return;
    }
    if (this.removed) {
      return;
    }

    let uploadSessionUrl: string;
    let byteOffset: number;
    try {
      ({ uploadSessionUrl, byteOffset } = await this.serviceClient.send(
        newStartUploadingRequest({
          seasonId: this.seasonId,
          episodeId: this.episodeId,
          contentLength: this.file.size,
          fileExt,
          md5,
        }),
      ));
    } catch (e) {
      console.error(e);
      this.progressTip.val.textContent = LOCALIZED_TEXT.uploadingStartError;
      this.progressTip.val.style.color = SCHEME.error0;
      this.emit("failed");
      return;
    }
    if (this.removed) {
      return;
    }

    this.progressTip.val.textContent = LOCALIZED_TEXT.progressResumingTip;
    this.setProgress(byteOffset);
    this.chunkedUpload = this.createChunkedUpload(
      this.file,
      uploadSessionUrl,
      byteOffset,
    ).on("progress", (progress) => this.setProgress(progress));
    this.emit("started");

    try {
      await this.chunkedUpload.upload();
      await this.serviceClient.send(
        newCompleteUploadingRequest({
          seasonId: this.seasonId,
          episodeId: this.episodeId,
          uploadSessionUrl: uploadSessionUrl,
        }),
      );
    } catch (e) {
      console.error(e);
      this.progressTip.val.textContent = LOCALIZED_TEXT.uploadingGenericError;
      this.progressTip.val.style.color = SCHEME.error0;
      this.emit("failed");
      return;
    }
    this.emit("back");
  }

  public async validateFile(): Promise<{
    error?: string;
    fileExt?: string;
    md5?: string;
  }> {
    let fileExt = this.file.name.split(".").pop();
    if (
      !ACCEPTED_VIDEO_TYPES.has(fileExt) &&
      !ACCEPTED_AUDIO_TYPES.has(fileExt) &&
      !ACCEPTED_SUBTITLE_ZIP_TYPES.has(fileExt)
    ) {
      return {
        error: `${LOCALIZED_TEXT.fileTypeNotAccepted[0]}${this.fileTypesToString(
          Array.from(ACCEPTED_VIDEO_TYPES)
            .concat(Array.from(ACCEPTED_AUDIO_TYPES))
            .concat(Array.from(ACCEPTED_SUBTITLE_ZIP_TYPES)),
        )}${LOCALIZED_TEXT.fileTypeNotAccepted[1]}`,
      };
    }
    if (
      (ACCEPTED_VIDEO_TYPES.has(fileExt) ||
        ACCEPTED_AUDIO_TYPES.has(fileExt)) &&
      this.file.size > this.maxMediaContentLength
    ) {
      return {
        error: `${LOCALIZED_TEXT.fileSizeTooLarge[0]}${formatBytesShort(
          this.maxMediaContentLength,
        )}${LOCALIZED_TEXT.fileSizeTooLarge[1]}`,
      };
    }
    if (
      ACCEPTED_SUBTITLE_ZIP_TYPES.has(fileExt) &&
      this.file.size > this.maxSubtitleZipContentLength
    ) {
      return {
        error: `${LOCALIZED_TEXT.fileSizeTooLarge[0]}${formatBytesShort(
          this.maxSubtitleZipContentLength,
        )}${LOCALIZED_TEXT.fileSizeTooLarge[1]}`,
      };
    }

    let newMd5 = await this.calculateMd5();
    if (
      this.uploadingState &&
      (this.uploadingState.md5 !== newMd5 ||
        this.uploadingState.fileExt !== fileExt)
    ) {
      return { error: LOCALIZED_TEXT.uploadingNotSameFileError };
    }

    return { fileExt, md5: newMd5 };
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

  private async calculateMd5(): Promise<string> {
    let reader = this.file.stream().getReader();
    let md5 = new SparkMD5.ArrayBuffer();
    while (true) {
      let { done, value } = await reader.read();
      if (done) {
        break;
      }
      md5.append(value);
    }
    return md5.end();
  }

  private setProgress(bytes: number): void {
    this.progressBarFill.val.style.width = `${(bytes / this.file.size) * 100}%`;
    this.uploadingText.val.textContent = formatBytesShort(bytes);
  }

  public remove(): void {
    this.removed = true;
    this.chunkedUpload?.stop();
    this.body.remove();
  }
}
