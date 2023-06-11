import EventEmitter = require("events");
import {
  FilledBlockingButton,
  OutlineBlockingButton,
} from "../../common/blocking_button";
import { SCHEME } from "../../common/color_scheme";
import { ImageCropper } from "../../common/image_cropper/container";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { WEB_SERVICE_CLIENT } from "../../common/web_service_client";
import { MenuItem } from "../menu_item/container";
import { createBackMenuItem } from "../menu_item/factory";
import { CARD_STYLE, PAGE_STYLE } from "./styles";
import { uploadAvatar } from "@phading/user_service_interface/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdateAvatarPage {
  on(event: "back", listener: () => void): this;
  on(event: "imageLoaded", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
}

export class UpdateAvatarPage extends EventEmitter {
  private static LARGE_IMAGE_LENGTH = 160;
  private static SMALL_IMAGE_LENGTH = 50;

  public body: HTMLDivElement;
  public backMenuBody: HTMLDivElement;
  // Visible for testing
  public backMenuItem: MenuItem;
  public chooseFileButton: OutlineBlockingButton;
  public uploadButton: FilledBlockingButton;
  public imageCropper: ImageCropper;
  private loadErrorText: HTMLDivElement;
  private previewLargeCanvas: HTMLCanvasElement;
  private previewSmallCanvas: HTMLCanvasElement;
  private uploadStatusText: HTMLDivElement;

  public constructor(private serviceClient: WebServiceClient) {
    super();
    let chooseFileButtonRef = new Ref<OutlineBlockingButton>();
    let loadErrorTextRef = new Ref<HTMLDivElement>();
    let imageCropperRef = new Ref<ImageCropper>();
    let previewLargeCanvasRef = new Ref<HTMLCanvasElement>();
    let previewSmallCanvasRef = new Ref<HTMLCanvasElement>();
    let uploadButtonRef = new Ref<FilledBlockingButton>();
    let uploadStatusTextRef = new Ref<HTMLDivElement>();
    this.body = E.div(
      {
        class: "update-avatar",
        style: PAGE_STYLE,
      },
      E.div(
        {
          class: "update-avatar-card",
          style: `${CARD_STYLE} align-items: center;`,
        },
        assign(
          chooseFileButtonRef,
          OutlineBlockingButton.create(
            "",
            E.text(LOCALIZED_TEXT.chooseAvatarLabel)
          ).enable()
        ).body,
        E.divRef(
          loadErrorTextRef,
          {
            class: "update-avatar-image-load-error",
            style: `visibility: hidden; font-size: 1.4rem; color: ${SCHEME.error0};`,
          },
          E.text("1")
        ),
        E.div(
          {
            class: "update-avatar-canvas-wrapper",
            style: `width: 46rem; height: 46rem;`,
          },
          assign(imageCropperRef, ImageCropper.create()).body
        ),
        E.div(
          {
            class: "update-avatar-preview-label",
            style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.previewAvatarLabel)
        ),
        E.div(
          {
            class: "update-avatar-preview-line",
            style: `display: flex; flex-flow: row nowrap; width: 100%; justify-content: center; align-items: flex-end; gap: 5rem;`,
          },
          E.div(
            {
              class: "update-avatar-preview-large-container",
              style: `display: flex; flex-flow: column nowrap; align-items: center; gap: 2rem;`,
            },
            E.div(
              {
                class: "update-avatar-preview-large-cap",
                style: `position: relative; width: ${UpdateAvatarPage.LARGE_IMAGE_LENGTH}px; height: ${UpdateAvatarPage.LARGE_IMAGE_LENGTH}px; border-radius: ${UpdateAvatarPage.LARGE_IMAGE_LENGTH}px; border: .1rem solid ${SCHEME.neutral1}; overflow: hidden;`,
              },
              E.canvasRef(previewLargeCanvasRef, {
                class: "update-avatar-preview-large-canvas",
                style: `position: absolute;`,
              })
            ),
            E.div(
              {
                class: "update-avatar-preview-large-label",
                style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
              },
              E.text("160 x 160")
            )
          ),
          E.div(
            {
              class: "update-avatar-preview-large-container",
              style: `display: flex; flex-flow: column nowrap; align-items: center; gap: 2rem;`,
            },
            E.div(
              {
                class: "update-avatar-preview-small-cap",
                style: `position: relative; width: ${UpdateAvatarPage.SMALL_IMAGE_LENGTH}px; height: ${UpdateAvatarPage.SMALL_IMAGE_LENGTH}px; border-radius: ${UpdateAvatarPage.SMALL_IMAGE_LENGTH}px; border: .1rem solid ${SCHEME.neutral1}; overflow: hidden;`,
              },
              E.canvasRef(previewSmallCanvasRef, {
                class: "change-vatar-preview-small-canvas",
                style: `position: absolute;`,
              })
            ),
            E.div(
              {
                class: "update-avatar-preview-small-label",
                style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
              },
              E.text("50 x 50")
            )
          )
        ),
        assign(
          uploadButtonRef,
          FilledBlockingButton.create(
            "",
            E.text(LOCALIZED_TEXT.uploadAvatarLabel)
          ).disable()
        ).body,
        E.divRef(
          uploadStatusTextRef,
          {
            class: "update-avatar-upload-status-text",
            style: `visibility: hidden; font-size: 1.4rem; color: ${SCHEME.error0};`,
          },
          E.text("1")
        )
      )
    );
    this.chooseFileButton = chooseFileButtonRef.val;
    this.loadErrorText = loadErrorTextRef.val;
    this.imageCropper = imageCropperRef.val;
    this.previewLargeCanvas = previewLargeCanvasRef.val;
    this.previewSmallCanvas = previewSmallCanvasRef.val;
    this.uploadButton = uploadButtonRef.val;
    this.uploadStatusText = uploadStatusTextRef.val;

    this.backMenuItem = createBackMenuItem();
    this.backMenuBody = this.backMenuItem.body;

    this.backMenuItem.on("action", () => this.emit("back"));
    this.chooseFileButton.on("action", () => this.chooseFile());
    this.imageCropper.on("change", () => this.preview());
    this.uploadButton.on("action", () => this.uploadAvatar());
    this.uploadButton.on("postAction", (error) => this.postUploadAvatar(error));
  }

