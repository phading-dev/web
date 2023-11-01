import EventEmitter = require("events");
import {
  FilledBlockingButton,
  OutlineBlockingButton,
} from "../../../../../common/blocking_button";
import { SCHEME } from "../../../../../common/color_scheme";
import { ImageCropper } from "../../../../../common/image_cropper/body";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import { MenuItem } from "../../../../../common/menu_item/body";
import { createBackMenuItem } from "../../../../../common/menu_item/factory";
import {
  MEDIUM_CARD_STYLE,
  PAGE_STYLE,
} from "../../../../../common/page_style";
import { USER_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { uploadAvatar } from "@phading/user_service_interface/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdateAvatarPage {
  on(event: "back", listener: () => void): this;
  on(event: "imageLoaded", listener: () => void): this;
  on(event: "updateError", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
}

export class UpdateAvatarPage extends EventEmitter {
  public static create(): UpdateAvatarPage {
    return new UpdateAvatarPage(USER_SERVICE_CLIENT);
  }

  private static LARGE_IMAGE_LENGTH = 160;
  private static SMALL_IMAGE_LENGTH = 50;

  private body_: HTMLDivElement;
  private backMenuItem_: MenuItem;
  private chooseFileButton_: OutlineBlockingButton;
  private uploadButton_: FilledBlockingButton;
  private imageCropper_: ImageCropper;
  private loadErrorText: HTMLDivElement;
  private previewLargeCanvas: HTMLCanvasElement;
  private previewSmallCanvas: HTMLCanvasElement;
  private uploadStatusText: HTMLDivElement;

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    let chooseFileButtonRef = new Ref<OutlineBlockingButton>();
    let loadErrorTextRef = new Ref<HTMLDivElement>();
    let imageCropperRef = new Ref<ImageCropper>();
    let previewLargeCanvasRef = new Ref<HTMLCanvasElement>();
    let previewSmallCanvasRef = new Ref<HTMLCanvasElement>();
    let uploadButtonRef = new Ref<FilledBlockingButton>();
    let uploadStatusTextRef = new Ref<HTMLDivElement>();
    this.body_ = E.div(
      {
        class: "update-avatar",
        style: PAGE_STYLE,
      },
      E.div(
        {
          class: "update-avatar-card",
          style: `${MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap; gap: 1.5rem; align-items: center;`,
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
    this.chooseFileButton_ = chooseFileButtonRef.val;
    this.loadErrorText = loadErrorTextRef.val;
    this.imageCropper_ = imageCropperRef.val;
    this.previewLargeCanvas = previewLargeCanvasRef.val;
    this.previewSmallCanvas = previewSmallCanvasRef.val;
    this.uploadButton_ = uploadButtonRef.val;
    this.uploadStatusText = uploadStatusTextRef.val;

    this.backMenuItem_ = createBackMenuItem();

    this.backMenuItem_.on("action", () => this.emit("back"));
    this.chooseFileButton_.on("action", () => this.chooseFile());
    this.imageCropper_.on("change", () => this.preview());
    this.uploadButton_.on("action", () => this.uploadAvatar());
    this.uploadButton_.on("postAction", (error) =>
      this.postUploadAvatar(error)
    );
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
      await this.imageCropper_.load(files[0]);
    } catch (e) {
      this.loadErrorText.textContent = LOCALIZED_TEXT.loadImageError;
      this.loadErrorText.style.visibility = "visible";
      console.error(e);
      this.emit("imageLoaded");
      return;
    }

    this.previewLargeCanvas.width = this.imageCropper_.canvas.width;
    this.previewLargeCanvas.height = this.imageCropper_.canvas.height;
    this.previewLargeCanvas
      .getContext("2d")
      .drawImage(this.imageCropper_.canvas, 0, 0);
    this.previewSmallCanvas.width = this.imageCropper_.canvas.width;
    this.previewSmallCanvas.height = this.imageCropper_.canvas.height;
    this.previewSmallCanvas
      .getContext("2d")
      .drawImage(this.imageCropper_.canvas, 0, 0);
    this.uploadButton_.enable();
    this.emit("imageLoaded");
  }

  private preview(): void {
    this.previewLargeCanvas.style.width = `${
      (this.imageCropper_.canvas.width / this.imageCropper_.sWidth) *
      UpdateAvatarPage.LARGE_IMAGE_LENGTH
    }px`;
    this.previewLargeCanvas.style.height = `${
      (this.imageCropper_.canvas.height / this.imageCropper_.sHeight) *
      UpdateAvatarPage.LARGE_IMAGE_LENGTH
    }px`;
    this.previewLargeCanvas.style.left = `-${
      (this.imageCropper_.sx / this.imageCropper_.sWidth) *
      UpdateAvatarPage.LARGE_IMAGE_LENGTH
    }px`;
    this.previewLargeCanvas.style.top = `-${
      (this.imageCropper_.sy / this.imageCropper_.sHeight) *
      UpdateAvatarPage.LARGE_IMAGE_LENGTH
    }px`;
    this.previewSmallCanvas.style.width = `${
      (this.imageCropper_.canvas.width / this.imageCropper_.sWidth) *
      UpdateAvatarPage.SMALL_IMAGE_LENGTH
    }px`;
    this.previewSmallCanvas.style.height = `${
      (this.imageCropper_.canvas.height / this.imageCropper_.sHeight) *
      UpdateAvatarPage.SMALL_IMAGE_LENGTH
    }px`;
    this.previewSmallCanvas.style.left = `-${
      (this.imageCropper_.sx / this.imageCropper_.sWidth) *
      UpdateAvatarPage.SMALL_IMAGE_LENGTH
    }px`;
    this.previewSmallCanvas.style.top = `-${
      (this.imageCropper_.sy / this.imageCropper_.sHeight) *
      UpdateAvatarPage.SMALL_IMAGE_LENGTH
    }px`;
  }

  private async uploadAvatar(): Promise<void> {
    this.uploadStatusText.style.visibility = "hidden";
    let blob = await this.imageCropper_.export();
    await uploadAvatar(this.userServiceClient, blob);
  }

  private postUploadAvatar(error?: Error): void {
    if (error) {
      console.error(error);
      this.uploadStatusText.textContent = LOCALIZED_TEXT.uploadAvatarError;
      this.uploadStatusText.style.visibility = "visible";
      this.emit("updateError");
    } else {
      this.emit("updated");
    }
  }

  public get body() {
    return this.body_;
  }
  public get backMenuBody() {
    return this.backMenuItem_.body;
  }

  public remove(): void {
    this.backMenuItem_.remove();
    this.body_.remove();
  }

  // Visible for testing
  public get backMenuItem() {
    return this.backMenuItem_;
  }
  public get chooseFileButton() {
    return this.chooseFileButton_;
  }
  public get uploadButton() {
    return this.uploadButton_;
  }
  public get imageCropper() {
    return this.imageCropper_;
  }
}
