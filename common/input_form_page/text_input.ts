import EventEmitter = require("events");
import { SCHEME } from "../color_scheme";
import { COMMON_BASIC_INPUT_STYLE } from "../input_styles";
import { FONT_M, FONT_S, GAP_d_25X, LINE_HEIGHT_M, LINE_HEIGHT_S } from "../sizes";
import { InputField, ValidationResult } from "./input_field";
import { E, ElementAttributeMap } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export class TextInputWithErrorMsg extends EventEmitter implements InputField {
  public body: HTMLElement;
  private input = new Ref<HTMLInputElement>();
  private errorMsg = new Ref<HTMLDivElement>();
  private valid: boolean;

  public constructor(
    label: string,
    customStyle: string,
    otherInputAttributes: ElementAttributeMap,
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
        style: `flex: 0 0 auto; height: ${GAP_d_25X}rem;`,
      }),
      E.inputRef(this.input, {
        class: "text-input-input",
        style: `${COMMON_BASIC_INPUT_STYLE} width: 100%;`,
        ...otherInputAttributes,
      }),
      E.divRef(this.errorMsg, {
        class: "input-error-message",
        style: `position: absolute; right: 0; top: 100%; font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.error0};`,
      }),
    );

    this.input.val.addEventListener("keydown", (event) => this.keydown(event));
    this.input.val.addEventListener("input", () => this.validateInput());
  }

  private keydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.emit("action");
    }
  }

  private validateInput(): void {
    this.validate();
    this.emit("refresh");
  }

  private validate(): void {
    this.resetError();
    let value = this.input.val.value;
    let result = this.validateAndTakeFn(value);
    if (result.valid) {
      this.valid = true;
    } else {
      if (result.errorMsg) {
        this.input.val.style.borderColor = SCHEME.error0;
        this.errorMsg.val.textContent = result.errorMsg;
        this.errorMsg.val.style.display = "block";
      }
      this.valid = false;
    }
  }

  private resetError(): void {
    this.input.val.style.borderColor = SCHEME.neutral1;
    this.errorMsg.val.style.display = "none";
  }

  public enable(): this {
    this.input.val.disabled = false;
    this.validate();
    return this;
  }

  public disable(): this {
    this.input.val.disabled = true;
    this.input.val.style.borderColor = SCHEME.neutral2;
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
    this.input.val.value = value;
  }
  public focus(): void {
    this.input.val.focus();
  }
  public dispatchInput(): void {
    this.input.val.dispatchEvent(new Event("input"));
  }
  public dispatchEnter(): void {
    this.input.val.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter" }),
    );
  }
}
