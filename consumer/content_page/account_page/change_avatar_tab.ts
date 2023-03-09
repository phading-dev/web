import EventEmitter = require("events");
import { FilledBlockingButton } from "../../common/blocking_button";
import { OUTLINE_BUTTON_STYLE } from "../../common/button_styles";
import { SCHEME } from "../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { WEB_SERVICE_CLIENT } from "../../common/web_service_client";
import { MenuItem } from "../menu_item/container";
import { createBackMenuItem } from "../menu_item/factory";
import { AvatarCanvas } from "./avatar_canvas";
import { uploadAvatar } from "@phading/user_service_interface/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface ChangeAvatarTab {
  on(event: "back", listener: () => void): this;
  on(event: "imageLoaded", listener: () => void): this;
}

export class ChangeAvatarTab extends EventEmitter {
  private static LARGE_IMAGE_LENGTH = 160;
  private static SMALL_IMAGE_LENGTH = 50;

  public body: HTMLDivElement;
  public prependMenuBody: HTMLDivElement;
  // Visible for testing
  public backMenuItem: MenuItem;
  public chooseFileButton: HTMLDivElement;
  public uploadButton: FilledBlockingButton;

  private loadErrorText: HTMLDivElement;
  private previewLargeCanvas: HTMLCanvasElement;
  private previewSmallCanvas: HTMLCanvasElement;
  private uploadStatusText: HTMLDivElement;

  public constructor(
    private avatarCanvas: AvatarCanvas,
    protected serviceClient: WebServiceClient
  ) {
    super();
    let chooseFileButtonRef = new Ref<HTMLDivElement>();
    let loadErrorTextRef = new Ref<HTMLDivElement>();
    let previewLargeCanvasRef = new Ref<HTMLCanvasElement>();
    let previewSmallCanvasRef = new Ref<HTMLCanvasElement>();
    let uploadButtonRef = new Ref<FilledBlockingButton>();
    let uploadStatusTextRef = new Ref<HTMLDivElement>();
    this.body = E.div(
      {
        class: "change-avatar",
        style: `flex-flow: column nowrap; align-items: center; width: 100%; padding: 3rem 0 5rem;`,
      },
      E.divRef(
        chooseFileButtonRef,
        {
          class: "change-avatar-choose-file-button",
          style: `${OUTLINE_BUTTON_STYLE} color: ${SCHEME.neutral0}; border-color: ${SCHEME.neutral1}; cursor: pointer;`,
        },
        E.text(LOCALIZED_TEXT.chooseAvatarLabel)
      ),
      E.divRef(loadErrorTextRef, {
        class: "change-avatar-image-load-error",
        style: `display: none; margin-top: 1rem; font-size: 1.4rem; color: ${SCHEME.error0};`,
      }),
      E.div(
        {
          class: "change-avatar-canvas-wrapper",
          style: `margin: 3rem 0; width: 46rem; height: 46rem;`,
        },
        avatarCanvas.body
      ),
      E.div(
        {
          class: "change-avatar-preview-label",
          style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.previewAvatarLabel)
      ),
      E.div(
        {
          class: "change-avatar-preview-line",
          style: `display: flex; flex-flow: row nowrap; width: 100%; margin: 2rem 0 3rem; justify-content: center; align-items: flex-end;`,
        },
        E.div(
          {
            class: "change-avatar-preview-large-container",
            style: `display: flex; flex-flow: column nowrap; align-items: center; margin-right: 5rem;`,
          },
          E.div(
            {
              class: "change-avatar-preview-large-cap",
              style: `position: relative; width: ${ChangeAvatarTab.LARGE_IMAGE_LENGTH}px; height: ${ChangeAvatarTab.LARGE_IMAGE_LENGTH}px; border-radius: ${ChangeAvatarTab.LARGE_IMAGE_LENGTH}px; border: .1rem solid ${SCHEME.neutral1}; overflow: hidden;`,
            },
            E.canvasRef(previewLargeCanvasRef, {
              class: "change-avatar-preview-large-canvas",
              style: `position: absolute;`,
            })
          ),
          E.div(
            {
              class: "change-avatar-preview-large-label",
              style: `font-size: 1.4rem; color: ${SCHEME.neutral0}; margin-top: 2rem;`,
            },
            E.text("160 x 160")
          )
        ),
        E.div(
          {
            class: "change-avatar-preview-large-container",
            style: `display: flex; flex-flow: column nowrap; align-items: center;`,
          },
          E.div(
            {
              class: "change-avatar-preview-small-cap",
              style: `position: relative; width: ${ChangeAvatarTab.SMALL_IMAGE_LENGTH}px; height: ${ChangeAvatarTab.SMALL_IMAGE_LENGTH}px; border-radius: ${ChangeAvatarTab.SMALL_IMAGE_LENGTH}px; border: .1rem solid ${SCHEME.neutral1}; overflow: hidden;`,
            },
            E.canvasRef(previewSmallCanvasRef, {
              class: "change-vatar-preview-small-canvas",
              style: `position: absolute;`,
            })
          ),
          E.div(
            {
              class: "change-avatar-preview-small-label",
              style: `font-size: 1.4rem; color: ${SCHEME.neutral0}; margin-top: 2rem;`,
            },
            E.text("50 x 50")
          )
        )
      ),
      assign(
        uploadButtonRef,
        FilledBlockingButton.create(
          false,
          E.text(LOCALIZED_TEXT.uploadAvatarLabel)
        )
      ).body,
      E.divRef(uploadStatusTextRef, {
        class: "change-avatar-upload-status-text",
        style: `display: none; font-size: 1.4rem; margin-top: 1rem;`,
      })
    );
    this.chooseFileButton = chooseFileButtonRef.val;
    this.loadErrorText = loadErrorTextRef.val;
    this.previewLargeCanvas = previewLargeCanvasRef.val;
    this.previewSmallCanvas = previewSmallCanvasRef.val;
    this.uploadButton = uploadButtonRef.val;
    this.uploadStatusText = uploadStatusTextRef.val;

    this.backMenuItem = createBackMenuItem();
    this.prependMenuBody = this.backMenuItem.body;

    this.backMenuItem.on("action", () => this.emit("back"));
    this.chooseFileButton.addEventListener("click", () => this.chooseFile());
    this.avatarCanvas.on("change", () => this.preview());
    this.uploadButton.on("action", () => this.uploadAvatar());
  }

