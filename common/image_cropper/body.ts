import EventEmitter = require("events");
import { SCHEME } from "../color_scheme";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface ImageCropper {
  on(event: "change", listener: () => void): this;
}

export class ImageCropper extends EventEmitter {
  public static create(): ImageCropper {
    return new ImageCropper();
  }

  public body: HTMLDivElement;
  public canvas = new Ref<HTMLCanvasElement>();
  private leftColumn = new Ref<HTMLDivElement>();
  private midColumn = new Ref<HTMLDivElement>();
  private rightColumn = new Ref<HTMLDivElement>();
  private midTopBlock = new Ref<HTMLDivElement>();
  private midMidBlock = new Ref<HTMLDivElement>();
  private midBottmBlock = new Ref<HTMLDivElement>();
  private resizePointTopLeft = new Ref<HTMLDivElement>();
  private resizePointTopRight = new Ref<HTMLDivElement>();
  private resizePointBottmLeft = new Ref<HTMLDivElement>();
  private resizePointBottmRight = new Ref<HTMLDivElement>();
  public sx: number;
  public sy: number;
  public sWidth: number;
  public sHeight: number;
  public loaded: boolean;

  public constructor() {
    super();
    this.body = E.div(
      {
        class: "avatar-canvas",
        style: `position: relative; width: 100%; height: 100%; box-sizing: border-box; border: .1rem solid ${SCHEME.neutral1}; background-color: ${SCHEME.neutral4};`,
      },
      E.canvasRef(this.canvas, {
        class: "avatar-canvas-canvas",
        style: `width: 100%; height: 100%;`,
      }),
      E.div(
        {
          class: "avatar-canvas-cover",
          style: `position: absolute; display: flex; flex-flow: row nowrap; width: 100%; height: 100%; top: 0; left: 0;`,
        },
        E.divRef(this.leftColumn, {
          class: "avatar-canvas-left-column",
          style: `height: 100%; background-color: ${SCHEME.neutral4Translucent};`,
        }),
        E.divRef(
          this.midColumn,
          {
            class: "avatar-canvas-mid-column",
            style: `height: 100%; display: flex; flex-flow: column nowrap;`,
          },
          E.divRef(this.midTopBlock, {
            class: "avatar-canvas-mid-top-block",
            style: `width: 100%; background-color: ${SCHEME.neutral4Translucent};`,
          }),
          E.divRef(
            this.midMidBlock,
            {
              class: "avatar-canvas-mid-mid-block",
              style: `width: 100%; position: relative; box-sizing: border-box; `,
            },
            E.div({
              class: "avatar-canvas-mid-mid-circle",
              style: `width: 100%; height: 100%; box-sizing: border-box; border: .1rem dashed ${SCHEME.primary1}; border-radius: 100%;`,
            }),
            E.divRef(this.resizePointTopLeft, {
              class: "avatar-canvas-resize-point-top-left",
              style: `position: absolute; top: -.5rem; left: -.5rem; width: 1rem; height: 1rem; border: .1rem solid ${SCHEME.primary1}; border-radius: 1rem; background-color: ${SCHEME.primaryContrast0}; cursor: nw-resize;`,
            }),
            E.divRef(this.resizePointTopRight, {
              class: "avatar-canvas-resize-point-top-right",
              style: `position: absolute; top: -.5rem; right: -.5rem; width: 1rem; height: 1rem; border: .1rem solid ${SCHEME.primary1}; border-radius: 1rem; background-color: ${SCHEME.primaryContrast0}; cursor: ne-resize;`,
            }),
            E.divRef(this.resizePointBottmLeft, {
              class: "avatar-canvas-resize-point-bottom-left",
              style: `position: absolute; bottom: -.5rem; left: -.5rem; width: 1rem; height: 1rem; border: .1rem solid ${SCHEME.primary1}; border-radius: 1rem; background-color: ${SCHEME.primaryContrast0}; cursor: se-resize;`,
            }),
            E.divRef(this.resizePointBottmRight, {
              class: "avatar-canvas-resize-point-bottom-right",
              style: `position: absolute; bottom: -.5rem; right: -.5rem; width: 1rem; height: 1rem; border: .1rem solid ${SCHEME.primary1}; border-radius: 1rem; background-color: ${SCHEME.primaryContrast0}; cursor: sw-resize;`,
            }),
          ),
          E.divRef(this.midBottmBlock, {
            class: "avatar-canvas-mid-bottom-block",
            style: `width: 100%; background-color: ${SCHEME.neutral4Translucent};`,
          }),
        ),
        E.divRef(this.rightColumn, {
          class: "avatar-canvas-right-column",
          style: `height: 100%; background-color: ${SCHEME.neutral4Translucent};`,
        }),
      ),
    );
    this.clear();

    this.resizePointTopLeft.val.addEventListener(
      "pointerdown",
      this.startResizingTopLeft,
    );
    this.resizePointTopRight.val.addEventListener(
      "pointerdown",
      this.startResizingTopRight,
    );
    this.resizePointBottmLeft.val.addEventListener(
      "pointerdown",
      this.startResizingBottomLeft,
    );
    this.resizePointBottmRight.val.addEventListener(
      "pointerdown",
      this.startResizingBottomRight,
    );
  }

