import EventEmitter = require("events");
import {
  BlockingButton,
  FilledButton,
  IconButton,
  createBackButton,
} from "../../../../common/button";
import { SCHEME } from "../../../../common/color_scheme";
import { FileDropZone } from "../../../../common/file_drop_zone";
import { formatBytesShort } from "../../../../common/formatter/quantity";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import {
  eCenteredTitle,
  ePageWithCenterForm,
} from "../../../../common/page_elements";
import {
  AVATAR_M,
  AVATAR_S,
  BORDER_WIDTH_1,
  FONT_M,
  GAP_1X,
  GAP_2X,
  GAP_0_25X,
  GAP_0_5X,
  LINE_HEIGHT_M,
  PAGE_MAX_WIDTH_M,
} from "../../../../common/sizes";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { MAX_AVATAR_SIZE } from "@phading/constants/account";
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
    return new UpdateAvatarPage(SERVICE_CLIENT, MAX_AVATAR_SIZE, account);
  }

  public body: HTMLDivElement;
  private card = new Ref<HTMLFormElement>();
  public backButton = new Ref<IconButton>();
  public fileDropZone = new Ref<FileDropZone>();
  private loadErrorText = new Ref<HTMLDivElement>();
  private previewMediumImage = new Ref<HTMLImageElement>();
  private previewSmallImage = new Ref<HTMLImageElement>();
  public uploadButton = new Ref<BlockingButton>();
  private uploadStatusText = new Ref<HTMLDivElement>();
  private loadIndex = 0;
  private file: File;

  public constructor(
    private serviceClient: WebServiceClient,
    private maxAvatarSize: number,
    account: AccountAndUser,
  ) {
    super();
    this.body = ePageWithCenterForm(
      this.card,
      `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
      `max-width: ${PAGE_MAX_WIDTH_M}rem; display: flex; flex-flow: column nowrap; align-items: center;`,
      assign(this.backButton, createBackButton()).body,
      eCenteredTitle(LOCALIZED_TEXT.updateAvatarTitle),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      assign(this.fileDropZone, new FileDropZone("width: 100%;")).body,
      E.divRef(this.loadErrorText, {
        class: "update-avatar-image-load-error",
        style: `display: none; margin-top: ${GAP_0_25X}rem; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.bad0};`,
      }),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.div(
        {
          class: "update-avatar-preview-label",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.previewAvatarLabel),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_1X}rem;`,
      }),
      E.div(
        {
          class: "update-avatar-preview-line",
          style: `display: flex; flex-flow: row nowrap; width: 100%; justify-content: space-evenly; align-items: flex-end; gap: ${GAP_1X}rem;`,
        },
        E.div(
          {
            class: "update-avatar-preview-medium-container",
            style: `display: flex; flex-flow: column nowrap; align-items: center; gap: ${GAP_1X}rem;`,
          },
          E.div(
            {
              class: "update-avatar-preview-medium-cap",
              style: `position: relative; width: ${AVATAR_M}rem; height: ${AVATAR_M}rem; border-radius: ${AVATAR_M}rem; border: ${BORDER_WIDTH_1}rem solid ${SCHEME.neutral1}; overflow: hidden;`,
            },
            E.imageRef(this.previewMediumImage, {
              class: "update-avatar-preview-medium-image",
              style: `width: 100%; height: 100%;`,
            }),
          ),
          E.div(
            {
              class: "update-avatar-preview-medium-label",
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(`${AVATAR_M * 16} x ${AVATAR_M * 16}`),
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
              style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(`${AVATAR_S * 16} x ${AVATAR_S * 16}`),
          ),
        ),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.divRef(this.uploadStatusText, {
        class: "update-avatar-upload-status-text",
        style: `display: none; margin-bottom: ${GAP_0_5X}rem; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.bad0};`,
      }),
      assign(
        this.uploadButton,
        new BlockingButton(
          new FilledButton("width: 100%;").append(E.text(LOCALIZED_TEXT.uploadAvatarLabel)),
        ).disable(),
      ).body,
    );
    if (account.avatarLargeUrl) {
      this.previewMediumImage.val.src = account.avatarLargeUrl;
      this.previewSmallImage.val.src = account.avatarLargeUrl;
    }
    this.backButton.val.addAction(() => this.emit("back"));
    this.fileDropZone.val.on("select", (file) => this.previewImage(file));
    this.uploadButton.val.addAction(
      () => this.uploadAvatar(),
      (error) => this.postUploadAvatar(error),
    );
  }

  private async previewImage(file: File): Promise<void> {
    this.loadIndex++;
    let loadIndex = this.loadIndex;

    this.loadErrorText.val.style.display = "none";
    this.uploadButton.val.disable();
    if (file.size > this.maxAvatarSize) {
      this.loadErrorText.val.style.display = "block";
      this.loadErrorText.val.textContent = `${LOCALIZED_TEXT.fileSizeTooLarge[0]}${formatBytesShort(this.maxAvatarSize)}${LOCALIZED_TEXT.fileSizeTooLarge[1]}`;
      return;
    }

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
      this.loadErrorText.val.style.display = "block";
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
    this.uploadStatusText.val.style.display = "none";
    await this.serviceClient.send(newUploadAccountAvatarRequest(this.file));
  }

  private postUploadAvatar(error?: Error): void {
    if (error) {
      console.error(error);
      this.uploadStatusText.val.textContent = LOCALIZED_TEXT.uploadAvatarError;
      this.uploadStatusText.val.style.display = "block";
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
