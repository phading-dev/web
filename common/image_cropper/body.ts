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

  private container: HTMLDivElement;
  private canvas_: HTMLCanvasElement;
  private sx_: number;
  private sy_: number;
  private sWidth_: number;
  private sHeight_: number;
  private loaded_: boolean;
  private leftColumn: HTMLDivElement;
  private midColumn: HTMLDivElement;
  private rightColumn: HTMLDivElement;
  private midTopBlock: HTMLDivElement;
  private midMidBlock: HTMLDivElement;
  private midBottmBlock: HTMLDivElement;
  private resizePointTopLeft_: HTMLDivElement;
  private resizePointTopRight_: HTMLDivElement;
  private resizePointBottmLeft_: HTMLDivElement;
  private resizePointBottmRight_: HTMLDivElement;

  public constructor() {
    super();
    let canvasRef = new Ref<HTMLCanvasElement>();
    let leftColumnRef = new Ref<HTMLDivElement>();
    let midColumnRef = new Ref<HTMLDivElement>();
    let rightColumnRef = new Ref<HTMLDivElement>();
    let midTopBlockRef = new Ref<HTMLDivElement>();
    let midMidBlockRef = new Ref<HTMLDivElement>();
    let midBottmBlockRef = new Ref<HTMLDivElement>();
    let resizePointTopLeftRef = new Ref<HTMLDivElement>();
    let resizePointTopRightRef = new Ref<HTMLDivElement>();
    let resizePointBottmLeftRef = new Ref<HTMLDivElement>();
    let resizePointBottmRightRef = new Ref<HTMLDivElement>();
    this.container = E.div(
      {
        class: "avatar-canvas-container",
        style: `position: relative; width: 100%; height: 100%; background-color: white;`,
      },
      E.canvasRef(canvasRef, {
        class: "avatar-canvas-canvas",
        style: `width: 100%; height: 100%;`,
      }),
      E.div(
        {
          class: "avatar-canvas-cover",
          style: `position: absolute; display: flex; flex-flow: row nowrap; width: 100%; height: 100%; top: 0; left: 0;`,
        },
        E.divRef(leftColumnRef, {
          class: "avatar-canvas-left-column",
          style: `height: 100%; background-color: ${SCHEME.neutral4Translucent};`,
        }),
        E.divRef(
          midColumnRef,
          {
            class: "avatar-canvas-mid-column",
            style: `height: 100%; display: flex; flex-flow: column nowrap;`,
          },
          E.divRef(midTopBlockRef, {
            class: "avatar-canvas-mid-top-block",
            style: `width: 100%; background-color: ${SCHEME.neutral4Translucent};`,
          }),
          E.divRef(
            midMidBlockRef,
            {
              class: "avatar-canvas-mid-mid-block",
              style: `width: 100%; position: relative; box-sizing: border-box; `,
            },
            E.div({
              class: "avatar-canvas-mid-mid-circle",
              style: `width: 100%; height: 100%; box-sizing: border-box; border: .1rem dashed ${SCHEME.primary1}; border-radius: 100%;`,
            }),
            E.divRef(resizePointTopLeftRef, {
              class: "avatar-canvas-resize-point-top-left",
              style: `position: absolute; top: -.5rem; left: -.5rem; width: 1rem; height: 1rem; border: .1rem solid ${SCHEME.primary1}; border-radius: 1rem; background-color: ${SCHEME.primaryContrast0}; cursor: nw-resize;`,
            }),
            E.divRef(resizePointTopRightRef, {
              class: "avatar-canvas-resize-point-top-right",
              style: `position: absolute; top: -.5rem; right: -.5rem; width: 1rem; height: 1rem; border: .1rem solid ${SCHEME.primary1}; border-radius: 1rem; background-color: ${SCHEME.primaryContrast0}; cursor: ne-resize;`,
            }),
            E.divRef(resizePointBottmLeftRef, {
              class: "avatar-canvas-resize-point-bottom-left",
              style: `position: absolute; bottom: -.5rem; left: -.5rem; width: 1rem; height: 1rem; border: .1rem solid ${SCHEME.primary1}; border-radius: 1rem; background-color: ${SCHEME.primaryContrast0}; cursor: se-resize;`,
            }),
            E.divRef(resizePointBottmRightRef, {
              class: "avatar-canvas-resize-point-bottom-right",
              style: `position: absolute; bottom: -.5rem; right: -.5rem; width: 1rem; height: 1rem; border: .1rem solid ${SCHEME.primary1}; border-radius: 1rem; background-color: ${SCHEME.primaryContrast0}; cursor: sw-resize;`,
            })
          ),
          E.divRef(midBottmBlockRef, {
            class: "avatar-canvas-mid-bottom-block",
            style: `width: 100%; background-color: ${SCHEME.neutral4Translucent};`,
          })
        ),
        E.divRef(rightColumnRef, {
          class: "avatar-canvas-right-column",
          style: `height: 100%; background-color: ${SCHEME.neutral4Translucent};`,
        })
      )
    );
    this.canvas_ = canvasRef.val;
    this.leftColumn = leftColumnRef.val;
    this.midColumn = midColumnRef.val;
    this.rightColumn = rightColumnRef.val;
    this.midTopBlock = midTopBlockRef.val;
    this.midMidBlock = midMidBlockRef.val;
    this.midBottmBlock = midBottmBlockRef.val;
    this.resizePointTopLeft_ = resizePointTopLeftRef.val;
    this.resizePointTopRight_ = resizePointTopRightRef.val;
    this.resizePointBottmLeft_ = resizePointBottmLeftRef.val;
    this.resizePointBottmRight_ = resizePointBottmRightRef.val;
    this.clear();

    this.resizePointTopLeft_.addEventListener(
      "mousedown",
      this.startResizingTopLeft
    );
    this.resizePointTopRight_.addEventListener(
      "mousedown",
      this.startResizingTopRight
    );
    this.resizePointBottmLeft_.addEventListener(
      "mousedown",
      this.startResizingBottomLeft
    );
    this.resizePointBottmRight_.addEventListener(
      "mousedown",
      this.startResizingBottomRight
    );
  }

  public clear(): void {
    this.canvas_
      .getContext("2d")
      .clearRect(0, 0, this.canvas_.width, this.canvas_.height);
    this.leftColumn.style.flex = "1 0 0";
    this.midColumn.style.flex = "2 0 0";
    this.midTopBlock.style.flex = "1 0 0";
    this.midMidBlock.style.flex = "2 0 0";
    this.midBottmBlock.style.flex = "1 0 0";
    this.rightColumn.style.flex = "1 0 0";
    this.loaded_ = false;
  }

  private startResizingTopLeft = (event: MouseEvent): void => {
    this.container.addEventListener("mousemove", this.resizeFromTopLeft);
    this.container.addEventListener("mouseleave", this.stopResizingFromTopLeft);
    this.container.addEventListener("mouseup", this.stopResizingFromTopLeft);
    this.resizeFromTopLeft(event);
  };

  private resizeFromTopLeft = (event: MouseEvent): void => {
    let bodyRect = this.container.getBoundingClientRect();
    let midMidBlockRect = this.midMidBlock.getBoundingClientRect();
    let x = Math.max(Math.min(event.x, midMidBlockRect.right), bodyRect.left);
    let y = Math.max(Math.min(event.y, midMidBlockRect.bottom), bodyRect.top);
    let length = Math.min(
      midMidBlockRect.right - x,
      midMidBlockRect.bottom - y
    );
    this.midMidBlock.style.flex = `0 0 ${length}px`;
    this.midTopBlock.style.flex = `0 0 ${
      midMidBlockRect.bottom - length - bodyRect.top
    }px`;
    this.midColumn.style.flex = `0 0 ${length}px`;
    this.leftColumn.style.flex = `0 0 ${
      midMidBlockRect.right - length - bodyRect.left
    }px`;
    this.saveSize();
  };

  private saveSize(): void {
    // Need to force reflow.
    let bodyRect = this.container.getBoundingClientRect();
    let midMidBlockRect = this.midMidBlock.getBoundingClientRect();
    this.sx_ = midMidBlockRect.left - bodyRect.left;
    this.sy_ = midMidBlockRect.top - bodyRect.top;
    this.sWidth_ = midMidBlockRect.width;
    this.sHeight_ = midMidBlockRect.height;
    this.emit("change");
  }

  private stopResizingFromTopLeft = (event: MouseEvent): void => {
    this.container.removeEventListener("mousemove", this.resizeFromTopLeft);
    this.container.removeEventListener(
      "mouseleave",
      this.stopResizingFromTopLeft
    );
    this.container.removeEventListener("mouseup", this.stopResizingFromTopLeft);
    this.resizeFromTopLeft(event);
  };

  private startResizingTopRight = (event: MouseEvent): void => {
    this.container.addEventListener("mousemove", this.resizeFromTopRight);
    this.container.addEventListener(
      "mouseleave",
      this.stopResizingFromTopRight
    );
    this.container.addEventListener("mouseup", this.stopResizingFromTopRight);
    this.resizeFromTopRight(event);
  };

  private resizeFromTopRight = (event: MouseEvent): void => {
    let bodyRect = this.container.getBoundingClientRect();
    let midMidBlockRect = this.midMidBlock.getBoundingClientRect();
    let x = Math.min(Math.max(event.x, midMidBlockRect.left), bodyRect.right);
    let y = Math.max(Math.min(event.y, midMidBlockRect.bottom), bodyRect.top);
    let length = Math.min(x - midMidBlockRect.left, midMidBlockRect.bottom - y);
    this.midMidBlock.style.flex = `0 0 ${length}px`;
    this.midTopBlock.style.flex = `0 0 ${
      midMidBlockRect.bottom - length - bodyRect.top
    }px`;
    this.midColumn.style.flex = `0 0 ${length}px`;
    this.rightColumn.style.flex = `0 0 ${
      bodyRect.right - length - midMidBlockRect.left
    }px`;
    this.saveSize();
  };

  private stopResizingFromTopRight = (event: MouseEvent): void => {
    this.container.removeEventListener("mousemove", this.resizeFromTopRight);
    this.container.removeEventListener(
      "mouseleave",
      this.stopResizingFromTopRight
    );
    this.container.removeEventListener(
      "mouseup",
      this.stopResizingFromTopRight
    );
    this.resizeFromTopRight(event);
  };

  private startResizingBottomRight = (event: MouseEvent): void => {
    this.container.addEventListener("mousemove", this.resizeFromBottomRight);
    this.container.addEventListener(
      "mouseleave",
      this.stopResizingFromBottomRight
    );
    this.container.addEventListener(
      "mouseup",
      this.stopResizingFromBottomRight
    );
    this.resizeFromBottomRight(event);
  };

  private resizeFromBottomRight = (event: MouseEvent): void => {
    let bodyRect = this.container.getBoundingClientRect();
    let midMidBlockRect = this.midMidBlock.getBoundingClientRect();
    let x = Math.min(Math.max(event.x, midMidBlockRect.left), bodyRect.right);
    let y = Math.min(Math.max(event.y, midMidBlockRect.top), bodyRect.bottom);
    let length = Math.min(x - midMidBlockRect.left, y - midMidBlockRect.top);
    this.midMidBlock.style.flex = `0 0 ${length}px`;
    this.midBottmBlock.style.flex = `0 0 ${
      bodyRect.bottom - length - midMidBlockRect.top
    }px`;
    this.midColumn.style.flex = `0 0 ${length}px`;
    this.rightColumn.style.flex = `0 0 ${
      bodyRect.right - length - midMidBlockRect.left
    }px`;
    this.saveSize();
  };

  private stopResizingFromBottomRight = (event: MouseEvent): void => {
    this.container.removeEventListener("mousemove", this.resizeFromBottomRight);
    this.container.removeEventListener(
      "mouseleave",
      this.stopResizingFromBottomRight
    );
    this.container.removeEventListener(
      "mouseup",
      this.stopResizingFromBottomRight
    );
    this.resizeFromBottomRight(event);
  };

  private startResizingBottomLeft = (event: MouseEvent): void => {
    this.container.addEventListener("mousemove", this.resizeFromBottomLeft);
    this.container.addEventListener(
      "mouseleave",
      this.stopResizingFromBottomLeft
    );
    this.container.addEventListener("mouseup", this.stopResizingFromBottomLeft);
    this.resizeFromBottomLeft(event);
  };

  private resizeFromBottomLeft = (event: MouseEvent): void => {
    let bodyRect = this.container.getBoundingClientRect();
    let midMidBlockRect = this.midMidBlock.getBoundingClientRect();
    let x = Math.max(Math.min(event.x, midMidBlockRect.right), bodyRect.left);
    let y = Math.min(Math.max(event.y, midMidBlockRect.top), bodyRect.bottom);
    let length = Math.min(midMidBlockRect.right - x, y - midMidBlockRect.top);
    this.midMidBlock.style.flex = `0 0 ${length}px`;
    this.midBottmBlock.style.flex = `0 0 ${
      bodyRect.bottom - length - midMidBlockRect.top
    }px`;
    this.midColumn.style.flex = `0 0 ${length}px`;
    this.leftColumn.style.flex = `0 0 ${
      midMidBlockRect.right - length - bodyRect.left
    }px`;
    this.saveSize();
  };

  private stopResizingFromBottomLeft = (event: MouseEvent): void => {
    this.container.removeEventListener("mousemove", this.resizeFromBottomLeft);
    this.container.removeEventListener(
      "mouseleave",
      this.stopResizingFromBottomLeft
    );
    this.container.removeEventListener(
      "mouseup",
      this.stopResizingFromBottomLeft
    );
    this.resizeFromBottomLeft(event);
  };

  public get body() {
    return this.container;
  }
  public get canvas() {
    return this.canvas_;
  }
  public get sx() {
    return this.sx_;
  }
  public get sy() {
    return this.sy_;
  }
  public get sWidth() {
    return this.sWidth_;
  }
  public get sHeight() {
    return this.sHeight_;
  }
  public get loaded() {
    return this.loaded_;
  }

  public async load(imageFile: File): Promise<void> {
    this.canvas_
      .getContext("2d")
      .clearRect(0, 0, this.canvas_.width, this.canvas_.height);
    await new Promise<void>((resolve, reject) => {
      let fileReader = new FileReader();
      fileReader.onload = () => {
        let image = new Image();
        image.onload = () => {
          this.loaded_ = true;
          let canvasWidth = this.canvas_.offsetWidth;
          let canvasHeight = this.canvas_.offsetHeight;
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
          this.canvas_.width = canvasWidth;
          this.canvas_.height = canvasHeight;
          this.canvas_
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
        this.canvas_,
        this.sx,
        this.sy,
        this.sWidth,
        this.sHeight,
        0,
        0,
        this.sWidth,
        this.sHeight
      );
    return new Promise<Blob>((resovle) => {
      resultCanvas.toBlob((blob) => {
        resovle(blob);
      });
    });
  }

  // Visible for testing
  public get resizePointTopLeft() {
    return this.resizePointTopLeft_;
  }

  public get resizePointTopRight() {
    return this.resizePointTopRight_;
  }

  public get resizePointBottmLeft() {
    return this.resizePointBottmLeft_;
  }

  public get resizePointBottmRight() {
    return this.resizePointBottmRight_;
  }
}