  public clear(): void {
    this.canvas.val
      .getContext("2d")
      .clearRect(0, 0, this.canvas.val.width, this.canvas.val.height);
    this.leftColumn.val.style.flex = "1 0 0";
    this.midColumn.val.style.flex = "2 0 0";
    this.midTopBlock.val.style.flex = "1 0 0";
    this.midMidBlock.val.style.flex = "2 0 0";
    this.midBottmBlock.val.style.flex = "1 0 0";
    this.rightColumn.val.style.flex = "1 0 0";
    this.loaded = false;
  }

  private startResizingTopLeft = (event: PointerEvent): void => {
    this.body.addEventListener("pointermove", this.resizeFromTopLeft);
    this.body.addEventListener("pointerup", this.stopResizingFromTopLeft);
    this.body.setPointerCapture(event.pointerId);
    this.resizeFromTopLeft(event);
  };

  private resizeFromTopLeft = (event: PointerEvent): void => {
    let canvasRect = this.canvas.val.getBoundingClientRect();
    let midMidBlockRect = this.midMidBlock.val.getBoundingClientRect();
    let x = Math.max(Math.min(event.x, midMidBlockRect.right), canvasRect.left);
    let y = Math.max(Math.min(event.y, midMidBlockRect.bottom), canvasRect.top);
    let length = Math.min(
      midMidBlockRect.right - x,
      midMidBlockRect.bottom - y,
    );
    this.midMidBlock.val.style.flex = `0 0 ${length}px`;
    this.midTopBlock.val.style.flex = `0 0 ${
      midMidBlockRect.bottom - length - canvasRect.top
    }px`;
    this.midColumn.val.style.flex = `0 0 ${length}px`;
    this.leftColumn.val.style.flex = `0 0 ${
      midMidBlockRect.right - length - canvasRect.left
    }px`;
    this.saveSize();
  };

  private saveSize(): void {
    // Need to force reflow.
    let canvasRect = this.canvas.val.getBoundingClientRect();
    let midMidBlockRect = this.midMidBlock.val.getBoundingClientRect();
    this.sx = midMidBlockRect.left - canvasRect.left;
    this.sy = midMidBlockRect.top - canvasRect.top;
    this.sWidth = midMidBlockRect.width;
    this.sHeight = midMidBlockRect.height;
    this.emit("change");
  }

  private stopResizingFromTopLeft = (event: PointerEvent): void => {
    this.body.removeEventListener("pointermove", this.resizeFromTopLeft);
    this.body.removeEventListener("pointerup", this.stopResizingFromTopLeft);
    this.body.releasePointerCapture(event.pointerId);
    this.resizeFromTopLeft(event);
  };

  private startResizingTopRight = (event: PointerEvent): void => {
    this.body.addEventListener("pointermove", this.resizeFromTopRight);
    this.body.addEventListener("pointerup", this.stopResizingFromTopRight);
    this.body.setPointerCapture(event.pointerId);
    this.resizeFromTopRight(event);
  };

  private resizeFromTopRight = (event: PointerEvent): void => {
    let canvasRect = this.canvas.val.getBoundingClientRect();
    let midMidBlockRect = this.midMidBlock.val.getBoundingClientRect();
    let x = Math.min(Math.max(event.x, midMidBlockRect.left), canvasRect.right);
    let y = Math.max(Math.min(event.y, midMidBlockRect.bottom), canvasRect.top);
    let length = Math.min(x - midMidBlockRect.left, midMidBlockRect.bottom - y);
    this.midMidBlock.val.style.flex = `0 0 ${length}px`;
    this.midTopBlock.val.style.flex = `0 0 ${
      midMidBlockRect.bottom - length - canvasRect.top
    }px`;
    this.midColumn.val.style.flex = `0 0 ${length}px`;
    this.rightColumn.val.style.flex = `0 0 ${
      canvasRect.right - length - midMidBlockRect.left
    }px`;
    this.saveSize();
  };

  private stopResizingFromTopRight = (event: PointerEvent): void => {
    this.body.removeEventListener("pointermove", this.resizeFromTopRight);
    this.body.removeEventListener("pointerup", this.stopResizingFromTopRight);
    this.body.releasePointerCapture(event.pointerId);
    this.resizeFromTopRight(event);
  };

  private startResizingBottomRight = (event: PointerEvent): void => {
    this.body.addEventListener("pointermove", this.resizeFromBottomRight);
    this.body.addEventListener("pointerup", this.stopResizingFromBottomRight);
    this.body.setPointerCapture(event.pointerId);
    this.resizeFromBottomRight(event);
  };

