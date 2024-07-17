import EventEmitter = require("events");
import {
  FilledBlockingButton,
  OutlineBlockingButton,
} from "../../../../../common/blocking_button";
import { SCHEME } from "../../../../../common/color_scheme";
import {
  IconButton,
  createBackButton,
} from "../../../../../common/icon_button";
import { ImageCropper } from "../../../../../common/image_cropper/body";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import {
  PAGE_BACKGROUND_STYLE,
  PAGE_MEDIUM_CARD_STYLE,
} from "../../../../../common/page_style";
import { AVATAR_M, AVATAR_S, FONT_M } from "../../../../../common/sizes";
import { USER_SERVICE_CLIENT } from "../../../../../common/web_service_client";
import { uploadAccountAvatar } from "@phading/user_service_interface/self/frontend/client_requests";
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

  public body: HTMLDivElement;
  public backButton = new Ref<IconButton>();
  public chooseFileButton = new Ref<OutlineBlockingButton>();
  private loadErrorText = new Ref<HTMLDivElement>();
  public imageCropper = new Ref<ImageCropper>();
  private previewMediumCanvas = new Ref<HTMLCanvasElement>();
  private previewSmallCanvas = new Ref<HTMLCanvasElement>();
  public uploadButton = new Ref<FilledBlockingButton>();
  private uploadStatusText = new Ref<HTMLDivElement>();

  public constructor(private userServiceClient: WebServiceClient) {
    super();
    this.body = E.div(
      {
        class: "update-avatar",
        style: PAGE_BACKGROUND_STYLE,
      },
      E.div(
        {
          class: "update-avatar-card",
          style: `${PAGE_MEDIUM_CARD_STYLE} display: flex; flex-flow: column nowrap; gap: 1.5rem; align-items: center;`,
        },
        assign(this.backButton, createBackButton().enable()).body,
        assign(
          this.chooseFileButton,
          OutlineBlockingButton.create("")
            .append(E.text(LOCALIZED_TEXT.chooseAvatarLabel))
            .enable(),
        ).body,
        E.divRef(
          this.loadErrorText,
          {
            class: "update-avatar-image-load-error",
            style: `visibility: hidden; font-size: ${FONT_M}rem; color: ${SCHEME.error0};`,
          },
          E.text("1"),
        ),
        E.div(
          {
            class: "update-avatar-canvas-wrapper",
            style: `width: 46rem; height: 46rem;`,
          },
          assign(this.imageCropper, ImageCropper.create()).body,
        ),
        E.div(
          {
            class: "update-avatar-preview-label",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.previewAvatarLabel),
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
              E.canvasRef(this.previewMediumCanvas, {
                class: "update-avatar-preview-medium-canvas",
                style: `position: absolute;`,
              }),
            ),
            E.div(
              {
                class: "update-avatar-preview-medium-label",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(`${AVATAR_M * 10} x ${AVATAR_M * 10}`),
            ),
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
              E.canvasRef(this.previewSmallCanvas, {
                class: "change-vatar-preview-small-canvas",
                style: `position: absolute;`,
              }),
            ),
            E.div(
              {
                class: "update-avatar-preview-small-label",
                style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
              },
              E.text(`${AVATAR_S * 10} x ${AVATAR_S * 10}`),
            ),
          ),
        ),
        assign(
          this.uploadButton,
          FilledBlockingButton.create("")
            .append(E.text(LOCALIZED_TEXT.uploadAvatarLabel))
            .disable(),
        ).body,
        E.divRef(
          this.uploadStatusText,
          {
            class: "update-avatar-upload-status-text",
            style: `visibility: hidden; font-size: ${FONT_M}rem; color: ${SCHEME.error0};`,
          },
          E.text("1"),
        ),
      ),
    );

    this.backButton.val.on("action", () => this.emit("back"));
    this.chooseFileButton.val.on("action", () => this.chooseFile());
    this.imageCropper.val.on("change", () => this.preview());
    this.uploadButton.val.on("action", () => this.uploadAvatar());
    this.uploadButton.val.on("postAction", (error) =>
      this.postUploadAvatar(error),
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
    this.loadErrorText.val.style.visibility = "hidden";
    try {
      await this.imageCropper.val.load(files[0]);
    } catch (e) {
      this.loadErrorText.val.textContent = LOCALIZED_TEXT.loadImageError;
      this.loadErrorText.val.style.visibility = "visible";
      console.error(e);
      this.emit("imageLoaded");
      return;
    }

    this.previewMediumCanvas.val.width = this.imageCropper.val.canvas.val.width;
    this.previewMediumCanvas.val.height =
      this.imageCropper.val.canvas.val.height;
    this.previewMediumCanvas.val
      .getContext("2d")
      .drawImage(this.imageCropper.val.canvas.val, 0, 0);
    this.previewSmallCanvas.val.width = this.imageCropper.val.canvas.val.width;
    this.previewSmallCanvas.val.height =
      this.imageCropper.val.canvas.val.height;
    this.previewSmallCanvas.val
      .getContext("2d")
      .drawImage(this.imageCropper.val.canvas.val, 0, 0);
    this.uploadButton.val.enable();
    this.emit("imageLoaded");
  }

  private preview(): void {
    this.previewMediumCanvas.val.style.width = `${
      (this.imageCropper.val.canvas.val.width / this.imageCropper.val.sWidth) *
      AVATAR_M
    }rem`;
    this.previewMediumCanvas.val.style.height = `${
      (this.imageCropper.val.canvas.val.height /
        this.imageCropper.val.sHeight) *
      AVATAR_M
    }rem`;
    this.previewMediumCanvas.val.style.left = `-${
      (this.imageCropper.val.sx / this.imageCropper.val.sWidth) * AVATAR_M
    }rem`;
    this.previewMediumCanvas.val.style.top = `-${
      (this.imageCropper.val.sy / this.imageCropper.val.sHeight) * AVATAR_M
    }rem`;
    this.previewSmallCanvas.val.style.width = `${
      (this.imageCropper.val.canvas.val.width / this.imageCropper.val.sWidth) *
      AVATAR_S
    }rem`;
    this.previewSmallCanvas.val.style.height = `${
      (this.imageCropper.val.canvas.val.height /
        this.imageCropper.val.sHeight) *
      AVATAR_S
    }rem`;
    this.previewSmallCanvas.val.style.left = `-${
      (this.imageCropper.val.sx / this.imageCropper.val.sWidth) * AVATAR_S
    }rem`;
    this.previewSmallCanvas.val.style.top = `-${
      (this.imageCropper.val.sy / this.imageCropper.val.sHeight) * AVATAR_S
    }rem`;
  }

  private async uploadAvatar(): Promise<void> {
    this.uploadStatusText.val.style.visibility = "hidden";
    let blob = await this.imageCropper.val.export();
    await uploadAccountAvatar(this.userServiceClient, blob);
  }

  private postUploadAvatar(error?: Error): void {
    if (error) {
      console.error(error);
      this.uploadStatusText.val.textContent = LOCALIZED_TEXT.uploadAvatarError;
      this.uploadStatusText.val.style.visibility = "visible";
      this.emit("updateError");
    } else {
      this.emit("updated");
    }
  }

  public remove(): void {
    this.body.remove();
  }
}
