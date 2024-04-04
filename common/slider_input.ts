import EventEmitter = require("events");
import { SCHEME } from "./color_scheme";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export enum Orientation {
  VERTICAL = 1,
  HORIZONTAL = 2,
}

export interface Range {
  start: number; // Inclusive
  end: number; // Inclusive
}

export interface SliderInput {
  on(event: "change", listener: (value: number) => void): this;
}

export class SliderInput extends EventEmitter {
  public static create(
    orientation: Orientation,
    length: number, // rem,
    customStyle: string,
    range: Range,
    initValue = 0
  ): SliderInput {
    return new SliderInput(orientation, length, customStyle, range, initValue);
  }

  private body_: HTMLDivElement;
  private filler: HTMLDivElement;
  private cursor: HTMLDivElement;
  private isMoving = false;

  public constructor(
    private orientation: Orientation,
    length: number, // rem
    customStyle: string,
    private range: Range,
    initValue: number
  ) {
    super();
    let fillerRef = new Ref<HTMLDivElement>();
    let cursorRef = new Ref<HTMLDivElement>();
    this.body_ = E.div(
      {
        class: "slider-input",
        style: `display: inline-block; padding: ${
          orientation === Orientation.HORIZONTAL ? ".3rem 0" : "0 .3rem"
        }; cursor: pointer; ${customStyle}`,
      },
      E.div(
        {
          class: "slider-input-track",
          style: `position: relative; display: flex; flex-flow: ${
            orientation === Orientation.HORIZONTAL ? "row" : "column"
          } nowrap; justify-content: ${
            orientation === Orientation.HORIZONTAL ? "flex-start" : "flex-end"
          }; ${
            orientation === Orientation.HORIZONTAL ? "width" : "height"
          }: ${length}rem; ${
            orientation === Orientation.HORIZONTAL ? "height" : "width"
          }: .2rem; background-color: ${SCHEME.neutral2};`,
        },
        E.divRef(fillerRef, {
          class: "slider-input-filler",
          style: `${
            orientation === Orientation.HORIZONTAL ? "height" : "width"
          }: 100%; background-color: ${SCHEME.neutral1};`,
        }),
        E.divRef(cursorRef, {
          class: "slider-input-cursor",
          style: `position: absolute; height: .8rem; width: .8rem; border-radius: .8rem; ${
            orientation === Orientation.HORIZONTAL ? "top" : "left"
          }: -.3rem; background-color: ${SCHEME.neutral1};`,
        })
      )
    );
    this.filler = fillerRef.val;
    this.cursor = cursorRef.val;

    this.setValue(initValue);
    this.body_.addEventListener("pointerdown", (event) =>
      this.startMoving(event)
    );
    this.body_.addEventListener("pointermove", (event) => this.moving(event));
    this.body_.addEventListener("pointerup", () => this.stopMoving());
    this.body_.addEventListener("pointerout", () => this.stopMoving());
  }

  private startMoving(event: PointerEvent): void {
    this.isMoving = true;
    this.setPosition(event);
  }

  private setPosition(event: PointerEvent): void {
    let rect = this.body_.getBoundingClientRect();
    let ratio: number;
    if (this.orientation === Orientation.HORIZONTAL) {
      ratio = (event.screenX - rect.x) / rect.width;
    } else {
      ratio = 1 - (event.screenY - rect.y) / rect.height;
    }
    this.setRatio(ratio);
    this.emit("change", ratio * (this.range.end - this.range.start));
  }

  private setRatio(ratio: number): void {
    if (this.orientation === Orientation.HORIZONTAL) {
      this.filler.style.width = `${ratio * 100}%`;
      this.cursor.style.left = `calc(${ratio * 100}% - .4rem)`;
    } else {
      this.filler.style.height = `${ratio * 100}%`;
      this.cursor.style.bottom = `calc(${ratio * 100}% - .4rem)`;
    }
  }

  private moving(event: PointerEvent): void {
    if (!this.isMoving) {
      return;
    }
    this.setPosition(event);
  }

  private stopMoving(): void {
    this.isMoving = false;
  }

  public setValue(value: number): void {
    this.setRatio(value / (this.range.end - this.range.start));
  }

  public get body() {
    return this.body_;
  }

  public remove(): void {
    this.body_.remove();
  }
}