  private resizeFromBottomRight = (event: PointerEvent): void => {
    let canvasRect = this.canvas.val.getBoundingClientRect();
    let midMidBlockRect = this.midMidBlock.val.getBoundingClientRect();
    let x = Math.min(Math.max(event.x, midMidBlockRect.left), canvasRect.right);
    let y = Math.min(Math.max(event.y, midMidBlockRect.top), canvasRect.bottom);
    let length = Math.min(x - midMidBlockRect.left, y - midMidBlockRect.top);
    this.midMidBlock.val.style.flex = `0 0 ${length}px`;
    this.midBottmBlock.val.style.flex = `0 0 ${
      canvasRect.bottom - length - midMidBlockRect.top
    }px`;
    this.midColumn.val.style.flex = `0 0 ${length}px`;
    this.rightColumn.val.style.flex = `0 0 ${
      canvasRect.right - length - midMidBlockRect.left
    }px`;
    this.saveSize();
  };

  private stopResizingFromBottomRight = (event: PointerEvent): void => {
    this.body.removeEventListener("pointermove", this.resizeFromBottomRight);
    this.body.removeEventListener(
      "pointerup",
      this.stopResizingFromBottomRight,
    );
    this.body.releasePointerCapture(event.pointerId);
    this.resizeFromBottomRight(event);
  };

  private startResizingBottomLeft = (event: PointerEvent): void => {
    this.body.addEventListener("pointermove", this.resizeFromBottomLeft);
    this.body.addEventListener("pointerup", this.stopResizingFromBottomLeft);
    this.body.setPointerCapture(event.pointerId);
    this.resizeFromBottomLeft(event);
  };

  private resizeFromBottomLeft = (event: PointerEvent): void => {
    let canvasRect = this.canvas.val.getBoundingClientRect();
    let midMidBlockRect = this.midMidBlock.val.getBoundingClientRect();
    let x = Math.max(Math.min(event.x, midMidBlockRect.right), canvasRect.left);
    let y = Math.min(Math.max(event.y, midMidBlockRect.top), canvasRect.bottom);
    let length = Math.min(midMidBlockRect.right - x, y - midMidBlockRect.top);
    this.midMidBlock.val.style.flex = `0 0 ${length}px`;
    this.midBottmBlock.val.style.flex = `0 0 ${
      canvasRect.bottom - length - midMidBlockRect.top
    }px`;
    this.midColumn.val.style.flex = `0 0 ${length}px`;
    this.leftColumn.val.style.flex = `0 0 ${
      midMidBlockRect.right - length - canvasRect.left
    }px`;
    this.saveSize();
  };

  private stopResizingFromBottomLeft = (event: PointerEvent): void => {
    this.body.removeEventListener("pointermove", this.resizeFromBottomLeft);
    this.body.removeEventListener("pointerup", this.stopResizingFromBottomLeft);
    this.body.releasePointerCapture(event.pointerId);
    this.resizeFromBottomLeft(event);
  };

  public async load(imageFile: File): Promise<void> {
    this.canvas.val
      .getContext("2d")
      .clearRect(0, 0, this.canvas.val.width, this.canvas.val.height);
    await new Promise<void>((resolve, reject) => {
      let fileReader = new FileReader();
      fileReader.onload = () => {
        let image = new Image();
        image.onload = () => {
          this.loaded = true;
          let canvasWidth = this.canvas.val.offsetWidth;
          let canvasHeight = this.canvas.val.offsetHeight;
          let imageWidth = image.naturalWidth;
          let imageHeight = image.naturalHeight;
          let dWidth = 0;
          let dHeight = 0;
          if (imageWidth > imageHeight) {
            if (imageWidth > canvasWidth) {
              dHeight = (canvasWidth / imageWidth) * imageHeight;
              dWidth = canvasWidth;
            } else {
              dHeight = imageHeight;
              dWidth = imageWidth;
            }
          } else {
            if (imageHeight > canvasHeight) {
              dWidth = (canvasHeight / imageHeight) * imageWidth;
              dHeight = canvasHeight;
            } else {
              dWidth = imageWidth;
              dHeight = imageHeight;
            }
          }
          let dx = (canvasWidth - dWidth) / 2;
          let dy = (canvasHeight - dHeight) / 2;
          this.canvas.val.width = canvasWidth;
          this.canvas.val.height = canvasHeight;
          this.canvas.val
            .getContext("2d")
            .drawImage(image, dx, dy, dWidth, dHeight);

          this.saveSize();
          resolve();
        };
        image.onerror = () => {
          reject(new Error("Failed to load image from file."));
        };
        image.src = fileReader.result as string;
      };
      fileReader.onerror = (err) => {
        reject(new Error("Failed to read image file."));
      };
      fileReader.readAsDataURL(imageFile);
    });
  }

  public export(): Promise<Blob> {
    let resultCanvas = document.createElement("canvas");
    resultCanvas.width = this.sWidth;
    resultCanvas.height = this.sHeight;
    resultCanvas
      .getContext("2d")
      .drawImage(
        this.canvas.val,
        this.sx,
        this.sy,
        this.sWidth,
        this.sHeight,
        0,
        0,
        this.sWidth,
        this.sHeight,
      );
    return new Promise<Blob>((resovle) => {
      resultCanvas.toBlob((blob) => {
        resovle(blob);
      });
    });
  }

  public remove(): void {
    this.body.remove();
  }
}
