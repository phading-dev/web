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
import { AVATAR_M, AVATAR_S, FONT_M } from "../../../../../common/sizes";
import { USER_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { uploadAccountAvatar } from "@phading/user_service_interface/self/web/client_requests";
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

  private body_: HTMLDivElement;
  private backMenuItem_: MenuItem;
  private chooseFileButton_: OutlineBlockingButton;
  private uploadButton_: FilledBlockingButton;
  private imageCropper_: ImageCropper;
  private loadErrorText: HTMLDivElement;
  private previewMediumCanvas: HTMLCanvasElement;
  private previewSmallCanvas: HTMLCanvasElement;
  private uploadStatusText: HTMLDivElement;

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    let chooseFileButtonRef = new Ref<OutlineBlockingButton>();
    let loadErrorTextRef = new Ref<HTMLDivElement>();
    let imageCropperRef = new Ref<ImageCropper>();
    let previewMediumCanvasRef = new Ref<HTMLCanvasElement>();
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
          OutlineBlockingButton.create("")
            .append(E.text(LOCALIZED_TEXT.chooseAvatarLabel))
            .enable()
        ).body,
        E.divRef(
          loadErrorTextRef,
          {
            class: "update-avatar-image-load-error",
            style: `visibility: hidden; font-size: ${FONT_M}rem; color: ${SCHEME.error0};`,
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
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
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
              class: "update-avatar-preview-medium-container",
              style: `display: flex; flex-flow: column nowrap; align-items: center; gap: 2rem;`,
            },
            E.div(
              {
                class: "update-avatar-preview-medium-cap",
                style: `position: relative; width: ${AVATAR_M}rem; height: ${AVATAR_M}rem; border-radius: ${AVATAR_M}rem; border: .1rem solid ${SCHEME.neutral1}; overflow: hidden;`,
              },
              E.canvasRef(previewMediumCanvasRef, {
                class: "update-avatar-preview-medium-canvas",
                style: `position: absolute;`,
              })
            ),
            E.div(
              {
                class: "update-avatar-preview-medium-label",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(`${AVATAR_M * 10} x ${AVATAR_M * 10}`)
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
                style: `position: relative; width: ${AVATAR_S}rem; height: ${AVATAR_S}rem; border-radius: ${AVATAR_S}rem; border: .1rem solid ${SCHEME.neutral1}; overflow: hidden;`,
              },
              E.canvasRef(previewSmallCanvasRef, {
                class: "change-vatar-preview-small-canvas",
                style: `position: absolute;`,
              })
            ),
            E.div(
              {
                class: "update-avatar-preview-small-label",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(`${AVATAR_S * 10} x ${AVATAR_S * 10}`)
            )
          )
        ),
        assign(
          uploadButtonRef,
          FilledBlockingButton.create("")
            .append(E.text(LOCALIZED_TEXT.uploadAvatarLabel))
            .disable()
        ).body,
        E.divRef(
          uploadStatusTextRef,
          {
            class: "update-avatar-upload-status-text",
            style: `visibility: hidden; font-size: ${FONT_M}rem; color: ${SCHEME.error0};`,
          },
          E.text("1")
        )
      )
    );
    this.chooseFileButton_ = chooseFileButtonRef.val;
    this.loadErrorText = loadErrorTextRef.val;
    this.imageCropper_ = imageCropperRef.val;
    this.previewMediumCanvas = previewMediumCanvasRef.val;
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

    this.previewMediumCanvas.width = this.imageCropper_.canvas.width;
    this.previewMediumCanvas.height = this.imageCropper_.canvas.height;
    this.previewMediumCanvas
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
    this.previewMediumCanvas.style.width = `${
      (this.imageCropper_.canvas.width / this.imageCropper_.sWidth) * AVATAR_M
    }rem`;
    this.previewMediumCanvas.style.height = `${
      (this.imageCropper_.canvas.height / this.imageCropper_.sHeight) * AVATAR_M
    }rem`;
    this.previewMediumCanvas.style.left = `-${
      (this.imageCropper_.sx / this.imageCropper_.sWidth) * AVATAR_M
    }rem`;
    this.previewMediumCanvas.style.top = `-${
      (this.imageCropper_.sy / this.imageCropper_.sHeight) * AVATAR_M
    }rem`;
    this.previewSmallCanvas.style.width = `${
      (this.imageCropper_.canvas.width / this.imageCropper_.sWidth) * AVATAR_S
    }rem`;
    this.previewSmallCanvas.style.height = `${
      (this.imageCropper_.canvas.height / this.imageCropper_.sHeight) * AVATAR_S
    }rem`;
    this.previewSmallCanvas.style.left = `-${
      (this.imageCropper_.sx / this.imageCropper_.sWidth) * AVATAR_S
    }rem`;
    this.previewSmallCanvas.style.top = `-${
      (this.imageCropper_.sy / this.imageCropper_.sHeight) * AVATAR_S
    }rem`;
  }

  private async uploadAvatar(): Promise<void> {
    this.uploadStatusText.style.visibility = "hidden";
    let blob = await this.imageCropper_.export();
    await uploadAccountAvatar(this.userServiceClient, blob);
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
