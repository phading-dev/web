import EventEmitter = require("events");
import { SCHEME } from "./color_scheme";
import { createArrowIcon } from "./icons";
import { FONT_M, ICON_XS } from "./sizes";
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
    editable: boolean = true,
    customeStyle: string = "",
  ): TextValuesGroup {
    return new TextValuesGroup(textValues, editable, customeStyle);
  }

  private body_: HTMLDivElement;

  public constructor(
    textValues: Array<TextValue>,
    editable: boolean,
    customeStyle: string,
  ) {
    super();
    this.body_ = E.div(
      {
        class: "text-values-group",
        style: `display: flex; flex-flow: row nowrap; align-items: center; gap: 2rem; border: .1rem solid ${SCHEME.neutral1}; border-radius: .5rem; padding: 2rem; ${editable ? "cursor: pointer" : ""}; ${customeStyle}`,
      },
      E.div(
        {
          class: "text-values-group-lines",
          style: `flex: 1 1 0; min-width: 0; display: flex; flex-flow: column nowrap; gap: 2rem;`,
        },
        ...this.createTextValueElement(textValues),
      ),
      E.div(
        {
          class: "text-values-group-edit-icon",
          style: `flex: 0 0 auto; height: ${ICON_XS}rem; transform: rotate(180deg); visibility: ${editable ? "visible" : "hidden"};`,
        },
        createArrowIcon(SCHEME.neutral1),
      ),
    );

    if (editable) {
      this.body_.addEventListener("click", () => this.emit("action"));
    }
  }

  private createTextValueElement(
    textValues: Array<TextValue>,
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
              style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
            },
            E.text(textValue.label),
          ),
          E.div(
            {
              class: "text-content-value",
              style: `width: 100%; line-height: 2rem; font-size: ${FONT_M}rem; ${
                textValue.value ? "" : "height: 2rem;"
              } color: ${SCHEME.neutral0}; border-bottom: .1rem solid ${
                SCHEME.neutral1
              };`,
            },
            E.text(textValue.value ?? ""),
          ),
        ),
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
