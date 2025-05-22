import EventEmitter = require("events");
import { SCHEME } from "../../../../../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../../../../../common/locales/localized_text";
import { FONT_M } from "../../../../../../common/sizes";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface FileDropZone {
  on(event: "selected", listener: (file: File) => void): this;
}

export class FileDropZone extends EventEmitter {
  public body: HTMLDivElement;
  public fileInput = new Ref<HTMLInputElement>();

  public constructor() {
    super();
    this.body = E.div(
      {
        class: "upload-page-drop-zone",
        style: `cursor: pointer; border: .2rem dashed; border-radius: 1rem; padding: 10rem 2rem; display: flex; flex-flow: column nowrap; justify-content: center; align-items: center; gap: 2rem;`,
      },
      E.div(
        {
          class: "upload-page-drop-zone-drag-drop",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(`${LOCALIZED_TEXT.dragAndDropFile}`),
      ),
      E.div(
        {
          class: "upload-page-drop-zone-or",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral1};`,
        },
        E.text(`${LOCALIZED_TEXT.dragAndDropFileOr}`),
      ),
      E.div(
        {
          class: "upload-page-drop-zone-click-to-select",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(`${LOCALIZED_TEXT.clickToSelectFile}`),
      ),
      E.inputRef(this.fileInput, {
        style: "display: none;",
        type: "file",
      }),
    );
    this.lowlight();
    this.body.addEventListener("dragleave", () => this.lowlight());
    this.body.addEventListener("dragend", () => this.lowlight());
    this.body.addEventListener("dragover", (e) => {
      e.preventDefault(); // Needed to allow drop
      this.highlight();
    });
    this.body.addEventListener("drop", (e) => {
      e.preventDefault();
      this.lowlight();
      if (e.dataTransfer.files.length > 0) {
        this.emit("selected", e.dataTransfer.files[0]);
      }
    });
    this.body.addEventListener("click", () => {
      this.fileInput.val.click();
    });
    this.fileInput.val.addEventListener("change", () => {
      if (this.fileInput.val.files.length > 0) {
        this.emit("selected", this.fileInput.val.files[0]);
      }
    });
  }

  private highlight(): void {
    this.body.style.borderColor = SCHEME.primary1;
  }

  private lowlight(): void {
    this.body.style.borderColor = SCHEME.neutral1;
  }

  public click(): void {
    this.body.click();
  }
}
