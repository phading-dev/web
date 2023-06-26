import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import { createPlusIcon } from "../../../../common/icons";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { WEB_SERVICE_CLIENT } from "../../../../common/web_service_client";
import { GAP } from "../common/styles";
import { ImagePreviewer } from "./image_previewer";
import { uploadImageForTale } from "@phading/tale_service_interface/client_requests";
import { UploadImageForTaleResponse } from "@phading/tale_service_interface/interface";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface QuickLayoutEditor {
  on(event: "imagesLoaded", listener: () => void): this;
  on(event: "valid", listener: () => void): this;
  on(event: "invalid", listener: () => void): this;
}

enum InputField {
  TEXT,
  IMAGES,
}

export class QuickLayoutEditor extends EventEmitter {
  private static CHARACTER_LIMIT = 700;
  private static IMAGE_NUMBER_LIMIT = 9;

  public bodies: Array<HTMLDivElement>;
  public textInput: HTMLTextAreaElement;
  public imagePreviewers = new Array<ImagePreviewer>();
  // Visible for testing
  public uploadImageButton: HTMLDivElement;
  private characterCountContainer: HTMLDivElement;
  private characterCount: HTMLDivElement;
  private uploadImagesContainer: HTMLDivElement;
  private uploadImageError: HTMLDivElement;
  private validInputs = new Set<InputField>();

  public constructor(private webServiceClient: WebServiceClient) {
    super();
    let textInputRef = new Ref<HTMLTextAreaElement>();
    let characterCountContainerRef = new Ref<HTMLDivElement>();
    let characterCountRef = new Ref<HTMLDivElement>();
    let uploadImagesContainerRef = new Ref<HTMLDivElement>();
    let uploadImageButtonRef = new Ref<HTMLDivElement>();
    let uploadImageErrorRef = new Ref<HTMLDivElement>();
    this.bodies = [
      E.div(
        {
          class: "quick-layout-text-input-label",
          style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.quickLayoutTextLabel)
      ),
      E.div(
        {
          class: "quick-layout-text-input-editor",
          style: `display: flex; flex-flow: column nowrap;`,
        },
        E.textareaRef(textInputRef, {
          class: "quick-layout-text-input",
          style: `padding: 0; margin: 0; outline: none; border: 0; background-color: initial; width: 100%; font-size: 1.4rem; font-family: initial; line-height: 2rem; color: ${SCHEME.neutral0}; border-bottom: .1rem solid ${SCHEME.neutral1}; resize: none;`,
          rows: "4",
        }),
        E.divRef(
          characterCountContainerRef,
          {
            class: "quick-layout-text-input-hints",
            style: `display: flex; flex-flow: row nowrap; align-self: flex-end; align-items: center; height: 1.6rem;`,
          },
          E.div(
            {
              class: "quick-layout-text-input-character-count-label",
              style: `font-size: 1.2rem; margin-right: .2rem;`,
            },
            E.text(LOCALIZED_TEXT.characterCountLabel)
          ),
          E.divRef(characterCountRef, {
            class: "quick-layout-text-input-character-count-number",
            style: `font-size: 1.2rem;`,
          })
        )
      ),
      E.div(
        {
          class: "quick-layout-upload-image-label",
          style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.quickLayoutUploadImagesLabel)
      ),
      E.divRef(
        uploadImagesContainerRef,
        {
          class: "quick-layout-upload-images",
          style: `display: flex; flex-flow: row wrap; align-items: center; gap: ${GAP};`,
        },
        E.divRef(
          uploadImageButtonRef,
          {
            class: "quick-layout-upload-image-button",
            style: `display: flex; flex-flow: column nowrap; justify-content: center; align-items: center; box-sizing: border-box; width: 12rem; height: 18rem; border: .4rem dashed ${SCHEME.neutral2}; border-radius: 1rem; cursor: pointer;`,
          },
          E.div(
            {
              class: "quick-layout-upload-image-icon",
              style: `height: 4rem; padding: .5rem; box-sizing: border-box;`,
            },
            createPlusIcon(SCHEME.neutral1)
          ),
          E.div(
            {
              class: "quick-layout-upload-image-label",
              style: `margin: .5rem .5rem 0; font-size: 1.4rem; text-align: center; color: ${SCHEME.neutral0}; `,
            },
            E.text(LOCALIZED_TEXT.quickLayoutUploadImageButtonLabel)
          )
        )
      ),
      E.divRef(
        uploadImageErrorRef,
        {
          class: "quick-layout-upload-image-error",
          style: `visibility: hidden; align-self: center; font-size: 1.4rem; color: ${SCHEME.error0};`,
        },
        E.text("1")
      ),
    ];
    this.textInput = textInputRef.val;
    this.characterCountContainer = characterCountContainerRef.val;
    this.characterCount = characterCountRef.val;
    this.uploadImagesContainer = uploadImagesContainerRef.val;
    this.uploadImageButton = uploadImageButtonRef.val;
    this.uploadImageError = uploadImageErrorRef.val;
    this.countCharacter();

    this.textInput.addEventListener("input", () => this.countCharacter());
    this.uploadImageButton.addEventListener("click", () => this.chooseFile());
  }

