import EventEmitter = require("events");
import { SCHEME } from "./color_scheme";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export enum Orientation {
  VERTICAL = 1,
  HORIZONTAL = 2,
}

export interface Slider {
  on(event: "change", listener: (value: number) => void): this;
}

export class Slider extends EventEmitter {
  public static create(
    orientation: Orientation,
    length: string, // rem or percentage
    sidePadding: string, // rem
    minValue: number,
    maxValue: number,
    customStyle: string,
    initValue = 0,
  ): Slider {
    return new Slider(
      orientation,
      length,
      sidePadding,
      minValue,
      maxValue,
      customStyle,
      initValue,
    );
  }

  public body: HTMLDivElement;
  private filler = new Ref<HTMLDivElement>();
  private cursor = new Ref<HTMLDivElement>();

  public constructor(
    private orientation: Orientation,
    length: string, // rem or percentage
    sidePadding: string, // rem
    private minValue: number,
    private maxValue: number,
    customStyle: string,
    initValue: number,
  ) {
    super();
    this.body = E.div(
      {
        class: "slider-input",
        style: `display: inline-block; padding: ${
          orientation === Orientation.HORIZONTAL
            ? sidePadding + " 0"
            : "0 " + sidePadding
        }; ${
          orientation === Orientation.HORIZONTAL ? "width" : "height"
        }: ${length}; ${
          orientation === Orientation.HORIZONTAL ? "height" : "width"
        }: .2rem; cursor: pointer; touch-action: none; ${customStyle}`,
      },
      E.div(
        {
          class: "slider-input-track",
          style: `position: relative; width: 100%; height: 100%; display: flex; flex-flow: ${
            orientation === Orientation.HORIZONTAL ? "row" : "column"
          } nowrap; justify-content: ${
            orientation === Orientation.HORIZONTAL ? "flex-start" : "flex-end"
          }; background-color: ${SCHEME.neutral2};`,
        },
        E.divRef(this.filler, {
          class: "slider-input-filler",
          style: `${
            orientation === Orientation.HORIZONTAL ? "height" : "width"
          }: 100%; background-color: ${SCHEME.neutral1};`,
        }),
        E.divRef(this.cursor, {
          class: "slider-input-cursor",
          style: `position: absolute; height: .8rem; width: .8rem; border-radius: .8rem; ${
            orientation === Orientation.HORIZONTAL ? "top" : "left"
          }: -.3rem; background-color: ${SCHEME.neutral1};`,
        }),
      ),
    );

    this.setValue(initValue);
    this.body.addEventListener("pointerdown", (event) =>
      this.startMoving(event),
    );
  }

  private startMoving(event: PointerEvent): void {
    this.body.addEventListener("pointermove", this.move);
    this.body.addEventListener("pointerup", this.stopMoving);
    this.body.setPointerCapture(event.pointerId);
    this.move(event);
  }

  private move = (event: PointerEvent): void => {
    let rect = this.body.getBoundingClientRect();
    let ratio: number;
    if (this.orientation === Orientation.HORIZONTAL) {
      ratio = Math.max(0, Math.min(1, (event.clientX - rect.x) / rect.width));
    } else {
      ratio = Math.max(
        0,
        Math.min(1, 1 - (event.clientY - rect.y) / rect.height),
      );
    }
    this.setRatio(ratio);
    this.emit("change", ratio * (this.maxValue - this.minValue));
  };

  private setRatio(ratio: number): void {
    if (this.orientation === Orientation.HORIZONTAL) {
      this.filler.val.style.width = `${ratio * 100}%`;
      this.cursor.val.style.left = `calc(${ratio * 100}% - .4rem)`;
    } else {
      this.filler.val.style.height = `${ratio * 100}%`;
      this.cursor.val.style.bottom = `calc(${ratio * 100}% - .4rem)`;
    }
  }

  private stopMoving = (event: PointerEvent): void => {
    this.body.removeEventListener("pointermove", this.move);
    this.body.removeEventListener("pointerup", this.stopMoving);
    this.body.releasePointerCapture(event.pointerId);
    this.move(event);
  };

  public setValue(value: number): void {
    this.setRatio((value - this.minValue) / (this.maxValue - this.minValue));
  }

  public remove(): void {
    this.body.remove();
  }
}
