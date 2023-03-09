import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import {
  createArrowIcon,
  createArrowWithBarIcon,
  createTrashCanIcon,
} from "../../../../common/icons";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface ImageEditor {
  on(event: "top", listener: () => void): this;
  on(event: "up", listener: () => void): this;
  on(event: "down", listener: () => void): this;
  on(event: "bottom", listener: () => void): this;
  on(event: "delete", listener: () => void): this;
}

export class ImageEditor extends EventEmitter {
  public body: HTMLDivElement;
  private moveToTopButton: HTMLDivElement;
  private moveUpButton: HTMLDivElement;
  private moveDownButton: HTMLDivElement;
  private moveToBottomButton: HTMLDivElement;
  private deleteButton: HTMLDivElement;

  public constructor(public imageUrl: string) {
    super();
    let moveToTopButtonRef = new Ref<HTMLDivElement>();
    let moveUpButtonRef = new Ref<HTMLDivElement>();
    let moveDownButtonRef = new Ref<HTMLDivElement>();
    let moveToBottomButtonRef = new Ref<HTMLDivElement>();
    let deleteButtonRef = new Ref<HTMLDivElement>();
    this.body = E.div(
      {
        class: "image-editor",
        style: `display: flex; flex-flow: row nowrap; align-items: center;`,
      },
      E.div(
        {
          class: "image-editor-preview",
          style: `display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; box-sizing: border-box; width: 12rem; height: 18rem; border: .1rem solid ${SCHEME.neutral2};`,
        },
        E.image({
          class: "image-editor-preview-image",
          style: `max-width: 100%; max-height: 100%;`,
          src: imageUrl,
        })
      ),
      E.div(
        {
          class: "image-editor-buttons",
          style: `display: flex; flex-flow: column nowrap; justify-content: center; margin-left: .3rem; gap: .3rem;`,
        },
        E.divRef(
          moveToTopButtonRef,
          {
            class: "image-editor-move-top-button",
            style: `width: 3rem; height: 3rem; padding: .6rem; box-sizing: border-box;`,
          },
          createArrowWithBarIcon(SCHEME.neutral1)
        ),
        E.divRef(
          moveUpButtonRef,
          {
            class: "image-editor-move-up-button",
            style: `width: 3rem; height: 3rem; padding: .6rem; box-sizing: border-box;`,
          },
          createArrowIcon(SCHEME.neutral1)
        ),
        E.divRef(
          moveDownButtonRef,
          {
            class: "image-editor-move-down-button",
            style: `rotate: 180deg; width: 3rem; height: 3rem; padding: .6rem; box-sizing: border-box;`,
          },
          createArrowIcon(SCHEME.neutral1)
        ),
        E.divRef(
          moveToBottomButtonRef,
          {
            class: "image-editor-move-bottom-button",
            style: `rotate: 180deg; width: 3rem; height: 3rem; padding: .6rem; box-sizing: border-box;`,
          },
          createArrowWithBarIcon(SCHEME.neutral1)
        ),
        E.divRef(
          deleteButtonRef,
          {
            class: "image-editor-delete-button",
            style: `width: 3rem; height: 3rem; padding: .3rem; box-sizing: border-box;`,
          },
          createTrashCanIcon(SCHEME.neutral1)
        )
      )
    );
    this.moveToTopButton = moveToTopButtonRef.val;
    this.moveUpButton = moveUpButtonRef.val;
    this.moveDownButton = moveDownButtonRef.val;
    this.moveToBottomButton = moveToBottomButtonRef.val;
    this.deleteButton = deleteButtonRef.val;

    this.moveToTopButton.addEventListener("click", () => this.emit("top"));
    this.moveUpButton.addEventListener("click", () => this.emit("up"));
    this.moveDownButton.addEventListener("click", () => this.emit("down"));
    this.moveToBottomButton.addEventListener("click", () =>
      this.emit("bottom")
    );
    this.deleteButton.addEventListener("click", () => this.emit("delete"));
  }

  public static create(imageUrl: string): ImageEditor {
    return new ImageEditor(imageUrl);
  }

  public showMoveUpButtons(): void {
    this.moveToTopButton.style.display = "block";
    this.moveUpButton.style.display = "block";
  }

  public hideMoveUpButtons(): void {
    this.moveToTopButton.style.display = "none";
    this.moveUpButton.style.display = "none";
  }

  public showMoveDownButtons(): void {
    this.moveDownButton.style.display = "block";
    this.moveToBottomButton.style.display = "block";
  }

  public hideMoveDownButtons(): void {
    this.moveDownButton.style.display = "none";
    this.moveToBottomButton.style.display = "none";
  }

  // Visible for testing
  public moveUp(): void {
    this.moveUpButton.click();
  }

  // Visible for testing
  public moveToTop(): void {
    this.moveToTopButton.click();
  }

  // Visible for testing
  public moveDown(): void {
    this.moveDownButton.click();
  }

  // Visible for testing
  public moveToBottom(): void {
    this.moveToBottomButton.click();
  }

  // Visible for testing
  public delete(): void {
    this.deleteButton.click();
  }
}
