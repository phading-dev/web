import EventEmitter = require("events");
import { FilledBlockingButton } from "../../../../common/blocking_button";
import { SCHEME } from "../../../../common/color_scheme";
import { FileDropZone } from "../../../../common/file_drop_zone";
import {
  SimpleIconButton,
  createBackButton,
} from "../../../../common/icon_button";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import {
  PAGE_CENTER_CARD_BACKGROUND_STYLE,
  PAGE_MEDIUM_CENTER_CARD_STYLE,
} from "../../../../common/page_style";
import { AVATAR_M, AVATAR_S, FONT_L, FONT_M } from "../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { AccountAndUser } from "@phading/user_service_interface/web/self/account";
import { newUploadAccountAvatarRequest } from "@phading/user_service_interface/web/self/client";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdateAvatarPage {
  on(event: "back", listener: () => void): this;
  on(event: "imageLoaded", listener: () => void): this;
  on(event: "uploaded", listener: () => void): this;
}

export class UpdateAvatarPage extends EventEmitter {
  public static create(account: AccountAndUser): UpdateAvatarPage {
    return new UpdateAvatarPage(SERVICE_CLIENT, account);
  }

  public body: HTMLDivElement;
  public backButton = new Ref<SimpleIconButton>();
  public fileDropZone = new Ref<FileDropZone>();
  private loadErrorText = new Ref<HTMLDivElement>();
  private previewMediumImage = new Ref<HTMLImageElement>();
  private previewSmallImage = new Ref<HTMLImageElement>();
  public uploadButton = new Ref<FilledBlockingButton>();
  private uploadStatusText = new Ref<HTMLDivElement>();
  private loadIndex = 0;
  private file: File;

  public constructor(
    private serviceClient: WebServiceClient,
    account: AccountAndUser,
  ) {
    super();
    this.body = E.div(
      {
        class: "update-avatar",
        style: PAGE_CENTER_CARD_BACKGROUND_STYLE,
      },
      E.div(
        {
          class: "update-avatar-card",
          style: `${PAGE_MEDIUM_CENTER_CARD_STYLE} display: flex; flex-flow: column nowrap; align-items: center;`,
        },
        assign(this.backButton, createBackButton()).body,
        E.div(
          {
            class: "update-avatar-title",
            style: `font-size: ${FONT_L}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.updateAvatarTitle),
        ),
        E.div({
          style: `flex: 0 0 auto; height: 2rem;`,
        }),
        assign(this.fileDropZone, new FileDropZone("width: 100%;")).body,
        E.div({
          style: `flex: 0 0 auto; height: 1rem;`,
        }),
        E.divRef(
          this.loadErrorText,
          {
            class: "update-avatar-image-load-error",
            style: `visibility: hidden; font-size: ${FONT_M}rem; color: ${SCHEME.error0};`,
          },
          E.text("1"),
        ),
        E.div({
          style: `flex: 0 0 auto; height: 2rem;`,
        }),
        E.div(
          {
            class: "update-avatar-preview-label",
            style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
          },
          E.text(LOCALIZED_TEXT.previewAvatarLabel),
        ),
        E.div({
          style: `flex: 0 0 auto; height: 2rem;`,
        }),
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
              E.imageRef(this.previewMediumImage, {
                class: "update-avatar-preview-medium-image",
                style: `width: 100%; height: 100%;`,
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
              E.imageRef(this.previewSmallImage, {
                class: "change-avatar-preview-small-image",
                style: `width: 100%; height: 100%;`,
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
        E.div({
          style: `flex: 0 0 auto; height: 2rem;`,
        }),
        assign(
          this.uploadButton,
          new FilledBlockingButton("")
            .append(E.text(LOCALIZED_TEXT.uploadAvatarLabel))
            .disable(),
        ).body,
        E.div({
          style: `flex: 0 0 auto; height: 1rem;`,
        }),
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
    if (account.avatarLargeUrl) {
      this.previewMediumImage.val.src = account.avatarLargeUrl;
      this.previewSmallImage.val.src = account.avatarLargeUrl;
    }
    this.backButton.val.on("action", () => this.emit("back"));
    this.fileDropZone.val.on("select", (file) => this.previewImage(file));
    this.uploadButton.val.addAction(
      () => this.uploadAvatar(),
      (response, error) => this.postUploadAvatar(error),
    );
  }

  private async previewImage(file: File): Promise<void> {
    this.loadIndex++;
    let loadIndex = this.loadIndex;

    this.loadErrorText.val.style.visibility = "hidden";
    this.uploadButton.val.disable();
    let dataUrl: string;
    try {
      dataUrl = await new Promise<string>((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => {
          let imageEle = E.image({
            src: reader.result as string,
          });
          imageEle.onload = () => {
            resolve(reader.result as string);
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
      this.loadErrorText.val.style.visibility = "visible";
      this.loadErrorText.val.textContent = LOCALIZED_TEXT.loadImageError;
      this.emit("imageLoaded");
      return;
    }
    if (loadIndex !== this.loadIndex) {
      // If the load index has changed, ignore this preview
      return;
    }
    this.file = file;
    this.previewMediumImage.val.src = dataUrl;
    this.previewSmallImage.val.src = dataUrl;
    this.uploadButton.val.enable();
    this.emit("imageLoaded");
  }

  private async uploadAvatar(): Promise<void> {
    this.uploadStatusText.val.style.visibility = "hidden";
    await this.serviceClient.send(newUploadAccountAvatarRequest(this.file));
  }

  private postUploadAvatar(error?: Error): void {
    if (error) {
      console.error(error);
      this.uploadStatusText.val.textContent = LOCALIZED_TEXT.uploadAvatarError;
      this.uploadStatusText.val.style.visibility = "visible";
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
