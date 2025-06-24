import EventEmitter = require("events");
import {
  BlockingButton,
  FilledBlockingButton,
} from "../../../../common/blocking_button";
import { SCHEME } from "../../../../common/color_scheme";
import { FileDropZone } from "../../../../common/file_drop_zone";
import { formatBytesShort } from "../../../../common/formatter/quantity";
import {
  SimpleIconButton,
  createBackButton,
} from "../../../../common/icon_button";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import {
  PAGE_MAX_WIDTH_M,
  ePageWithCenterForm,
} from "../../../../common/page_elements";
import { eCoverImage } from "../../../../common/season_cover_image";
import { FONT_L, FONT_M, FONT_S } from "../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import {
  COVER_IMAGE_HEIGHT,
  COVER_IMAGE_WIDTH,
  MAX_COVER_IMAGE_BUFFER_SIZE,
} from "@phading/constants/show";
import { newUploadCoverImageRequest } from "@phading/product_service_interface/show/web/publisher/client";
import { SeasonDetails } from "@phading/product_service_interface/show/web/publisher/details";
import { UploadCoverImageResponse } from "@phading/product_service_interface/show/web/publisher/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdateCoverImagePage {
  on(event: "back", listener: () => void): this;
  on(event: "loaded", listener: () => void): this;
  on(event: "uploaded", listener: () => void): this;
}

export class UpdateCoverImagePage extends EventEmitter {
  public static create(
    seasonId: string,
    season: SeasonDetails,
  ): UpdateCoverImagePage {
    return new UpdateCoverImagePage(
      SERVICE_CLIENT,
      MAX_COVER_IMAGE_BUFFER_SIZE,
      seasonId,
      season,
    );
  }

  public body: HTMLDivElement;
  public backButton = new Ref<SimpleIconButton>();
  public fileDropZone = new Ref<FileDropZone>();
  private loadErrorMessage = new Ref<HTMLDivElement>();
  private previewImage = new Ref<HTMLDivElement>();
  public submitButton = new Ref<BlockingButton<UploadCoverImageResponse>>();
  private submitErrorMessage = new Ref<HTMLDivElement>();
  private loadIndex = 0;
  private file: File;

  public constructor(
    private serviceClient: WebServiceClient,
    private maxImageSize: number,
    public seasonId: string,
    public season: SeasonDetails,
  ) {
    super();
    this.body = ePageWithCenterForm(
      new Ref<HTMLFormElement>(),
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
      `max-width: ${PAGE_MAX_WIDTH_M}rem; display: flex; flex-flow: column nowrap; align-items: center;`,
      assign(this.backButton, createBackButton()).body,
      E.div(
        {
          class: "update-cover-image-title",
          style: `font-size: ${FONT_L}rem; color: ${SCHEME.neutral0}; max-width: 80%;`,
        },
        E.text(LOCALIZED_TEXT.updateSeasonCoverImageTitle),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      assign(this.fileDropZone, new FileDropZone("width: 100%;")).body,
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      assign(
        this.loadErrorMessage,
        E.div({
          class: "update-cover-image-load-error-message",
          style: `display: none; align-self: flex-start; margin-bottom: .5rem; font-size: ${FONT_S}rem; color: ${SCHEME.error0};`,
        }),
      ),
      E.div(
        {
          class: "update-cover-image-instruction",
          style: `align-self: flex-start; font-size: ${FONT_M}rem; color: ${SCHEME.neutral1};`,
        },
        E.text(
          `${LOCALIZED_TEXT.updateSeasonCoverImageInstruction[0]}${COVER_IMAGE_WIDTH}${LOCALIZED_TEXT.updateSeasonCoverImageInstruction[1]}${COVER_IMAGE_HEIGHT}${LOCALIZED_TEXT.updateSeasonCoverImageInstruction[2]}`,
        ),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 3rem;`,
      }),
      E.div(
        {
          class: "update-cover-image-preview-title",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.updateSeasonCoverImagePreviewTitle),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      E.divRef(
        this.previewImage,
        {
          class: "update-cover-image-preview",
          style: `width: 100%; max-width: 40.2rem; box-sizing: border-box; border: .1rem solid ${SCHEME.neutral1};`,
        },
        eCoverImage(`100%`, season.coverImageUrl),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 3rem;`,
      }),
      assign(
        this.submitButton,
        new FilledBlockingButton<UploadCoverImageResponse>()
          .append(E.text(LOCALIZED_TEXT.updateButtonLabel))
          .disable(),
      ).body,
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      E.divRef(
        this.submitErrorMessage,
        {
          class: "update-cover-image-submit-error-message",
          style: `visibility: hidden; font-size: ${FONT_S}rem; color: ${SCHEME.error0};`,
        },
        E.text("1"),
      ),
    );
    this.backButton.val.on("action", () => this.emit("back"));
    this.fileDropZone.val.on("select", (file: File) => this.selectFile(file));
    this.submitButton.val.addAction(
      () => this.upload(),
      (response, error) => this.postUpload(error),
    );
  }

  private async selectFile(file: File): Promise<void> {
    this.loadIndex++;
    let loadIndex = this.loadIndex;

    this.loadErrorMessage.val.style.display = "none";
    this.submitButton.val.disable();
    if (file.size > this.maxImageSize) {
      this.loadErrorMessage.val.style.display = "block";
      this.loadErrorMessage.val.textContent = `${LOCALIZED_TEXT.fileSizeTooLarge[0]}${formatBytesShort(this.maxImageSize)}${LOCALIZED_TEXT.fileSizeTooLarge[1]}`;
      this.emit("loaded");
      return;
    }

    let imageEle: HTMLImageElement;
    try {
      imageEle = await new Promise<HTMLImageElement>((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => {
          let imageEle = E.image({
            style: `width: 100%; aspect-ratio: 2 / 3; object-fit: contain;`,
            src: reader.result as string,
          });
          imageEle.onload = () => {
            resolve(imageEle);
          };
          imageEle.onerror = () => {
            reject(new Error("Invalid image file."));
          };
        };
        reader.onerror = (err) => {
          reject(new Error("Failed to read image file."));
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      if (loadIndex !== this.loadIndex) {
        // If the load index has changed, ignore this error
        return;
      }
      console.error("Error loading image file:", error);
      this.loadErrorMessage.val.style.display = "block";
      this.loadErrorMessage.val.textContent =
        LOCALIZED_TEXT.updateSeasonCoverImageUnableToLoadError;
      this.emit("loaded");
      return;
    }
    if (loadIndex !== this.loadIndex) {
      // If the load index has changed, ignore this preview
      return;
    }
    this.file = file;
    this.previewImage.val.lastElementChild.remove();
    this.previewImage.val.append(imageEle);
    this.submitButton.val.enable();
    this.emit("loaded");
  }

  private upload(): Promise<UploadCoverImageResponse> {
    this.submitErrorMessage.val.style.visibility = "hidden";
    return this.serviceClient.send(
      newUploadCoverImageRequest(this.file, {
        seasonId: this.seasonId,
      }),
    );
  }

  private postUpload(error?: Error): void {
    if (error) {
      console.error(error);
      this.submitErrorMessage.val.style.visibility = "visible";
      this.submitErrorMessage.val.textContent =
        LOCALIZED_TEXT.updateGenericError;
    } else {
      this.emit("back");
    }
    this.emit("uploaded");
  }

  public remove(): void {
    this.body.remove();
    this.removeAllListeners();
  }
}
