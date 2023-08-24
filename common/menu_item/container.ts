import EventEmitter = require("events");
import { SCHEME } from "../../common/color_scheme";
import { E } from "@selfage/element/factory";

export interface MenuItem {
  on(event: "transitionEnded", listener: () => void): this;
  on(event: "action", listener: () => void): this;
}

export class MenuItem extends EventEmitter {
  public static MENU_ITEM_LENGTH = 5; // rem

  public body: HTMLDivElement;

  public constructor(icon: Element, padding: string, label: string) {
    super();
    this.body = E.div(
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

    this.body.addEventListener("transitionend", () =>
      this.emit("transitionEnded")
    );
    this.body.addEventListener("mouseover", () => this.expand());
    this.body.addEventListener("mouseleave", () => this.collapse());
    this.body.addEventListener("click", () => this.emit("action"));
  }

  public static create(
    icon: Element,
    padding: string,
    label: string
  ): MenuItem {
    return new MenuItem(icon, padding, label);
  }

  private expand(): void {
    this.body.style.width = `${this.body.scrollWidth}px`;
  }

  private collapse(): void {
    this.body.style.width = `${MenuItem.MENU_ITEM_LENGTH}rem`;
  }

  public remove(): void {
    this.body.remove();
  }

  public click(): void {
    this.body.click();
  }
}
