import EventEmitter = require("events");
import { SCHEME } from "../color_scheme";
import {
  INPUT_BORDER_RADIUS,
  INPUT_SIDE_PADDING,
  NULLIFIED_INPUT_STYLE,
} from "../input_styles";
import { BORDER_WIDTH_1, FONT_M, FONT_S, GAP_0_25X, GAP_0_5X, LINE_HEIGHT_M, LINE_HEIGHT_S } from "../sizes";
import { InputField, ValidationResult } from "./input_field";
import { E, ElementAttributeMap } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export class TextAreaInputWithErrorMsg
  extends EventEmitter
  implements InputField
{
  public body: HTMLElement;
  protected textAreaInput = new Ref<HTMLTextAreaElement>();
  private errorMsg = new Ref<HTMLDivElement>();
  private valid: boolean;

  public constructor(
    label: string,
    customStyle: string,
    otherInputAttributes: ElementAttributeMap,
    value: string,
    private validateAndTakeFn: (value: string) => ValidationResult,
  ) {
    super();
    this.body = E.div(
      {
        class: "text-input",
        style: `position: relative; display: flex; flex-flow: column nowrap; ${customStyle}`,
      },
      E.div(
        {
          class: "text-input-label",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(label),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_0_25X}rem;`,
      }),
      E.textareaRef(
        this.textAreaInput,
        {
          class: "text-input-input",
          style: `${NULLIFIED_INPUT_STYLE} font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0}; color-scheme: ${SCHEME.name}; border: ${BORDER_WIDTH_1}rem solid; border-radius: ${INPUT_BORDER_RADIUS}rem; padding: ${GAP_0_5X}rem ${INPUT_SIDE_PADDING}rem; width: 100%; box-sizing: border-box;`,
          rows: "3",
          ...otherInputAttributes,
        },
        E.text(value),
      ),
      E.divRef(this.errorMsg, {
        class: "input-error-message",
        style: `position: absolute; right: 0; top: 100%; font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.bad0};`,
      }),
    );

    this.textAreaInput.val.addEventListener("input", () =>
      this.validateInput(),
    );
  }

  private validateInput(): void {
    this.validate();
    this.emit("refresh");
  }

  private validate(): void {
    this.resetError();
    let value = this.textAreaInput.val.value;
    let result = this.validateAndTakeFn(value);
    if (result.valid) {
      this.valid = true;
    } else {
      if (result.errorMsg) {
        this.textAreaInput.val.style.borderColor = SCHEME.bad1;
        this.errorMsg.val.textContent = result.errorMsg;
        this.errorMsg.val.style.display = "block";
      }
      this.valid = false;
    }
  }

  private resetError(): void {
    this.textAreaInput.val.style.borderColor = SCHEME.neutral1;
    this.errorMsg.val.style.display = "none";
  }

  public enable(): this {
    this.textAreaInput.val.disabled = false;
    this.validate();
    return this;
  }

  public disable(): this {
    this.textAreaInput.val.disabled = true;
    this.textAreaInput.val.style.borderColor = SCHEME.neutral2;
    this.errorMsg.val.style.display = "none";
    return this;
  }

  public get isValid() {
    return this.valid;
  }

  public remove(): void {
    this.body.remove();
  }

  // Visible for testing
  public set value(value: string) {
    this.textAreaInput.val.value = value;
  }
  public focus(): void {
    this.textAreaInput.val.focus();
  }
  public dispatchInput(): void {
    this.textAreaInput.val.dispatchEvent(new Event("input"));
  }
}
