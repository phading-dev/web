import EventEmitter = require("events");
import { SCHEME } from "./color_scheme";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface TextContentButton {
  on(event: "action", listener: () => void): this;
}

export class TextContentButton extends EventEmitter {
  public static create(
    label: string,
    value: string,
    customStyle: string = ""
  ): TextContentButton {
    return new TextContentButton(label, value, customStyle);
  }

  public body: HTMLDivElement;
  // Visible
  public clickable: HTMLDivElement;

  public constructor(label: string, value: string, customStyle: string) {
    super();
    let clickableRef = new Ref<HTMLDivElement>();
    this.body = E.div(
      {
        class: "text-content-button",
        style: `${customStyle} display: flex; flex-flow: column nowrap; gap: 1rem; align-items: flex-start;`,
      },
      E.div(
        {
          class: "text-content-label",
          style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
        },
        E.text(label)
      ),
      E.divRef(
        clickableRef,
        {
          class: "text-content-value",
          style: `width: 100%; line-height: 2rem; font-size: 1.4rem; ${
            value ? "" : "height: 2rem;"
          } color: ${SCHEME.neutral0}; border-bottom: .1rem dashed ${
            SCHEME.neutral1
          }; cursor: pointer;`,
        },
        E.text(value)
      )
    );
    this.clickable = clickableRef.val;

    this.clickable.addEventListener("click", () => this.emit("action"));
  }

  public click(): void {
    this.clickable.click();
  }

  public remove(): void {
    this.body.remove();
  }
}
