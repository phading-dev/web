import EventEmitter = require("events");
import { BUTTON_BORDER_RADIUS, NULLIFIED_BUTTON_STYLE } from "./button_styles";
import { SCHEME } from "./color_scheme";
import { HoverObserver, Mode } from "./hover_observer";
import { FONT_M } from "./sizes";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export enum TooltipPosition {
  TOP,
  RIGHT,
  BOTTOM,
  LEFT,
}

export class IconWithTootlip {
  public body: HTMLButtonElement;
  public tooltip = new Ref<HTMLDivElement>();
  private displayStyle: string;

  public constructor(
    customButtonStyle: string,
    iconElement: Element,
    position: TooltipPosition,
    text: string,
  ) {
    this.body = E.button(
      {
        class: "icon-button",
        style: `${NULLIFIED_BUTTON_STYLE} position: relative; ${customButtonStyle}`,
      },
      iconElement,
      E.divRef(
        this.tooltip,
        {
          class: "icon-button-tooltip",
          style: `position: absolute; justify-content: center; align-items: center; transition: opacity .3s linear;`,
        },
        E.div(
          {
            class: "icon-button-tooltip-background",
            style: `background-color: ${SCHEME.neutral4}; box-shadow: 0 0 .3rem ${SCHEME.neutral1}; border-radius: ${BUTTON_BORDER_RADIUS}; padding: .6rem 1rem; color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem; white-space: nowrap;`,
          },
          E.text(text),
        ),
      ),
    );
    this.displayStyle = this.body.style.display;

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
}

export interface IconButton {
  on(event: "action", listener: () => void): this;
  on(event: "tooltipShowed", listener: () => void): this;
}

export class IconButton extends EventEmitter {
  public static create(
    customButtonStyle: string,
    iconElement: Element,
    position: TooltipPosition,
    text: string,
    customEnable: () => void = () => {},
    customDisable: () => void = () => {},
  ): IconButton {
    return new IconButton(
      customButtonStyle,
      iconElement,
      position,
      text,
      customEnable,
      customDisable,
    );
  }

  public body: HTMLButtonElement;
  private iconWithTooltip: IconWithTootlip;
  private hoverObserver: HoverObserver;

  public constructor(
    customButtonStyle: string,
    iconElement: Element,
    position: TooltipPosition,
    text: string,
    private customEnable: () => void,
    private customDisable: () => void,
  ) {
    super();
    this.iconWithTooltip = new IconWithTootlip(
      customButtonStyle,
      iconElement,
      position,
      text,
    );
    this.body = this.iconWithTooltip.body;

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
    this.customEnable();
    return this;
  }

  public disable(): this {
    this.body.disabled = true;
    this.body.style.cursor = "not-allowed";
    this.customDisable();
    return this;
  }

  public show(): this {
    this.iconWithTooltip.show();
    return this;
  }

  public hide(): this {
    this.iconWithTooltip.hide();
    return this;
  }

  public remove(): void {
    this.iconWithTooltip.remove();
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
    customButtonStyle: string,
    iconElement: Element,
    position: TooltipPosition,
    text: string,
  ): IconTooltipButton {
    return new IconTooltipButton(
      customButtonStyle,
      iconElement,
      position,
      text,
    );
  }

  public body: HTMLButtonElement;
  private iconWithTooltip: IconWithTootlip;

  public constructor(
    customButtonStyle: string,
    iconElement: Element,
    position: TooltipPosition,
    text: string,
  ) {
    super();
    this.iconWithTooltip = new IconWithTootlip(
      `cursor: pointer; ${customButtonStyle}`,
      iconElement,
      position,
      text,
    );
    this.body = this.iconWithTooltip.body;

    this.iconWithTooltip.tooltip.val.addEventListener("transitionend", () =>
      this.emit("tooltipShowed"),
    );
    this.body.addEventListener("click", () =>
      this.iconWithTooltip.toggleTooltip(),
    );
  }

  public show(): this {
    this.iconWithTooltip.show();
    return this;
  }

  public hide(): this {
    this.iconWithTooltip.hide();
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
