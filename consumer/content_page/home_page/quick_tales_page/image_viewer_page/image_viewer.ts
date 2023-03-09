import EventEmitter = require("events");
import { SCHEME } from "../../../../common/color_scheme";
import { IconButton, TooltipPosition } from "../../../../common/icon_button";
import {
  createExpandIcon,
  createMinusIcon,
  createPlusIcon,
} from "../../../../common/icons";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface ImageViewer {
  on(event: "loaded", listener: () => void): this;
}

export class ImageViewer extends EventEmitter {
  private static BUTTON_STYLE = `width: 3rem; height: 3rem; box-sizing: border-box; cursor: pointer;`;

  public body: HTMLDivElement;
  public controllerBodies: Array<HTMLElement>;
  // Visible for testing
  public zoomInButton: IconButton;
  public zoomOutButton: IconButton;
  public zoomFitButton: IconButton;

  private image: HTMLImageElement;

  public constructor(imageUrl: string) {
    super();
    let imageRef = new Ref<HTMLImageElement>();
    this.body = E.div(
      {
        class: "image-viewer-image-scroller",
        style: `flex-flow: column nowrap; min-width: 100vw; min-height: 100vh;`,
      },
      E.imageRef(imageRef, {
        class: "image-viewer-image",
        style: `flex: 0 0 auto; margin: auto;`,
        src: imageUrl
      })
    );
    this.image = imageRef.val;

    this.zoomInButton = IconButton.create(
      `${ImageViewer.BUTTON_STYLE} padding: .5rem;`,
      createPlusIcon(SCHEME.neutral1),
      TooltipPosition.LEFT,
      LOCALIZED_TEXT.zoomInLabel,
    );
    this.zoomOutButton = IconButton.create(
      `${ImageViewer.BUTTON_STYLE} padding: .5rem;`,
      createMinusIcon(SCHEME.neutral1),
      TooltipPosition.LEFT,
      LOCALIZED_TEXT.zoomOutLabel,
    );
    this.zoomFitButton = IconButton.create(
      `${ImageViewer.BUTTON_STYLE} padding: .5rem;`,
      createExpandIcon(SCHEME.neutral1),
      TooltipPosition.LEFT,
      LOCALIZED_TEXT.zoomFitLabel,
    );
    this.controllerBodies = [
      this.zoomFitButton.body,
      this.zoomOutButton.body,
      this.zoomInButton.body,
    ];

    this.zoomInButton.on("action", () => this.zoomInImage());
    this.zoomOutButton.on("action", () => this.zoomOutImage());
    this.zoomFitButton.on("action", () => this.fitImage());
    this.image.addEventListener("load", () => this.load());
  }

  public static create(imageUrl: string): ImageViewer {
    return new ImageViewer(imageUrl);
  }

  private zoomInImage(): void {
    this.zoomImage(1.2);
  }

  private zoomOutImage(): void {
    this.zoomImage(0.8);
  }

  private zoomImage(percentage: number): void {
    let clientWidth = this.image.clientWidth;
    let newClientWidth = clientWidth * percentage;
    let newScrollX = window.scrollX + newClientWidth / 2 - clientWidth / 2;
    let clientHeight = this.image.clientHeight;
    let newClientHeight = clientHeight * percentage;
    let newScrollY = window.scrollY + newClientHeight / 2 - clientHeight / 2;
    this.image.style.width = `${newClientWidth}px`;
    this.image.clientWidth; // Force reflow
    window.scrollTo(newScrollX, newScrollY);
  }

  private fitImage(): void {
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    if (
      this.image.naturalWidth / this.image.naturalHeight >
      viewportWidth / viewportHeight
    ) {
      this.image.style.width = `${viewportWidth}px`;
    } else {
      this.image.style.width = `${
        (this.image.naturalWidth / this.image.naturalHeight) * viewportHeight
      }px`;
    }
  }

  private load(): void {
    this.fitImage();
    this.emit("loaded");
  }

  public show(): this {
    this.body.style.display = "flex";
    this.zoomInButton.show();
    this.zoomOutButton.show();
    this.zoomFitButton.show();
    return this;
  }

  public hide(): this {
    this.body.style.display = "none";
    this.zoomInButton.hide();
    this.zoomOutButton.hide();
    this.zoomFitButton.hide();
    return this;
  }

  public remove(): void {
    this.body.remove();
    this.zoomInButton.body.remove();
    this.zoomOutButton.body.remove();
    this.zoomFitButton.body.remove();
  }
}
