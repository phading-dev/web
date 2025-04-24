import EventEmitter = require("events");
import { BlockingButton } from "./blocking_button";
import { BUTTON_BORDER_RADIUS, NULLIFIED_BUTTON_STYLE } from "./button_styles";
import { SCHEME } from "./color_scheme";
import { HoverObserver, Mode } from "./hover_observer";
import { createArrowIcon } from "./icons";
import { LOCALIZED_TEXT } from "./locales/localized_text";
import { FONT_M, ICON_BUTTON_L, ICON_XL } from "./sizes";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export enum TooltipPosition {
  TOP,
  RIGHT,
  BOTTOM,
  LEFT,
}

export class IconWithTootlip {
  public body: HTMLDivElement;
  public tooltip = new Ref<HTMLDivElement>();

  public constructor(
    size: number, // rem
    padding: number, // rem
    customStyle: string,
    iconElement: Element, // SVG needs to use "fill: currentColor;".
    position: TooltipPosition,
    text: string,
  ) {
    this.body = E.div(
      {
        class: "icon-with-tooltip",
        style: `position: relative; box-sizing: border-box; padding: ${padding}rem; width: ${size}rem; height: ${size}rem; ${customStyle}`,
      },
      iconElement,
      E.divRef(
        this.tooltip,
        {
          class: "icon-tooltip",
          style: `position: absolute; justify-content: center; align-items: center; transition: opacity .2s;`,
        },
        E.div(
          {
            class: "icon-tooltip-centered",
            style: `background-color: ${SCHEME.neutral4}; box-shadow: 0 0 .3rem ${SCHEME.neutral1}; border-radius: ${BUTTON_BORDER_RADIUS}; padding: .6rem 1rem; color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem; white-space: nowrap;`,
          },
          E.text(text),
        ),
      ),
    );

    switch (position) {
      case TooltipPosition.TOP:
        this.tooltip.val.style.bottom = "100%";
        this.tooltip.val.style.marginBottom = ".5rem";
        this.tooltip.val.style.left = "0";
        this.tooltip.val.style.width = "100%";
        break;
      case TooltipPosition.RIGHT:
        this.tooltip.val.style.left = "100%";
        this.tooltip.val.style.marginLeft = ".5rem";
        this.tooltip.val.style.top = "0";
        this.tooltip.val.style.height = "100%";
        break;
      case TooltipPosition.BOTTOM:
        this.tooltip.val.style.top = "100%";
        this.tooltip.val.style.marginTop = ".5rem";
        this.tooltip.val.style.left = "0";
        this.tooltip.val.style.width = "100%";
        break;
      case TooltipPosition.LEFT:
        this.tooltip.val.style.right = "100%";
        this.tooltip.val.style.marginRight = ".5rem";
        this.tooltip.val.style.top = "0";
        this.tooltip.val.style.height = "100%";
        break;
    }
    this.hideTooltip();
  }

  public toggleTooltip(): void {
    if (this.tooltip.val.style.display === "none") {
      this.showTootlip();
    } else {
      this.hideTooltip();
    }
  }

  public showTootlip(): void {
    this.tooltip.val.style.display = "flex";
    this.tooltip.val.clientHeight; // Force reflow.
    this.tooltip.val.style.opacity = "1";
  }

  public hideTooltip(): void {
    this.tooltip.val.style.display = "none";
    this.tooltip.val.style.opacity = "0";
  }

  public enable(): this {
    this.body.style.color = SCHEME.neutral1;
    return this;
  }

  public disable(): this {
    this.body.style.color = SCHEME.neutral2;
    return this;
  }

  public remove(): void {
    this.body.remove();
  }

  // Visible for testing
  public click(): void {
    this.body.click();
  }
}

export interface IconButton {
  on(event: "action", listener: () => void): this;
  on(event: "tooltipShowed", listener: () => void): this;
}

export class IconButton extends EventEmitter {
  public static create(
    size: number, // rem
    padding: number, // rem
    customStyle: string,
    iconElement: Element,
    position: TooltipPosition,
    text: string,
  ): IconButton {
    return new IconButton(
      size,
      padding,
      customStyle,
      iconElement,
      position,
      text,
    );
  }

  public body: HTMLButtonElement;
  private iconWithTooltip: IconWithTootlip;
  private displayStyle: string;
  private hoverObserver: HoverObserver;

  public constructor(
    size: number,
    padding: number,
    customStyle: string,
    iconElement: Element,
    position: TooltipPosition,
    text: string,
  ) {
    super();
    this.iconWithTooltip = new IconWithTootlip(
      size,
      padding,
      "",
      iconElement,
      position,
      text,
    );
    this.body = E.button(
      {
        class: "icon-button",
        style: `${NULLIFIED_BUTTON_STYLE} ${customStyle}`,
        type: "button",
      },
      this.iconWithTooltip.body,
    );
    this.displayStyle = this.body.style.display;

    this.hoverObserver = HoverObserver.create(
      this.body,
      Mode.DELAY_HOVER_DELAY_LEAVE,
    )
      .on("hover", () => this.iconWithTooltip.showTootlip())
      .on("leave", () => this.iconWithTooltip.hideTooltip());
    this.iconWithTooltip.tooltip.val.addEventListener("transitionend", () =>
      this.emit("tooltipShowed"),
    );
    this.body.addEventListener("click", () => this.emit("action"));
  }