  public static create(): QuickLayoutEditor {
    return new QuickLayoutEditor(WEB_SERVICE_CLIENT);
  }

  private countCharacter(): void {
    this.characterCount.textContent = `${this.textInput.textLength}/${QuickLayoutEditor.CHARACTER_LIMIT}`;
    if (this.textInput.textLength <= QuickLayoutEditor.CHARACTER_LIMIT) {
      this.characterCountContainer.style.color = SCHEME.neutral2;
      if (this.textInput.textLength === 0) {
        this.validInputs.delete(InputField.TEXT);
      } else {
        this.validInputs.add(InputField.TEXT);
      }
    } else {
      this.characterCountContainer.style.color = SCHEME.error0;
      this.validInputs.delete(InputField.TEXT);
    }
    this.emitValidity();
  }

  private emitValidity(): void {
    if (
      this.validInputs.has(InputField.IMAGES) ||
      this.validInputs.has(InputField.TEXT)
    ) {
      this.emit("valid");
    } else {
      this.emit("invalid");
    }
  }

  private chooseFile(): void {
    let tempFileInput = E.input({ type: "file" });
    tempFileInput.multiple = true;
    tempFileInput.addEventListener("input", () =>
      this.loadImages(tempFileInput)
    );
    tempFileInput.click();
  }

  private async loadImages(fileInput: HTMLInputElement): Promise<void> {
    this.uploadImageError.style.visibility = "hidden";
    let filesFailed = new Array<string>();
    let loading = new Array<Promise<void>>();
    for (let file of fileInput.files) {
      loading.push(this.uploadAndLoadImageOrCollectFailure(file, filesFailed));
    }
    await Promise.all(loading);

    if (filesFailed.length > 0) {
      this.uploadImageError.textContent = `${
        LOCALIZED_TEXT.quickLayoutUploadImageFailure1
      }${filesFailed.join()}${LOCALIZED_TEXT.quickLayoutUploadImageFailure2}`;
      this.uploadImageError.style.visibility = "visible";
    }
    if (this.imagePreviewers.length >= QuickLayoutEditor.IMAGE_NUMBER_LIMIT) {
      this.uploadImageButton.style.display = "none";
    }
    this.checkImagesInputValidity();
    this.emit("imagesLoaded");
  }

  private async uploadAndLoadImageOrCollectFailure(
    imageFile: File,
    filesFailed: Array<string>
  ): Promise<void> {
    let response: UploadImageForTaleResponse;
    try {
      response = await uploadImageForTale(this.webServiceClient, imageFile);
    } catch (e) {
      console.error(`Failed to upload ${imageFile.name}.`, e);
      filesFailed.push(imageFile.name);
      return;
    }
    if (this.imagePreviewers.length >= QuickLayoutEditor.IMAGE_NUMBER_LIMIT) {
      filesFailed.push(imageFile.name);
      return;
    }

    this.addImagePreviewer(response.imagePath);
  }

