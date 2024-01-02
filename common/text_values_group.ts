import EventEmitter = require("events");
import { SCHEME } from "./color_scheme";
import { createArrowIcon } from "./icons";
import { E } from "@selfage/element/factory";

export interface TextValue {
  label: string;
  value?: string;
}

export interface TextValuesGroup {
  on(event: "action", listener: () => void): this;
}

export class TextValuesGroup extends EventEmitter {
  public static create(
    textValues: Array<TextValue>,
    customeStyle: string = ""
  ): TextValuesGroup {
    return new TextValuesGroup(textValues, customeStyle);
  }

  private body_: HTMLDivElement;

  public constructor(textValues: Array<TextValue>, customeStyle: string) {
    super();
    this.body_ = E.div(
      {
        class: "text-values-group",
        style: `display: flex; flex-flow: row nowrap; align-items: center; gap: 2rem; border: .1rem solid ${SCHEME.neutral1}; border-radius: .5rem; padding: 2rem; cursor: pointer; ${customeStyle}`,
      },
      E.div(
        {
          class: "text-values-group-lines",
          style: `flex: 1 0 0; display: flex; flex-flow: column nowrap; gap: 2rem;`,
        },
        ...this.createTextValueElement(textValues)
      ),
      E.div(
        {
          class: "text-values-group-edit-icon",
          style: `flex: 0 0 auto; height: 1.6rem; transform: rotate(180deg);`,
        },
        createArrowIcon(SCHEME.neutral1)
      )
    );

    this.body_.addEventListener("click", () => this.emit("action"));
  }

  private createTextValueElement(
    textValues: Array<TextValue>
  ): Array<HTMLDivElement> {
    let elements = new Array<HTMLDivElement>();
    for (let textValue of textValues) {
      elements.push(
        E.div(
          {
            class: "text-value",
            style: `width: 100%; display: flex; flex-flow: column nowrap; gap: 1rem;`,
          },
          E.div(
            {
              class: "text-content-label",
              style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
            },
            E.text(textValue.label)
          ),
          E.div(
            {
              class: "text-content-value",
              style: `width: 100%; line-height: 2rem; font-size: 1.4rem; ${
                textValue.value ? "" : "height: 2rem;"
              } color: ${SCHEME.neutral0}; border-bottom: .1rem solid ${
                SCHEME.neutral1
              };`,
            },
            E.text(textValue.value ?? "")
          )
        )
      );
    }
    return elements;
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
}
