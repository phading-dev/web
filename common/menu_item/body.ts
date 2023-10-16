import EventEmitter = require("events");
import { SCHEME } from "../color_scheme";
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

  public static MENU_ITEM_LENGTH = 5; // rem

  private container: HTMLDivElement;

  public constructor(icon: Element, padding: string, label: string) {
    super();
    this.container = E.div(
      {
        class: "menu-item",
        style: `display: flex; flex-flow: row nowrap; align-items: center; height: ${MenuItem.MENU_ITEM_LENGTH}rem; box-sizing: border-box; border: .1rem solid ${SCHEME.neutral2}; border-radius: ${MenuItem.MENU_ITEM_LENGTH}rem; background-color: ${SCHEME.neutral4}; transition: width .3s .5s linear; overflow: hidden; cursor: pointer;`,
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
          style: `margin: 0 1rem 0 .5rem; font-size: 1.6rem; line-height: ${MenuItem.MENU_ITEM_LENGTH}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(label)
      )
    );
    this.collapse();

    this.container.addEventListener("transitionend", () =>
      this.emit("transitionEnded")
    );
    this.container.addEventListener("mouseover", () => this.expand());
    this.container.addEventListener("mouseleave", () => this.collapse());
    this.container.addEventListener("click", () => this.emit("action"));
  }

  private expand(): void {
    this.container.style.width = `${this.container.scrollWidth}px`;
  }

  private collapse(): void {
    this.container.style.width = `${MenuItem.MENU_ITEM_LENGTH}rem`;
  }

  public get body() {
    return this.container;
  }

  public remove(): void {
    this.container.remove();
  }

  // Visible for testing
  public click(): void {
    this.container.click();
  }
}
