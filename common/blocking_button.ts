import EventEmitter = require("events");
import {
  COMMON_FILLED_BUTTON_STYLE,
  COMMON_TEXT_BUTTON_STYLE,
} from "./button_styles";
import { SCHEME } from "./color_scheme";
import { E } from "@selfage/element/factory";

type ActionFn<Response> = () => Promise<Response>;
type PostActionFn<Response> = (response?: Response, error?: Error) => void;

export abstract class BlockingButton<Response = void> extends EventEmitter {
  protected container: HTMLButtonElement;
  private displayStyle: string;
  private cursorStyle: string;
  private action: ActionFn<Response>;
  private postAction: PostActionFn<Response>;

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
    let response: Response;
    try {
      response = await this.action();
    } catch (e) {
      this.enable();
      this.postAction(undefined, e as Error);
      return;
    }
    this.enable();
    this.postAction(response);
  }

  public append(...childNodes: Array<Node>): this {
    this.container.append(...childNodes);
    return this;
  }

  public addAction(
    action: ActionFn<Response>,
    postActionFn: PostActionFn<Response> = () => {},
  ): this {
    this.action = action;
    this.postAction = postActionFn;
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

export class FilledBlockingButton<
  Response = void,
> extends BlockingButton<Response> {
  public static create<Response = void>(
    customStyle: string,
  ): FilledBlockingButton<Response> {
    return new FilledBlockingButton<Response>(customStyle);
  }

  public constructor(customStyle: string) {
    super(`${COMMON_FILLED_BUTTON_STYLE} ${customStyle}`);
  }

  protected enableOverride(): void {
    this.container.style.backgroundColor = SCHEME.primary1;
    this.container.style.borderColor = SCHEME.primary1;
  }

  protected disableOverride(): void {
    this.container.style.backgroundColor = SCHEME.primary2;
    this.container.style.borderColor = SCHEME.primary2;
  }
}

export class OutlineBlockingButton<
  Response = void,
> extends BlockingButton<Response> {
  public static create<Response = void>(
    customStyle: string,
  ): OutlineBlockingButton<Response> {
    return new OutlineBlockingButton<Response>(customStyle);
  }

  public constructor(customStyle: string) {
    super(`${COMMON_FILLED_BUTTON_STYLE} ${customStyle}`);
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

export class TextBlockingButton<
  Response = void,
> extends BlockingButton<Response> {
  public static create<Response = void>(
    customStyle: string,
  ): TextBlockingButton<Response> {
    return new TextBlockingButton<Response>(customStyle);
  }

  public constructor(customStyle: string) {
    super(`${COMMON_TEXT_BUTTON_STYLE} ${customStyle}`);
  }

  protected enableOverride(): void {
    this.container.style.color = SCHEME.neutral0;
    // this.container.style.borderColor = SCHEME.neutral1;
  }

  protected disableOverride(): void {
    this.container.style.color = SCHEME.neutral2;
    // this.container.style.borderColor = SCHEME.neutral2;
  }
}
