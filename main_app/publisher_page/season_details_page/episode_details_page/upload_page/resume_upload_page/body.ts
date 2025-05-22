import EventEmitter = require("events");
import { OUTLINE_BUTTON_STYLE } from "../../../../../../common/button_styles";
import { SCHEME } from "../../../../../../common/color_scheme";
import { SimpleIconButton } from "../../../../../../common/icon_button";
import { LOCALIZED_TEXT } from "../../../../../../common/locales/localized_text";
import { FONT_M } from "../../../../../../common/sizes";
import { ePage } from "../common/elements";
import { FileDropZone } from "../common/file_drop_zone";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export interface ResumeUploadPage {
  on(event: "back", listener: () => void): this;
  on(event: "cancel", listener: () => void): this;
  on(event: "upload", listener: (file: File) => void): this;
}

export class ResumeUploadPage extends EventEmitter {
  public static create(error?: string): ResumeUploadPage {
    return new ResumeUploadPage(error);
  }

  public body: HTMLDivElement;
  public backButton = new Ref<SimpleIconButton>();
  public fileDropZone = new Ref<FileDropZone>();
  private errorMessage = new Ref<HTMLDivElement>();
  public cancelButton = new Ref<HTMLDivElement>();

  public constructor(error?: string) {
    super();
    this.body = ePage(
      this.backButton,
      LOCALIZED_TEXT.resumeUploadTitle,
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      assign(this.fileDropZone, new FileDropZone()).body,
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      E.divRef(this.errorMessage, {
        class: "upload-page-drop-zone-error-message",
        style: `display: none; margin-bottom: .5rem; font-size: ${FONT_M}rem; color: ${SCHEME.error0};`,
      }),
      E.div(
        {
          class: "upload-page-drop-zone-instructions",
          style: `display: flex; flex-flow: row wrap; align-items: center; font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.resumeUploadInstructions),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 2rem;`,
      }),
      E.div(
        {
          class: "upload-page-uploading-actions",
          style: `display: flex; flex-flow: row nowrap; justify-content: flex-end; align-items: center; gap: 2rem;`,
        },
        E.divRef(
          this.cancelButton,
          {
            class: "upload-page-uploading-cancel-button",
            style: OUTLINE_BUTTON_STYLE,
          },
          E.text(LOCALIZED_TEXT.cancelButtonLabel),
        ),
      ),
    );
    this.backButton.val.on("action", () => this.emit("back"));
    this.fileDropZone.val.on("selected", (file) => this.emit("upload", file));
    if (error) {
      this.errorMessage.val.textContent = error;
      this.errorMessage.val.style.display = "block";
    }
    this.cancelButton.val.addEventListener("click", () => this.emit("cancel"));
  }

  public remove() {
    this.body.remove();
  }
}
