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
  public body: HTMLButtonElement;
  private displayStyle: string;
  private cursorStyle: string;

  public constructor(customStyle: string, ...childNodes: Array<Node>) {
    super();
    this.body = E.button(
      {
        class: "blocking-button",
        style: customStyle,
        type: "button",
      },
      ...childNodes
    );
    this.displayStyle = this.body.style.display;
    this.cursorStyle = this.body.style.cursor;

    this.body.addEventListener("click", () => this.click());
  }

  public async click(): Promise<void> {
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

  public enable(): this {
    this.body.style.cursor = this.cursorStyle;
    this.enableOverride();
    return this;
  }
  protected abstract enableOverride(): void;

  public disable(): this {
    this.body.style.cursor = "not-allowed";
    this.disableOverride();
    return this;
  }
  protected abstract disableOverride(): void;

  public show(): this {
    this.body.style.display = this.displayStyle;
    return this;
  }

  public hide(): this {
    this.body.style.display = "none";
    return this;
  }

  public remove(): void {
    this.body.remove();
  }
}

export class FilledBlockingButton extends BlockingButton {
  public constructor(...childNodes: Array<Node>) {
    super(FILLED_BUTTON_STYLE, ...childNodes);
  }

  public static create(...childNodes: Array<Node>): FilledBlockingButton {
    return new FilledBlockingButton(...childNodes);
  }

  protected enableOverride(): void {
    this.body.style.backgroundColor = SCHEME.primary1;
  }

  protected disableOverride(): void {
    this.body.style.backgroundColor = SCHEME.primary2;
  }
}

export class OutlineBlockingButton extends BlockingButton {
  public constructor(...childNodes: Array<Node>) {
    super(OUTLINE_BUTTON_STYLE, ...childNodes);
  }

  public static create(...childNodes: Array<Node>): OutlineBlockingButton {
    return new OutlineBlockingButton(...childNodes);
  }

  protected enableOverride(): void {
    this.body.style.color = SCHEME.neutral0;
    this.body.style.borderColor = SCHEME.neutral1;
  }

  protected disableOverride(): void {
    this.body.style.color = SCHEME.neutral2;
    this.body.style.borderColor = SCHEME.neutral2;
  }
}

export class TextBlockingButton extends BlockingButton {
  public constructor(...childNodes: Array<Node>) {
    super(TEXT_BUTTON_STYLE, ...childNodes);
  }

  public static create(
    ...childNodes: Array<Node>
  ): TextBlockingButton {
    return new TextBlockingButton(...childNodes);
  }

  public init(): this {
    this.enable();
    return this;
  }

  protected enableOverride(): void {
    this.body.style.color = SCHEME.neutral0;
  }

  protected disableOverride(): void {
    this.body.style.color = SCHEME.neutral2;
  }
}