  public enable(): this {
    this.body.disabled = false;
    this.body.style.cursor = "pointer";
    this.iconWithTooltip.enable();
    return this;
  }

  public disable(): this {
    this.body.disabled = true;
    this.body.style.cursor = "not-allowed";
    this.iconWithTooltip.disable();
    return this;
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

  // Visible for testing
  public click(): void {
    this.body.click();
  }
  public hover(): void {
    this.hoverObserver.emit("hover");
  }
  public leave(): void {
    this.hoverObserver.emit("leave");
  }
}

export interface IconTooltipButton {
  on(event: "tooltipShowed", listener: () => void): this;
}

export class IconTooltipButton extends EventEmitter {
  public static create(
    size: number, // rem
    padding: number, // rem
    customStyle: string,
    iconElement: Element,
    position: TooltipPosition,
    text: string,
  ): IconTooltipButton {
    return new IconTooltipButton(
      size,
      padding,
      customStyle,
      iconElement,
      position,
      text,
    );
  }

  public body: HTMLButtonElement;
  private iconWithTooltip: IconWithTootlip;

  public constructor(
    size: number,
    padding: number,
    customStyle: string,
    iconElement: Element,
    position: TooltipPosition,
    text: string,
  ) {
    super();
    this.iconWithTooltip = new IconWithTootlip(
      size,
      padding,
      "",
      iconElement,
      position,
      text,
    ).enable();
    this.body = E.button(
      {
        class: "icon-tooltip-button",
        style: `${NULLIFIED_BUTTON_STYLE} cursor: pointer; ${customStyle}`,
        type: "button",
      },
      this.iconWithTooltip.body,
    );

    this.iconWithTooltip.tooltip.val.addEventListener("transitionend", () =>
      this.emit("tooltipShowed"),
    );
    this.body.addEventListener("click", () =>
      this.iconWithTooltip.toggleTooltip(),
    );
  }

  public remove(): void {
    this.body.remove();
  }

  // Visible for testing
  public click(): void {
    this.body.click();
  }
}

export interface BlockingIconButton {
  on(event: "tooltipShowed", listener: () => void): this;
}

export class BlockingIconButton<
  Response = void,
> extends BlockingButton<Response> {
  public static create<Response = void>(
    size: number, // rem
    padding: number, // rem
    customStyle: string,
    iconElement: Element, // SVG needs to use "fill: currentColor;".
    position: TooltipPosition,
    text: string,
  ) {
    return new BlockingIconButton<Response>(
      size,
      padding,
      customStyle,
      iconElement,
      position,
      text,
    );
  }

  private iconWithTooltip: IconWithTootlip;
  private hoverObserver: HoverObserver;

  public constructor(
    size: number,
    padding: number,
    customStyle: string,
    iconElement: Element, // SVG needs to use "fill: currentColor;".
    position: TooltipPosition,
    text: string,
  ) {
    super(`${NULLIFIED_BUTTON_STYLE} cursor: pointer; ${customStyle}`);
    this.iconWithTooltip = new IconWithTootlip(
      size,
      padding,
      "",
      iconElement,
      position,
      text,
    );
    this.append(this.iconWithTooltip.body);

    this.hoverObserver = HoverObserver.create(
      this.body,
      Mode.DELAY_HOVER_DELAY_LEAVE,
    )
      .on("hover", () => this.iconWithTooltip.showTootlip())
      .on("leave", () => this.iconWithTooltip.hideTooltip());
    this.iconWithTooltip.tooltip.val.addEventListener("transitionend", () =>
      this.emit("tooltipShowed"),
    );
  }

  protected enableOverride(): void {
    this.container.style.color = SCHEME.neutral1;
    this.iconWithTooltip.enable();
  }

  protected disableOverride(): void {
    this.container.style.color = SCHEME.neutral2;
    this.iconWithTooltip.disable();
  }

  // Visible for testing
  public hover(): void {
    this.hoverObserver.emit("hover");
  }
  public leave(): void {
    this.hoverObserver.emit("leave");
  }
}

export function createBackButton(customStyle = ""): IconButton {
  return IconButton.create(
    ICON_BUTTON_L,
    (ICON_BUTTON_L - ICON_XL) / 2,
    `position: absolute; top: 0; left: 0; ${customStyle}`,
    createArrowIcon(SCHEME.neutral1),
    TooltipPosition.RIGHT,
    LOCALIZED_TEXT.backLabel,
  );
}