  protected addImagePreviewer(imagePath: string): void {
    let imagePreviewer = ImagePreviewer.create(imagePath);
    this.insertImagePreviewer(this.imagePreviewers.length, imagePreviewer);
    imagePreviewer.on("top", () =>
      this.moveImagePreviewerToTop(imagePreviewer)
    );
    imagePreviewer.on("up", () => this.moveImagePreviewerUp(imagePreviewer));
    imagePreviewer.on("down", () =>
      this.moveImagePreviewerDown(imagePreviewer)
    );
    imagePreviewer.on("bottom", () =>
      this.moveImagePreviewerToBottom(imagePreviewer)
    );
    imagePreviewer.on("delete", () =>
      this.removeImagePreviewerForSure(imagePreviewer)
    );
  }

  private insertImagePreviewer(
    position: number,
    imagePreviewer: ImagePreviewer
  ) {
    if (this.imagePreviewers.length === 0) {
      imagePreviewer.hideMoveUpButtons();
      imagePreviewer.hideMoveDownButtons();
      this.uploadImagesContainer.insertBefore(
        imagePreviewer.body,
        this.uploadImageButton
      );
      this.imagePreviewers.push(imagePreviewer);
    } else {
      if (position === 0) {
        imagePreviewer.hideMoveUpButtons();
        imagePreviewer.showMoveDownButtons();
        this.imagePreviewers[0].showMoveUpButtons();
        this.uploadImagesContainer.prepend(imagePreviewer.body);
        this.imagePreviewers.splice(0, 0, imagePreviewer);
      } else if (position === this.imagePreviewers.length) {
        imagePreviewer.showMoveUpButtons();
        imagePreviewer.hideMoveDownButtons();
        this.imagePreviewers[
          this.imagePreviewers.length - 1
        ].showMoveDownButtons();
        this.uploadImagesContainer.insertBefore(
          imagePreviewer.body,
          this.uploadImageButton
        );
        this.imagePreviewers.push(imagePreviewer);
      } else {
        imagePreviewer.showMoveUpButtons();
        imagePreviewer.showMoveDownButtons();
        this.uploadImagesContainer.insertBefore(
          imagePreviewer.body,
          this.imagePreviewers[position].body
        );
        this.imagePreviewers.splice(position, 0, imagePreviewer);
      }
    }
  }

  private removeImagePreviewerForSure(imagePreviewer: ImagePreviewer): void {
    this.removeImagePreviewer(imagePreviewer);
    this.uploadImageButton.style.display = "flex";
    this.checkImagesInputValidity();
  }

  private removeImagePreviewer(imagePreviewer: ImagePreviewer): void {
    let position = this.imagePreviewers.indexOf(imagePreviewer);
    if (this.imagePreviewers.length > 1) {
      if (position === 0) {
        this.imagePreviewers[1].hideMoveUpButtons();
      } else if (position === this.imagePreviewers.length - 1) {
        this.imagePreviewers[
          this.imagePreviewers.length - 2
        ].hideMoveDownButtons();
      }
    }
    this.imagePreviewers.splice(position, 1);
    imagePreviewer.remove();
  }

  private moveImagePreviewerToTop(imagePreviewer: ImagePreviewer): void {
    this.removeImagePreviewer(imagePreviewer);
    this.insertImagePreviewer(0, imagePreviewer);
  }

  private moveImagePreviewerUp(imagePreviewer: ImagePreviewer): void {
    let position = this.imagePreviewers.indexOf(imagePreviewer);
    let newPosition = Math.max(0, position - 1);
    this.removeImagePreviewer(imagePreviewer);
    this.insertImagePreviewer(newPosition, imagePreviewer);
  }

  private moveImagePreviewerDown(imagePreviewer: ImagePreviewer): void {
    let position = this.imagePreviewers.indexOf(imagePreviewer);
    let newPosition = Math.min(this.imagePreviewers.length - 1, position + 1);
    this.removeImagePreviewer(imagePreviewer);
    this.insertImagePreviewer(newPosition, imagePreviewer);
  }

  private moveImagePreviewerToBottom(imagePreviewer: ImagePreviewer): void {
    this.removeImagePreviewer(imagePreviewer);
    this.insertImagePreviewer(this.imagePreviewers.length, imagePreviewer);
  }

  protected checkImagesInputValidity(): void {
    if (this.imagePreviewers.length === 0) {
      this.validInputs.delete(InputField.IMAGES);
    } else {
      this.validInputs.add(InputField.IMAGES);
    }
    this.emitValidity();
  }

  public remove(): void {
    for (let body of this.bodies) {
      body.remove();
    }
  }
}
