import EventEmitter = require("events");
import {
  FilledBlockingButton,
  OutlineBlockingButton,
} from "../blocking_button";
import { SCHEME } from "../color_scheme";
import { ImageCropper } from "../image_cropper/container";
import { LOCALIZED_TEXT } from "../locales/localized_text";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface EditPersonaPage {
  on(event: "imageLoaded", listener: () => void): this;
}

export enum InputField {
  NAME,
  IMAGE,
}

export class EditPersonaPage extends EventEmitter {
  private static NAME_CHARACTER_LIMIT = 80;

  public body: HTMLDivElement;
  // Visible for testing
  public nameInput: HTMLInputElement;
  public chooseFileButton: OutlineBlockingButton;
  public submitButton: FilledBlockingButton;
  private nameInputError: HTMLDivElement;
  private loadErrorText: HTMLDivElement;
  private imageCropper: ImageCropper;
  private submitError: HTMLDivElement;
  private validInputs = new Set<InputField>();

  public constructor(
    private refreshSubmitButtonFn: (validInputs: Set<InputField>) => boolean,
    private submitActionFn: (
      nameInput: HTMLInputElement,
      imageCropper: ImageCropper
    ) => Promise<void>,
    namePersonaLabel: HTMLElement,
    chooseImageButtonLabel: string,
    submitButtonLabel: string,
    ...currentImageAndLabel: Array<HTMLElement>
  ) {
    super();
    let nameInputRef = new Ref<HTMLInputElement>();
    let nameInputErrorRef = new Ref<HTMLDivElement>();
    let chooseFileButtonRef = new Ref<OutlineBlockingButton>();
    let loadErrorTextRef = new Ref<HTMLDivElement>();
    let imageCropperRef = new Ref<ImageCropper>();
    let submitButtonRef = new Ref<FilledBlockingButton>();
    let submitErrorRef = new Ref<HTMLDivElement>();
    this.body = E.div(
      {
        class: "edit-persona",
        style: `display: flex; flex-flow: row nowrap; justify-content: center; width: 100vw;`,
      },
      E.div(
        {
          class: "edit-persona-card",
          style: `display: flex; flex-flow: column nowrap; align-items: center; box-sizing: border-box; width: 100%; max-width: 100rem; gap: 2rem; padding: 3rem; background-color: ${SCHEME.neutral4};`,
        },
        namePersonaLabel,
        E.inputRef(nameInputRef, {
          class: "edit-persona-name-input",
          style: `padding: 0; margin: 0; outline: none; border: 0; background-color: initial; width: 50%; font-size: 1.4rem; color: ${SCHEME.neutral0}; border-bottom: .1rem solid;`,
          placeholder: LOCALIZED_TEXT.namePersonaPlaceholder,
        }),
        E.divRef(
          nameInputErrorRef,
          {
            class: "edit-persona-name-input-error",
            style: `visibility: hidden; font-size: 1.4rem; color: ${SCHEME.error0};`,
          },
          E.text("1")
        ),
        ...currentImageAndLabel,
        assign(
          chooseFileButtonRef,
          OutlineBlockingButton.create(E.text(chooseImageButtonLabel)).enable()
        ).body,
        E.divRef(
          loadErrorTextRef,
          {
            class: "edit-persona-image-load-error",
            style: `visibility: hidden; font-size: 1.4rem; color: ${SCHEME.error0};`,
          },
          E.text("1")
        ),
        E.div(
          {
            class: "edit-persona-image-cropper-wrapper",
            style: `width: 25rem; height: 25rem;`,
          },
          assign(imageCropperRef, ImageCropper.create()).body
        ),
        assign(
          submitButtonRef,
          FilledBlockingButton.create(E.text(submitButtonLabel))
        ).body,
        E.divRef(
          submitErrorRef,
          {
            class: "edit-persona-submit-status-text",
            style: `visibility: hidden; font-size: 1.4rem; color: ${SCHEME.error0};`,
          },
          E.text("1")
        )
      )
    );
    this.nameInput = nameInputRef.val;
    this.nameInputError = nameInputErrorRef.val;
    this.chooseFileButton = chooseFileButtonRef.val;
    this.loadErrorText = loadErrorTextRef.val;
    this.imageCropper = imageCropperRef.val;
    this.submitButton = submitButtonRef.val;
    this.submitError = submitErrorRef.val;
    this.checkInput();
    this.refreshSubmitButton();

    this.nameInput.addEventListener("input", () => this.checkInput());
    this.chooseFileButton.on("action", () => this.chooseFile());
    this.submitButton.on("action", () => this.submitPersonaAction());
    this.submitButton.on("postAction", (error) =>
      this.postSubmitPersonaAction(error)
    );
  }

  private checkInput(): void {
    if (this.nameInput.value.length > EditPersonaPage.NAME_CHARACTER_LIMIT) {
      this.nameInput.style.borderColor = SCHEME.error0;
      this.nameInputError.textContent = LOCALIZED_TEXT.personaNameTooLongError;
      this.nameInputError.style.visibility = "visible";
      this.validInputs.delete(InputField.NAME);
    } else {
      this.nameInput.style.borderColor = SCHEME.neutral1;
      this.nameInputError.style.visibility = "hidden";
      if (this.nameInput.value.length === 0) {
        this.validInputs.delete(InputField.NAME);
      } else {
        this.validInputs.add(InputField.NAME);
      }
    }
    this.refreshSubmitButton();
  }

  private refreshSubmitButton(): void {
    if (this.refreshSubmitButtonFn(this.validInputs)) {
      this.submitButton.enable();
    } else {
      this.submitButton.disable();
    }
  }

  private async chooseFile(): Promise<void> {
    await new Promise<void>((resolve) => {
      let fileInput = E.input({ type: "file" });
      fileInput.addEventListener("input", async () => {
        await this.loadImage(fileInput.files);
        resolve();
      });
      fileInput.click();
    });
  }

  private async loadImage(files: FileList): Promise<void> {
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
    this.validInputs.add(InputField.IMAGE);
    this.refreshSubmitButton();
    this.emit("imageLoaded");
  }

  private async submitPersonaAction(): Promise<void> {
    this.submitError.style.visibility = "hidden";
    await this.submitActionFn(this.nameInput, this.imageCropper);
  }

  private postSubmitPersonaAction(error?: Error): void {
    if (error) {
      this.submitError.style.visibility = "visible";
      this.submitError.textContent = LOCALIZED_TEXT.createPersonaError;
      console.error(error);
    }
  }

  public remove(): void {
    this.body.remove();
  }
}