  public static create(): UpdateAvatarPage {
    return new UpdateAvatarPage(WEB_SERVICE_CLIENT);
  }

  private async chooseFile(): Promise<void> {
    await new Promise<void>((resolve) => {
      let fileInput = E.input({ type: "file" });
      fileInput.addEventListener("input", async () => {
        await this.load(fileInput.files);
        resolve();
      });
      fileInput.click();
    });
  }

  private async load(files: FileList): Promise<void> {
    this.loadErrorText.style.visibility = "hidden";
    try {
      await this.imageCropper.load(files[0]);
    } catch (e) {
      this.loadErrorText.textContent = LOCALIZED_TEXT.loadImageError;
      this.loadErrorText.style.visibility = "visible";
      console.error(e);
      this.emit("imageLoaded");
      return;
    }

    this.previewLargeCanvas.width = this.imageCropper.canvas.width;
    this.previewLargeCanvas.height = this.imageCropper.canvas.height;
    this.previewLargeCanvas
      .getContext("2d")
      .drawImage(this.imageCropper.canvas, 0, 0);
    this.previewSmallCanvas.width = this.imageCropper.canvas.width;
    this.previewSmallCanvas.height = this.imageCropper.canvas.height;
    this.previewSmallCanvas
      .getContext("2d")
      .drawImage(this.imageCropper.canvas, 0, 0);
    this.uploadButton.enable();
    this.emit("imageLoaded");
  }

  private preview(): void {
    this.previewLargeCanvas.style.width = `${
      (this.imageCropper.canvas.width / this.imageCropper.sWidth) *
      UpdateAvatarPage.LARGE_IMAGE_LENGTH
    }px`;
    this.previewLargeCanvas.style.height = `${
      (this.imageCropper.canvas.height / this.imageCropper.sHeight) *
      UpdateAvatarPage.LARGE_IMAGE_LENGTH
    }px`;
    this.previewLargeCanvas.style.left = `-${
      (this.imageCropper.sx / this.imageCropper.sWidth) *
      UpdateAvatarPage.LARGE_IMAGE_LENGTH
    }px`;
    this.previewLargeCanvas.style.top = `-${
      (this.imageCropper.sy / this.imageCropper.sHeight) *
      UpdateAvatarPage.LARGE_IMAGE_LENGTH
    }px`;
    this.previewSmallCanvas.style.width = `${
      (this.imageCropper.canvas.width / this.imageCropper.sWidth) *
      UpdateAvatarPage.SMALL_IMAGE_LENGTH
    }px`;
    this.previewSmallCanvas.style.height = `${
      (this.imageCropper.canvas.height / this.imageCropper.sHeight) *
      UpdateAvatarPage.SMALL_IMAGE_LENGTH
    }px`;
    this.previewSmallCanvas.style.left = `-${
      (this.imageCropper.sx / this.imageCropper.sWidth) *
      UpdateAvatarPage.SMALL_IMAGE_LENGTH
    }px`;
    this.previewSmallCanvas.style.top = `-${
      (this.imageCropper.sy / this.imageCropper.sHeight) *
      UpdateAvatarPage.SMALL_IMAGE_LENGTH
    }px`;
  }

  private async uploadAvatar(): Promise<void> {
    this.uploadStatusText.style.visibility = "hidden";
    let blob = await this.imageCropper.export();
    await uploadAvatar(this.serviceClient, blob);
  }

  private postUploadAvatar(error?: Error): void {
    if (error) {
      console.error(error);
      this.uploadStatusText.textContent = LOCALIZED_TEXT.uploadAvatarError;
      this.uploadStatusText.style.visibility = "visible";
    } else {
      this.emit("updated");
    }
  }

  public remove(): void {
    this.backMenuItem.remove();
    this.body.remove();
  }
}
