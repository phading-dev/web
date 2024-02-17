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
    customDisable: () => void = () => {}
  ): IconButton {
    return new IconButton(
      customButtonStyle,
      iconElement,
      position,
      text,
      customEnable,
      customDisable
    );
  }

  private body_: HTMLButtonElement;
  private tooltip: HTMLDivElement;
  private displayStyle: string;
  private hoverObserver: HoverObserver;

  public constructor(
    customButtonStyle: string,
    iconElement: Element,
    position: TooltipPosition,
    text: string,
    private customEnable: () => void,
    private customDisable: () => void
  ) {
    super();
    let tooltipRef = new Ref<HTMLDivElement>();
    this.body_ = E.button(
      {
        class: "icon-button",
        style: `${NULLIFIED_BUTTON_STYLE} position: relative; ${customButtonStyle}`,
      },
      iconElement,
      E.divRef(
        tooltipRef,
        {
          class: "icon-button-tooltip",
          style: `position: absolute; justify-content: center; align-items: center; transition: opacity .3s 1s linear;`,
        },
        E.div(
          {
            class: "icon-button-tooltip-background",
            style: `background-color: ${SCHEME.neutral4}; box-shadow: 0 0 .3rem ${SCHEME.neutral1}; border-radius: ${BUTTON_BORDER_RADIUS}; padding: .6rem 1rem; color: ${SCHEME.neutral0}; font-size: ${FONT_M}rem; white-space: nowrap;`,
          },
          E.text(text)
        )
      )
    );
    this.tooltip = tooltipRef.val;
    this.displayStyle = this.body_.style.display;

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

    this.hoverObserver = HoverObserver.create(
      this.body_,
      Mode.HOVER_DELAY_LEAVE
    )
      .on("hover", () => this.showTootlip())
      .on("leave", () => this.hideTooltip());
    this.tooltip.addEventListener("transitionend", () =>
      this.emit("tooltipShowed")
    );
    this.body_.addEventListener("click", () => this.emit("action"));
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
    return this.body_;
  }

  public enable(): this {
    this.body_.disabled = false;
    this.body_.style.cursor = "pointer";
    this.customEnable();
    return this;
  }

  public disable(): this {
    this.body_.disabled = true;
    this.body_.style.cursor = "not-allowed";
    this.customDisable();
    return this;
  }

  public show(): this {
    this.body_.style.display = this.displayStyle;
    return this;
  }

  public hide(): this {
    this.body_.style.display = "none";
    return this;
  }

  public remove(): void {
    this.body_.remove();
  }

  // Visible for testing
  public click(): void {
    this.body_.click();
  }
  public hover(): void {
    this.hoverObserver.emit("hover");
  }
  public leave(): void {
    this.hoverObserver.emit("leave");
  }
}
