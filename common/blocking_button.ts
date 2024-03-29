import EventEmitter = require("events");
import {
  FILLED_BUTTON_STYLE,
  OUTLINE_BUTTON_STYLE,
  TEXT_BUTTON_STYLE,
} from "./button_styles";
import { SCHEME } from "./color_scheme";
import { E } from "@selfage/element/factory";

export interface BlockingButton {
  on(event: "action", listener: () => Promise<void>): this;
  on(event: "postAction", listener: (error?: Error) => void): this;
}

export abstract class BlockingButton extends EventEmitter {
  protected container: HTMLButtonElement;
  private displayStyle: string;
  private cursorStyle: string;

  public constructor(customStyle: string) {
    super();
    this.container = E.button({
      class: "blocking-button",
      style: customStyle,
      type: "button",
    });
    this.displayStyle = this.container.style.display;
    this.cursorStyle = this.container.style.cursor;

    this.container.addEventListener("click", () => this.handleClick());
  }

  private async handleClick(): Promise<void> {
    this.disable();
    try {
      await Promise.all(this.listeners("action").map((callback) => callback()));
    } catch (e) {
      this.enable();
      this.emit("postAction", e);
      return;
    }
    this.enable();
    this.emit("postAction");
  }

  public append(...childNodes: Array<Node>): this {
    this.container.append(...childNodes);
    return this;
  }

  public get body() {
    return this.container;
  }

  public enable(): this {
    this.container.style.cursor = this.cursorStyle;
    this.container.disabled = false;
    this.enableOverride();
    return this;
  }
  protected abstract enableOverride(): void;

  public disable(): this {
    this.container.style.cursor = "not-allowed";
    this.container.disabled = true;
    this.disableOverride();
    return this;
  }
  protected abstract disableOverride(): void;

  public click(): void {
    this.container.click();
  }

  public show(): this {
    this.container.style.display = this.displayStyle;
    return this;
  }

  public hide(): this {
    this.container.style.display = "none";
    return this;
  }

  public remove(): void {
    this.container.remove();
  }
}

export class FilledBlockingButton extends BlockingButton {
  public static create(customStyle: string): FilledBlockingButton {
    return new FilledBlockingButton(customStyle);
  }

  public constructor(customStyle: string) {
    super(`${FILLED_BUTTON_STYLE} ${customStyle}`);
  }

  protected enableOverride(): void {
    this.container.style.backgroundColor = SCHEME.primary1;
  }

  protected disableOverride(): void {
    this.container.style.backgroundColor = SCHEME.primary2;
  }
}

export class OutlineBlockingButton extends BlockingButton {
  public static create(customStyle: string): OutlineBlockingButton {
    return new OutlineBlockingButton(customStyle);
  }

  public constructor(customStyle: string) {
    super(`${OUTLINE_BUTTON_STYLE} ${customStyle}`);
  }

  protected enableOverride(): void {
    this.container.style.color = SCHEME.neutral0;
    this.container.style.borderColor = SCHEME.neutral1;
  }

  protected disableOverride(): void {
    this.container.style.color = SCHEME.neutral2;
    this.container.style.borderColor = SCHEME.neutral2;
  }
}

export class TextBlockingButton extends BlockingButton {
  public static create(customStyle: string): TextBlockingButton {
    return new TextBlockingButton(customStyle);
  }

  public constructor(customStyle: string) {
    super(`${TEXT_BUTTON_STYLE} ${customStyle}`);
  }

  protected enableOverride(): void {
    this.container.style.color = SCHEME.neutral0;
  }

  protected disableOverride(): void {
    this.container.style.color = SCHEME.neutral2;
  }
}
