import EventEmitter = require("events");
import { SCHEME } from "../color_scheme";
import { HoverObserver, Mode } from "../hover_observer";
import { FONT_L, ICON_M } from "../sizes";
import { E } from "@selfage/element/factory";

export interface MenuItem {
  on(event: "transitionEnded", listener: () => void): this;
  on(event: "action", listener: () => void): this;
}

export class MenuItem extends EventEmitter {
  public static create(
    icon: Element,
    padding: string,
    label: string
  ): MenuItem {
    return new MenuItem(icon, padding, label);
  }

  public static MENU_ITEM_LENGTH = ICON_M; // rem

  private body_: HTMLDivElement;
  private hoverObserver: HoverObserver;

  public constructor(icon: Element, padding: string, label: string) {
    super();
    this.body_ = E.div(
      {
        class: "menu-item",
        style: `display: flex; flex-flow: row nowrap; align-items: center; height: ${MenuItem.MENU_ITEM_LENGTH}rem; box-sizing: border-box; border: .1rem solid ${SCHEME.neutral1}; border-radius: ${MenuItem.MENU_ITEM_LENGTH}rem; background-color: ${SCHEME.neutral4}; transition: width .3s .5s linear; overflow: hidden; cursor: pointer;`,
      },
      E.div(
        {
          class: "menu-item-icon",
          style: `height: 100%; padding: ${padding}; box-sizing: border-box;`,
        },
        icon
      ),
      E.div(
        {
          class: "menu-item-label",
          style: `margin: 0 1rem 0 .5rem; font-size: ${FONT_L}rem; line-height: ${MenuItem.MENU_ITEM_LENGTH}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(label)
      )
    );
    this.collapse();

    this.hoverObserver = HoverObserver.create(
      this.body_,
      Mode.DELAY_HOVER_DELAY_LEAVE
    )
      .on("hover", () => this.expand())
      .on("leave", () => this.collapse());
    this.body_.addEventListener("transitionend", () =>
      this.emit("transitionEnded")
    );
    this.body_.addEventListener("click", () => this.emit("action"));
  }

  private expand(): void {
    this.body_.style.width = `${this.body_.scrollWidth}px`;
  }

  private collapse(): void {
    this.body_.style.width = `${MenuItem.MENU_ITEM_LENGTH}rem`;
  }

  public get body() {
    return this.body_;
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
