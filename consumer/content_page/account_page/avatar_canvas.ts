import EventEmitter = require("events");
import { SCHEME } from "../../common/color_scheme";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface AvatarCanvas {
  on(event: "change", listener: () => void): this;
}

export class AvatarCanvas extends EventEmitter {
  public body: HTMLDivElement;
  public canvas: HTMLCanvasElement;
  public sx: number;
  public sy: number;
  public sWidth: number;
  public sHeight: number;
  // Visible for testing
  public resizePointTopLeft: HTMLDivElement;
  public resizePointTopRight: HTMLDivElement;
  public resizePointBottmLeft: HTMLDivElement;
  public resizePointBottmRight: HTMLDivElement;

  private leftColumn: HTMLDivElement;
  private midColumn: HTMLDivElement;
  private rightColumn: HTMLDivElement;
  private midTopBlock: HTMLDivElement;
  private midMidBlock: HTMLDivElement;
  private midBottmBlock: HTMLDivElement;

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
    this.body = E.div(
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
          style: `flex: 1 0 0; height: 100%; background-color: ${SCHEME.neutral1Translucent};`,
        }),
        E.divRef(
          midColumnRef,
          {
            class: "avatar-canvas-mid-column",
            style: `flex: 0 0 20rem; height: 100%; display: flex; flex-flow: column nowrap;`,
          },
          E.divRef(midTopBlockRef, {
            class: "avatar-canvas-mid-top-block",
            style: `flex: 1 0 0; width: 100%; background-color: ${SCHEME.neutral1Translucent};`,
          }),
          E.divRef(
            midMidBlockRef,
            {
              class: "avatar-canvas-mid-mid-block",
              style: `flex: 0 0 20rem; width: 100%; position: relative; box-sizing: border-box; border: .1rem dashed ${SCHEME.primary1};`,
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
            style: `flex: 1 0 0; width: 100%; background-color: ${SCHEME.neutral1Translucent};`,
          })
        ),
        E.divRef(rightColumnRef, {
          class: "avatar-canvas-right-column",
          style: `flex: 1 0 0; height: 100%; background-color: ${SCHEME.neutral1Translucent};`,
        })
      )
    );
    this.canvas = canvasRef.val;
    this.leftColumn = leftColumnRef.val;
    this.midColumn = midColumnRef.val;
    this.rightColumn = rightColumnRef.val;
    this.midTopBlock = midTopBlockRef.val;
    this.midMidBlock = midMidBlockRef.val;
    this.midBottmBlock = midBottmBlockRef.val;
    this.resizePointTopLeft = resizePointTopLeftRef.val;
    this.resizePointTopRight = resizePointTopRightRef.val;
    this.resizePointBottmLeft = resizePointBottmLeftRef.val;
    this.resizePointBottmRight = resizePointBottmRightRef.val;

    this.resizePointTopLeft.addEventListener(
      "mousedown",
      this.startResizingTopLeft
    );
    this.resizePointTopRight.addEventListener(
      "mousedown",
      this.startResizingTopRight
    );
    this.resizePointBottmLeft.addEventListener(
      "mousedown",
      this.startResizingBottomLeft
    );
    this.resizePointBottmRight.addEventListener(
      "mousedown",
      this.startResizingBottomRight
    );
  }

  public static create(): AvatarCanvas {
    return new AvatarCanvas();
  }

  private startResizingTopLeft = (event: MouseEvent): void => {
    this.body.addEventListener("mousemove", this.resizeFromTopLeft);
    this.body.addEventListener("mouseleave", this.stopResizingFromTopLeft);
    this.body.addEventListener("mouseup", this.stopResizingFromTopLeft);
    this.resizeFromTopLeft(event);
  };

  private resizeFromTopLeft = (event: MouseEvent): void => {
    let bodyRect = this.body.getBoundingClientRect();
    let midMidBlockRect = this.midMidBlock.getBoundingClientRect();
    let length = Math.min(
      midMidBlockRect.right - event.x,
      midMidBlockRect.bottom - event.y
    );
    this.midMidBlock.style.flex = `0 0 ${length}px`;
    this.midTopBlock.style.flex = `0 0 ${
      midMidBlockRect.bottom - length - bodyRect.top
    }px`;
    this.midColumn.style.flex = `0 0 ${length}px`;
    this.leftColumn.style.flex = `0 0 ${
      midMidBlockRect.right - length - bodyRect.left
    }px`;
    this.saveSize(bodyRect, midMidBlockRect);
    this.emit("change");
  };

  private saveSize(bodyRect: DOMRect, midMidBlockRect: DOMRect): void {
    this.sx = midMidBlockRect.left - bodyRect.left;
    this.sy = midMidBlockRect.top - bodyRect.top;
    this.sWidth = midMidBlockRect.width;
    this.sHeight = midMidBlockRect.height;
  }

  private stopResizingFromTopLeft = (event: MouseEvent): void => {
    this.body.removeEventListener("mousemove", this.resizeFromTopLeft);
    this.body.removeEventListener("mouseleave", this.stopResizingFromTopLeft);
    this.body.removeEventListener("mouseup", this.stopResizingFromTopLeft);
    this.resizeFromTopLeft(event);
  };

  private startResizingTopRight = (event: MouseEvent): void => {
    this.body.addEventListener("mousemove", this.resizeFromTopRight);
    this.body.addEventListener("mouseleave", this.stopResizingFromTopRight);
    this.body.addEventListener("mouseup", this.stopResizingFromTopRight);
    this.resizeFromTopRight(event);
  };

  private resizeFromTopRight = (event: MouseEvent): void => {
    let bodyRect = this.body.getBoundingClientRect();
    let midMidBlockRect = this.midMidBlock.getBoundingClientRect();
    let length = Math.min(
      event.x - midMidBlockRect.left,
      midMidBlockRect.bottom - event.y
    );
    this.midMidBlock.style.flex = `0 0 ${length}px`;
    this.midTopBlock.style.flex = `0 0 ${
      midMidBlockRect.bottom - length - bodyRect.top
    }px`;
    this.midColumn.style.flex = `0 0 ${length}px`;
    this.rightColumn.style.flex = `0 0 ${
      bodyRect.right - length - midMidBlockRect.left
    }px`;
    this.saveSize(bodyRect, midMidBlockRect);
    this.emit("change");
  };

  private stopResizingFromTopRight = (event: MouseEvent): void => {
    this.body.removeEventListener("mousemove", this.resizeFromTopRight);
    this.body.removeEventListener("mouseleave", this.stopResizingFromTopRight);
    this.body.removeEventListener("mouseup", this.stopResizingFromTopRight);
    this.resizeFromTopRight(event);
  };

  private startResizingBottomRight = (event: MouseEvent): void => {
    this.body.addEventListener("mousemove", this.resizeFromBottomRight);
    this.body.addEventListener("mouseleave", this.stopResizingFromBottomRight);
    this.body.addEventListener("mouseup", this.stopResizingFromBottomRight);
    this.resizeFromBottomRight(event);
  };

  private resizeFromBottomRight = (event: MouseEvent): void => {
    let bodyRect = this.body.getBoundingClientRect();
    let midMidBlockRect = this.midMidBlock.getBoundingClientRect();
    let length = Math.min(
      event.x - midMidBlockRect.left,
      event.y - midMidBlockRect.top
    );
    this.midMidBlock.style.flex = `0 0 ${length}px`;
    this.midBottmBlock.style.flex = `0 0 ${
      bodyRect.bottom - length - midMidBlockRect.top
    }px`;
    this.midColumn.style.flex = `0 0 ${length}px`;
    this.rightColumn.style.flex = `0 0 ${
      bodyRect.right - length - midMidBlockRect.left
    }px`;
    this.saveSize(bodyRect, midMidBlockRect);
    this.emit("change");
  };

  private stopResizingFromBottomRight = (event: MouseEvent): void => {
    this.body.removeEventListener("mousemove", this.resizeFromBottomRight);
    this.body.removeEventListener(
      "mouseleave",
      this.stopResizingFromBottomRight
    );
    this.body.removeEventListener("mouseup", this.stopResizingFromBottomRight);
    this.resizeFromBottomRight(event);
  };

  private startResizingBottomLeft = (event: MouseEvent): void => {
    this.body.addEventListener("mousemove", this.resizeFromBottomLeft);
    this.body.addEventListener("mouseleave", this.stopResizingFromBottomLeft);
    this.body.addEventListener("mouseup", this.stopResizingFromBottomLeft);
    this.resizeFromBottomLeft(event);
  };

  private resizeFromBottomLeft = (event: MouseEvent): void => {
    let bodyRect = this.body.getBoundingClientRect();
    let midMidBlockRect = this.midMidBlock.getBoundingClientRect();
    let length = Math.min(
      midMidBlockRect.right - event.x,
      event.y - midMidBlockRect.top
    );
    this.midMidBlock.style.flex = `0 0 ${length}px`;
    this.midBottmBlock.style.flex = `0 0 ${
      bodyRect.bottom - length - midMidBlockRect.top
    }px`;
    this.midColumn.style.flex = `0 0 ${length}px`;
    this.leftColumn.style.flex = `0 0 ${
      midMidBlockRect.right - length - bodyRect.left
    }px`;
    this.saveSize(bodyRect, midMidBlockRect);
    this.emit("change");
  };

  private stopResizingFromBottomLeft = (event: MouseEvent): void => {
    this.body.removeEventListener("mousemove", this.resizeFromBottomLeft);
    this.body.removeEventListener(
      "mouseleave",
      this.stopResizingFromBottomLeft
    );
    this.body.removeEventListener("mouseup", this.stopResizingFromBottomLeft);
    this.resizeFromBottomLeft(event);
  };

  public async load(imageFile: File): Promise<void> {
    this.canvas
      .getContext("2d")
      .clearRect(0, 0, this.canvas.width, this.canvas.height);
    await new Promise<void>((resolve, reject) => {
      let fileReader = new FileReader();
      fileReader.onload = () => {
        let image = new Image();
        image.onload = () => {
          let canvasWidth = this.canvas.offsetWidth;
          let canvasHeight = this.canvas.offsetHeight;
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
          this.canvas.width = canvasWidth;
          this.canvas.height = canvasHeight;
          this.canvas
            .getContext("2d")
            .drawImage(image, dx, dy, dWidth, dHeight);

          this.saveSize(
            this.body.getBoundingClientRect(),
            this.midMidBlock.getBoundingClientRect()
          );
          this.emit("change");
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
    let bodyRect = this.body.getBoundingClientRect();
    let midMidBlockRect = this.midMidBlock.getBoundingClientRect();
    this.saveSize(bodyRect, midMidBlockRect);
    let resultCanvas = document.createElement("canvas");
    resultCanvas.width = this.sWidth;
    resultCanvas.height = this.sHeight;
    resultCanvas
      .getContext("2d")
      .drawImage(
        this.canvas,
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
}