  public static create(): ChangeAvatarTab {
    return new ChangeAvatarTab(AvatarCanvas.create(), WEB_SERVICE_CLIENT);
  }

  private chooseFile(): void {
    let fileInput = E.input({ type: "file" });
    fileInput.addEventListener("input", () => this.load(fileInput.files));
    fileInput.click();
  }

  private async load(files: FileList): Promise<void> {
    this.loadErrorText.style.display = "none";
    try {
      await this.avatarCanvas.load(files[0]);
    } catch (e) {
      this.loadErrorText.textContent = LOCALIZED_TEXT.loadImageError;
      this.loadErrorText.style.display = "block";
      console.error(e);
      this.emit("imageLoaded");
      return;
    }

    this.previewLargeCanvas.width = this.avatarCanvas.canvas.width;
    this.previewLargeCanvas.height = this.avatarCanvas.canvas.height;
    this.previewLargeCanvas
      .getContext("2d")
      .drawImage(this.avatarCanvas.canvas, 0, 0);
    this.previewSmallCanvas.width = this.avatarCanvas.canvas.width;
    this.previewSmallCanvas.height = this.avatarCanvas.canvas.height;
    this.previewSmallCanvas
      .getContext("2d")
      .drawImage(this.avatarCanvas.canvas, 0, 0);
    this.uploadButton.enable();
    this.emit("imageLoaded");
  }

  private preview(): void {
    this.previewLargeCanvas.style.width = `${
      (this.avatarCanvas.canvas.width / this.avatarCanvas.sWidth) *
      ChangeAvatarTab.LARGE_IMAGE_LENGTH
    }px`;
    this.previewLargeCanvas.style.height = `${
      (this.avatarCanvas.canvas.height / this.avatarCanvas.sHeight) *
      ChangeAvatarTab.LARGE_IMAGE_LENGTH
    }px`;
    this.previewLargeCanvas.style.left = `-${
      (this.avatarCanvas.sx / this.avatarCanvas.sWidth) *
      ChangeAvatarTab.LARGE_IMAGE_LENGTH
    }px`;
    this.previewLargeCanvas.style.top = `-${
      (this.avatarCanvas.sy / this.avatarCanvas.sHeight) *
      ChangeAvatarTab.LARGE_IMAGE_LENGTH
    }px`;
    this.previewSmallCanvas.style.width = `${
      (this.avatarCanvas.canvas.width / this.avatarCanvas.sWidth) *
      ChangeAvatarTab.SMALL_IMAGE_LENGTH
    }px`;
    this.previewSmallCanvas.style.height = `${
      (this.avatarCanvas.canvas.height / this.avatarCanvas.sHeight) *
      ChangeAvatarTab.SMALL_IMAGE_LENGTH
    }px`;
    this.previewSmallCanvas.style.left = `-${
      (this.avatarCanvas.sx / this.avatarCanvas.sWidth) *
      ChangeAvatarTab.SMALL_IMAGE_LENGTH
    }px`;
    this.previewSmallCanvas.style.top = `-${
      (this.avatarCanvas.sy / this.avatarCanvas.sHeight) *
      ChangeAvatarTab.SMALL_IMAGE_LENGTH
    }px`;
  }

  private async uploadAvatar(): Promise<void> {
    this.uploadStatusText.style.display = "none";
    try {
      let blob = await this.avatarCanvas.export();
      await uploadAvatar(this.serviceClient, blob);
    } catch (e) {
      this.uploadStatusText.style.color = SCHEME.error0;
      this.uploadStatusText.textContent = LOCALIZED_TEXT.uploadAvatarError;
      this.uploadStatusText.style.display = "block";
      console.error(e);
      return;
    }
    this.uploadStatusText.style.color = SCHEME.neutral0;
    this.uploadStatusText.textContent = LOCALIZED_TEXT.uploadAvatarSuccess;
    this.uploadStatusText.style.display = "block";
  }

  public show(): this {
    this.backMenuItem.show();
    this.body.style.display = "flex";
    return this;
  }

  public hide(): this {
    this.backMenuItem.hide();
    this.body.style.display = "none";
    return this;
  }
}
