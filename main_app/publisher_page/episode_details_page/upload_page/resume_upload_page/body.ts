import EventEmitter = require("events");
import {
  Button,
  IconButton,
  OutlineButton,
} from "../../../../../common/button";
import { SCHEME } from "../../../../../common/color_scheme";
import { FileDropZone } from "../../../../../common/file_drop_zone";
import { LOCALIZED_TEXT } from "../../../../../common/locales/localized_text";
import {
  FONT_M,
  GAP_2X,
  GAP_d_25X,
  LINE_HEIGHT_M,
} from "../../../../../common/sizes";
import { ePage } from "../common/elements";
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
  public backButton = new Ref<IconButton>();
  public fileDropZone = new Ref<FileDropZone>();
  private errorMessage = new Ref<HTMLDivElement>();
  public cancelButton = new Ref<Button>();

  public constructor(error?: string) {
    super();
    this.body = ePage(
      this.backButton,
      LOCALIZED_TEXT.resumeUploadTitle,
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      assign(this.fileDropZone, new FileDropZone()).body,
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_d_25X}rem;`,
      }),
      E.divRef(this.errorMessage, {
        class: "upload-page-drop-zone-error-message",
        style: `display: none; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.error0};`,
      }),
      E.div(
        {
          class: "upload-page-drop-zone-instructions",
          style: `display: flex; flex-flow: row wrap; align-items: center; font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(LOCALIZED_TEXT.resumeUploadInstructions),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_2X}rem;`,
      }),
      E.div(
        {
          class: "upload-page-uploading-actions",
          style: `display: flex; flex-flow: row nowrap; justify-content: flex-end; align-items: center; gap: 2rem;`,
        },
        assign(
          this.cancelButton,
          new OutlineButton().append(E.text(LOCALIZED_TEXT.cancelButtonLabel)),
        ).body,
      ),
    );
    this.backButton.val.addAction(() => this.emit("back"));
    this.fileDropZone.val.on("select", (file) => this.emit("upload", file));
    if (error) {
      this.errorMessage.val.textContent = error;
      this.errorMessage.val.style.display = "block";
    }
    this.cancelButton.val.addAction(() => this.emit("cancel"));
  }

  public remove() {
    this.body.remove();
    this.removeAllListeners();
  }
}
