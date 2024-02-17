import EventEmitter = require("events");

export let HIDE_DELAY = 3000; // ms
export let SHOW_DELAY = 1000; // ms

export enum Mode {
  HOVER_DELAY_LEAVE,
  DELAY_HOVER_DELAY_LEAVE,
}

export interface HoverObserver {
  on(event: "hover", listener: () => void): this;
  on(event: "leave", listener: () => void): this;
}

export class HoverObserver extends EventEmitter {
  public static create(anchorElement: HTMLElement, mode: Mode): HoverObserver {
    return new HoverObserver(
      (callback, delay) => window.setTimeout(callback, delay),
      (id) => window.clearTimeout(id),
      anchorElement,
      mode
    );
  }

  private hideTimeoutId: number;
  private showTimeoutId: number;
  private shown: boolean;

  private hover: () => void;

  public constructor(
    private setTimeout: (callback: () => void, delay: number) => number,
    private clearTimeout: (id: number) => void,
    private anchorElement: HTMLElement,
    mode: Mode
  ) {
    super();
    this.anchorElement.addEventListener("pointerover", () => this.hover());
    this.anchorElement.addEventListener("pointermove", () => this.hover());
    this.anchorElement.addEventListener("pointerdown", () => this.hover());
    this.anchorElement.addEventListener("keydown", () => this.hover());
    this.anchorElement.addEventListener("pointerout", () => this.cancelHover());

    if (mode === Mode.HOVER_DELAY_LEAVE) {
      this.hover = this.hoverImmediate;
    } else {
      this.hover = this.hoverDelayed;
    }
  }

  private hoverImmediate(): void {
    if (!this.shown) {
      this.emit("hover");
      this.shown = true;
    }
    this.showTimeoutId = undefined;
    this.clearTimeout(this.hideTimeoutId);
    this.hideTimeoutId = this.setTimeout(() => this.leave(), HIDE_DELAY);
  }

  private hoverDelayed(): void {
    if (!this.shown) {
      if (!this.showTimeoutId) {
        this.showTimeoutId = this.setTimeout(
          () => this.hoverImmediate(),
          SHOW_DELAY
        );
      }
    } else {
      this.clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = this.setTimeout(() => this.leave(), HIDE_DELAY);
    }
  }

  private cancelHover(): void {
    this.clearTimeout(this.showTimeoutId);
    this.showTimeoutId = undefined;
  }

  private leave(): void {
    if (this.shown) {
      this.emit("leave");
      this.shown = false;
    }
  }
}
