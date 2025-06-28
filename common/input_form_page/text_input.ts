import EventEmitter = require("events");
import { SCHEME } from "../color_scheme";
import { COMMON_BASIC_INPUT_STYLE } from "../input_styles";
import { FONT_M, FONT_S } from "../sizes";
import { InputField, ValidationResult } from "./input_field";
import { E, ElementAttributeMap } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export class TextInputWithErrorMsg extends EventEmitter implements InputField {
  public body: HTMLElement;
  private input = new Ref<HTMLInputElement>();
  private errorMsg = new Ref<HTMLDivElement>();
  private valid: boolean = false;

  public constructor(
    label: string,
    customStyle: string,
    otherInputAttributes: ElementAttributeMap,
    private validateAndTakeFn: (
      value: string,
    ) => Promise<ValidationResult> | ValidationResult,
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
        style: `flex: 0 0 auto; height: .5rem;`,
      }),
      E.inputRef(this.input, {
        class: "text-input-input",
        style: `${COMMON_BASIC_INPUT_STYLE} width: 100%;`,
        ...otherInputAttributes,
      }),
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

    this.input.val.addEventListener("keydown", (event) => this.keydown(event));
    this.input.val.addEventListener("input", () => this.validate());
  }

  private keydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.emit("action");
    }
  }

  public async validate(): Promise<void> {
    this.resetError();
    let value = this.input.val.value;
    let result = await this.validateAndTakeFn(value);
    if (result.valid) {
      this.valid = true;
    } else {
      if (result.errorMsg) {
        this.input.val.style.borderColor = SCHEME.error0;
        this.errorMsg.val.textContent = result.errorMsg;
        this.errorMsg.val.style.visibility = "visible";
      }
      this.valid = false;
    }
    this.emit("validate");
  }

  private resetError(): void {
    this.input.val.style.borderColor = SCHEME.neutral1;
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
