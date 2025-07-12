import EventEmitter = require("events");
import { SCHEME } from "../color_scheme";
import { NULLIFIED_INPUT_STYLE } from "../input_styles";
import { FONT_M, FONT_S } from "../sizes";
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
        style: `display: flex; flex-flow: column nowrap; ${customStyle}`,
      },
      E.div(
        {
          class: "text-input-label",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(label),
      ),
      E.div({
        style: `flex: 0 0 auto; height: 1rem;`,
      }),
      E.textareaRef(
        this.textAreaInput,
        {
          class: "text-input-input",
          style: `${NULLIFIED_INPUT_STYLE} font-size: ${FONT_M}rem; color: ${SCHEME.neutral0}; border-bottom: .1rem solid; line-height: 120%; width: 100%;`,
          rows: "3",
          ...otherInputAttributes,
        },
        E.text(value),
      ),
      E.div({
        style: `flex: 0 0 auto; height: .5rem;`,
      }),
      E.divRef(
        this.errorMsg,
        {
          class: "input-error-message",
          style: `align-self: flex-end; font-size: ${FONT_S}rem; color: ${SCHEME.error0};`,
        },
        E.text("1"),
      ),
    );

    this.textAreaInput.val.addEventListener("input", () =>
      this.validateInput(),
    );
  }

  private validateInput(): void {
    this.validate();
    this.emit("refresh");
  }

  public validate(): void {
    this.resetError();
    let value = this.textAreaInput.val.value;
    let result = this.validateAndTakeFn(value);
    if (result.valid) {
      this.valid = true;
    } else {
      if (result.errorMsg) {
        this.textAreaInput.val.style.borderColor = SCHEME.error0;
        this.errorMsg.val.textContent = result.errorMsg;
        this.errorMsg.val.style.visibility = "visible";
      }
      this.valid = false;
    }
  }

  private resetError(): void {
    this.textAreaInput.val.style.borderColor = SCHEME.neutral1;
    this.errorMsg.val.style.visibility = "hidden";
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
