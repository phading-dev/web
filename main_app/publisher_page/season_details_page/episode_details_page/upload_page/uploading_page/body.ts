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
}

export class UploadingPage extends EventEmitter {
  public static create(
    seasonId: string,
    episodeId: string,
    file: File,
    uploadingState?: ResumableUploadingState,
  ): UploadingPage {
    return new UploadingPage(
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
  protected chunkedUpload: ChunkedUpload;
  private removed = false;

  public constructor(
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
    let fileExt = this.file.name.split(".").pop();
    let newMd5 = await this.calculateMd5();
    if (
      this.uploadingState &&
      (this.uploadingState.md5 !== newMd5 ||
        this.uploadingState.fileExt !== fileExt)
    ) {
      this.emit("reSelect", LOCALIZED_TEXT.uploadingNotSameFileError);
      return;
    }
    if (this.removed) {
      return;
    }

    let { uploadSessionUrl, byteOffset } = await this.serviceClient.send(
      newStartUploadingRequest({
        seasonId: this.seasonId,
        episodeId: this.episodeId,
        contentLength: this.file.size,
        fileExt,
        md5: newMd5,
      }),
    );
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

    await this.chunkedUpload.upload();
    await this.serviceClient.send(
      newCompleteUploadingRequest({
        seasonId: this.seasonId,
        episodeId: this.episodeId,
        uploadSessionUrl: uploadSessionUrl,
      }),
    );
    this.emit("back");
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
