import { SCHEME } from "./color_scheme";
import { createArrowIcon } from "./icons";
import {
  BORDER_RADIUS_S,
  BORDER_WIDTH_1,
  FONT_M,
  FONT_WEIGHT_600,
  GAP_1_25X,
  ICON_BUTTON_M,
  ICON_XL,
  LINE_HEIGHT_FOR_BUTTON_M,
} from "./sizes";
import { E } from "@selfage/element/factory";

export let BUTTON_BORDER_RADIUS = BORDER_RADIUS_S;
export let NULLIFIED_BUTTON_STYLE = `padding: 0; margin: 0; outline: none; border: 0; background-color: initial;`;
export let COMMENT_BUTTON_WITHOUT_BORDER_STYLE = `${NULLIFIED_BUTTON_STYLE} flex: 0 0 auto; font-size: ${FONT_M}rem; font-weight: ${FONT_WEIGHT_600}; line-height: ${LINE_HEIGHT_FOR_BUTTON_M}rem; padding: 0 ${GAP_1_25X}rem; box-sizing: border-box;`;
export let COMMON_BUTTON_STYLE = `${COMMENT_BUTTON_WITHOUT_BORDER_STYLE} border: ${BORDER_WIDTH_1}rem solid transparent; border-radius: ${BUTTON_BORDER_RADIUS}rem;`;
export let COMMON_FILLED_BUTTON_STYLE = `${COMMON_BUTTON_STYLE} color: ${SCHEME.primaryContrast0};`;

// Needs font-size.
export let CLICKABLE_TEXT_STYLE = `color: ${SCHEME.link}; cursor: pointer; text-decoration: underline;`;

export abstract class Button {
  public body: HTMLButtonElement;
  protected displayStyle: string;
  protected action: () => void;

  public constructor(customStyle: string = "") {
    this.body = E.button({
      class: "button",
      style: `${customStyle}`,
      type: "button",
    });
    this.displayStyle = this.body.style.display;
    this.body.addEventListener("click", () => this.action());
  }

  public abstract enable(): this;
  public abstract disable(): this;

  public append(...childNodes: Array<Node>): this {
    this.body.append(...childNodes);
    return this;
  }

  public clear(): this {
    while (this.body.lastChild) {
      this.body.lastChild.remove();
    }
    return this;
  }

  public addAction(action: () => void): this {
    this.action = action;
    return this;
  }

  public clearAction(): this {
    this.action = () => {};
    return this;
  }

  public click(): void {
    this.body.click();
  }

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

export class FilledButton extends Button {
  public constructor(customStyle: string = "") {
    super(`${COMMON_FILLED_BUTTON_STYLE} ${customStyle}`);
    this.enable();
  }

  public enable(): this {
    this.body.style.cursor = "pointer";
    this.body.style.backgroundColor = SCHEME.primary1;
    this.body.style.borderColor = SCHEME.primary1;
    this.body.disabled = false;
    return this;
  }

  public disable(): this {
    this.body.style.cursor = "not-allowed";
    this.body.style.backgroundColor = SCHEME.primary2;
    this.body.style.borderColor = SCHEME.primary2;
    this.body.disabled = true;
    return this;
  }
}

export class OutlineButton extends Button {
  public constructor(customStyle: string = "") {
    super(`${COMMON_BUTTON_STYLE} ${customStyle}`);
    this.enable();
  }

  public enable(): this {
    this.body.style.cursor = "pointer";
    this.body.style.color = SCHEME.neutral0;
    this.body.style.borderColor = SCHEME.neutral1;
    this.body.disabled = false;
    return this;
  }

  public disable(): this {
    this.body.style.cursor = "not-allowed";
    this.body.style.color = SCHEME.neutral2;
    this.body.style.borderColor = SCHEME.neutral2;
    this.body.disabled = true;
    return this;
  }
}

export class TextButton extends Button {
  public constructor(customStyle: string = "") {
    super(`${COMMON_BUTTON_STYLE} ${customStyle}`);
    this.enable();
  }

  public enable(): this {
    this.body.style.cursor = "pointer";
    this.body.style.color = SCHEME.neutral0;
    this.body.disabled = false;
    return this;
  }

  public disable(): this {
    this.body.style.cursor = "not-allowed";
    this.body.style.color = SCHEME.neutral2;
    this.body.disabled = true;
    return this;
  }
}

export class IconButton extends Button {
  public constructor(
    buttonSize: number,
    iconSize: number,
    svg: SVGSVGElement,
    customStyle: string = "",
  ) {
    super(
      `${NULLIFIED_BUTTON_STYLE} flex: 0 0 auto; width: ${buttonSize}rem; height: ${buttonSize}rem; padding: ${(buttonSize - iconSize) / 2}rem; box-sizing: border-box; ${customStyle}`,
    );
    this.append(svg).enable();
  }

  public enable(): this {
    this.body.style.cursor = "pointer";
    this.body.style.color = SCHEME.neutral1;
    this.body.disabled = false;
    return this;
  }

  public disable(): this {
    this.body.style.cursor = "not-allowed";
    this.body.style.color = SCHEME.neutral2;
    this.body.disabled = true;
    return this;
  }
}

export class BlockingButton<Response = void> {
  private action: () => Promise<Response>;
  private postAction: (error?: Error, response?: Response) => void;

  public constructor(private button: Button) {
    this.button.addAction(() => this.handleAction());
  }

  public get body() {
    return this.button.body;
  }

  public addAction(
    action: () => Promise<Response>,
    postActionFn: (error?: Error, response?: Response) => void = () => {},
  ): this {
    this.action = action;
    this.postAction = postActionFn;
    return this;
  }

  private async handleAction(): Promise<void> {
    this.disable();
    let response: Response;
    try {
      response = await this.action();
    } catch (e) {
      this.enable();
      this.postAction(e as Error);
      return;
    }
    this.enable();
    this.postAction(undefined, response);
  }

  public enable(): this {
    this.button.enable();
    return this;
  }

  public disable(): this {
    this.button.disable();
    return this;
  }

  public click(): void {
    this.button.click();
  }

  public show(): this {
    this.button.show();
    return this;
  }

  public hide(): this {
    this.button.hide();
    return this;
  }

  public remove(): void {
    this.button.remove();
  }
}

export function createBackButton(customStyle = ""): IconButton {
  return new IconButton(
    ICON_BUTTON_M,
    ICON_XL,
    createArrowIcon(SCHEME.neutral1),
    `position: absolute; top: 0; left: 0; ${customStyle}`,
  );
}
