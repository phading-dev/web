import EventEmitter = require("events");
import { SCHEME } from "./color_scheme";
import { LOCALIZED_TEXT } from "./locales/localized_text";
import {
  BORDER_RADIUS_S,
  BORDER_WIDTH_2,
  FONT_M,
  GAP_1_5X,
  GAP_6X,
} from "./sizes";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface FileDropZone {
  on(event: "select", listener: (file: File) => void): this;
}

export class FileDropZone extends EventEmitter {
  public body: HTMLDivElement;
  public fileInput = new Ref<HTMLInputElement>();

  public constructor(customStyles: string = "") {
    super();
    this.body = E.div(
      {
        class: "upload-page-drop-zone",
        style: `cursor: pointer; border: ${BORDER_WIDTH_2}rem dashed; border-radius: ${BORDER_RADIUS_S}rem; padding: ${GAP_6X}rem ${GAP_1_5X}rem; box-sizing: border-box; display: flex; flex-flow: column nowrap; justify-content: center; align-items: center; gap: ${GAP_1_5X}rem; ${customStyles}`,
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
        this.emit("select", e.dataTransfer.files[0]);
      }
    });
    this.body.addEventListener("click", () => {
      this.fileInput.val.click();
    });
    this.fileInput.val.addEventListener("change", () => {
      if (this.fileInput.val.files.length > 0) {
        this.emit("select", this.fileInput.val.files[0]);
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
