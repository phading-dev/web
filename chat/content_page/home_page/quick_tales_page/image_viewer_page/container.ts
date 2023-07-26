import EventEmitter = require("events");
import { AddBodiesFn } from "../../../../common/add_bodies_fn";
import { SCHEME } from "../../../../common/color_scheme";
import { IconButton, TooltipPosition } from "../../../../common/icon_button";
import { createArrowIcon } from "../../../../common/icons";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { MenuItem } from "../../../../common/menu_item/container";
import { createBackMenuItem } from "../../../../common/menu_item/factory";
import { ImageViewer } from "./image_viewer";

export interface ImagesViewerPage {
  on(event: "back", listener: () => void): this;
}

export class ImagesViewerPage extends EventEmitter {
  // Visible for testing
  public backMenuItem: MenuItem;
  public upButton: IconButton;
  public downButton: IconButton;

  private imageViewers = new Map<number, ImageViewer>();

  public constructor(
    private appendBodies: AddBodiesFn,
    private prependMenuBodies: AddBodiesFn,
    private appendControllerBodies: AddBodiesFn,
    private imagePaths: Array<string>,
    private index: number
  ) {
    super();
    this.backMenuItem = createBackMenuItem();
    this.prependMenuBodies(this.backMenuItem.body);

    this.upButton = IconButton.create(
      `width: 3rem; height: 3rem; padding: .7rem; box-sizing: border-box; rotate: 90deg; color: ${SCHEME.neutral1}; cursor: pointer;`,
      createArrowIcon("currentColor"),
      TooltipPosition.LEFT,
      LOCALIZED_TEXT.prevImageLabel
    );
    this.downButton = IconButton.create(
      `width: 3rem; height: 3rem; padding: .7rem; box-sizing: border-box; rotate: -90deg; color: ${SCHEME.neutral1}; cursor: pointer;`,
      createArrowIcon("currentColor"),
      TooltipPosition.LEFT,
      LOCALIZED_TEXT.nextImageLabel
    );
    this.appendControllerBodies(this.downButton.body, this.upButton.body);
    this.showCurrentImageViewer();

    this.backMenuItem.on("action", () => this.emit("back"));
    this.downButton.on("action", () => this.showNext());
    this.upButton.on("action", () => this.showPrev());
  }

  public static create(
    appendBodiesFn: (...bodies: Array<HTMLElement>) => void,
    prependMenuBodiesFn: (...bodies: Array<HTMLElement>) => void,
    appendControllerBodiesFn: (...bodies: Array<HTMLElement>) => void,
    imagePaths: Array<string>,
    initialIndex: number
  ): ImagesViewerPage {
    return new ImagesViewerPage(
      appendBodiesFn,
      prependMenuBodiesFn,
      appendControllerBodiesFn,
      imagePaths,
      initialIndex
    );
  }

  private async showCurrentImageViewer(): Promise<void> {
    let imageViewer = this.getImageViewer();
    this.appendBodies(imageViewer.body);
    this.appendControllerBodies(...imageViewer.controllerBodies);
    this.setButtonState();
  }

  private getImageViewer(): ImageViewer {
    if (this.imageViewers.has(this.index)) {
      return this.imageViewers.get(this.index);
    } else {
      let imageViewer = ImageViewer.create(this.imagePaths[this.index]);
      this.imageViewers.set(this.index, imageViewer);
      return imageViewer;
    }
  }

  private showNext(): void {
    if (this.index >= this.imagePaths.length - 1) {
      return;
    }
    this.removeCurrentImageViewer();
    this.index++;
    this.showCurrentImageViewer();
  }

  private showPrev(): void {
    if (this.index <= 0) {
      return;
    }
    this.removeCurrentImageViewer();
    this.index--;
    this.showCurrentImageViewer();
  }

  private setButtonState(): void {
    if (this.index <= 0) {
      this.upButton.disable();
    } else {
      this.upButton.enable();
    }
    if (this.index >= this.imagePaths.length - 1) {
      this.downButton.disable();
    } else {
      this.downButton.enable();
    }
  }

  private removeCurrentImageViewer(): void {
    this.imageViewers.get(this.index).remove();
  }

  public remove(): void {
    this.removeCurrentImageViewer();
    this.backMenuItem.remove();
    this.upButton.remove();
    this.downButton.remove();
  }
}
