import EventEmitter = require("events");
import { BUTTON_BORDER_RADIUS, NULLIFIED_BUTTON_STYLE } from "./button_styles";
import { SCHEME } from "./color_scheme";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export enum TooltipPosition {
  TOP,
  RIGHT,
  BOTTOM,
  LEFT,
}

export interface IconButton {
  on(event: "action", listener: () => void): this;
  on(event: "tooltipShowed", listener: () => void): this;
}

export class IconButton extends EventEmitter {
  public static create(
    customButtonStyle: string,
    svgElement: SVGSVGElement,
    position: TooltipPosition,
    text: string
  ): IconButton {
    return new IconButton(customButtonStyle, svgElement, position, text);
  }

  private container: HTMLElement;
  private tooltip: HTMLDivElement;
  private displayStyle: string;

  public constructor(
    customButtonStyle: string,
    svgElement: SVGSVGElement,
    position: TooltipPosition,
    text: string
  ) {
    super();
    let tooltipRef = new Ref<HTMLDivElement>();
    this.container = E.button(
      {
        class: "icon-button",
        style: `${NULLIFIED_BUTTON_STYLE} position: relative; cursor: pointer; ${customButtonStyle}`,
      },
      svgElement,
      E.divRef(
        tooltipRef,
        {
          class: "icon-button-tooltip",
          style: `position: absolute; justify-content: center; align-items: center; transition: opacity .3s 1s linear;`,
        },
        E.div(
          {
            class: "icon-button-tooltip-background",
            style: `background-color: ${SCHEME.neutral4}; border: .1rem solid ${SCHEME.neutral2}; border-radius: ${BUTTON_BORDER_RADIUS}; padding: .6rem 1rem; color: ${SCHEME.neutral0}; font-size: 1.4rem; white-space: nowrap;`,
          },
          E.text(text)
        )
      )
    );
    this.tooltip = tooltipRef.val;
    this.displayStyle = this.container.style.display;

    switch (position) {
      case TooltipPosition.TOP:
        this.tooltip.style.bottom = "100%";
        this.tooltip.style.marginBottom = ".5rem";
        this.tooltip.style.left = "0";
        this.tooltip.style.width = "100%";
        break;
      case TooltipPosition.RIGHT:
        this.tooltip.style.left = "100%";
        this.tooltip.style.marginLeft = ".5rem";
        this.tooltip.style.top = "0";
        this.tooltip.style.height = "100%";
        break;
      case TooltipPosition.BOTTOM:
        this.tooltip.style.top = "100%";
        this.tooltip.style.marginTop = ".5rem";
        this.tooltip.style.left = "0";
        this.tooltip.style.width = "100%";
        break;
      case TooltipPosition.LEFT:
        this.tooltip.style.right = "100%";
        this.tooltip.style.marginRight = ".5rem";
        this.tooltip.style.top = "0";
        this.tooltip.style.height = "100%";
        break;
    }
    this.hideTooltip();

    this.tooltip.addEventListener("transitionend", () =>
      this.emit("tooltipShowed")
    );
    this.container.addEventListener("mouseenter", () => this.showTootlip());
    this.container.addEventListener("mouseleave", () => this.hideTooltip());
    this.container.addEventListener("click", () => this.emit("action"));
  }

  private showTootlip(): void {
    this.tooltip.style.display = "flex";
    this.tooltip.clientHeight; // Force reflow.
    this.tooltip.style.opacity = "1";
  }

  private hideTooltip(): void {
    this.tooltip.style.display = "none";
    this.tooltip.style.opacity = "0";
  }

  public get body() {
    return this.container;
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

  // Visible for testing
  public click(): void {
    this.container.click();
  }
}
