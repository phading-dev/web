import EventEmitter = require("events");
import { SCHEME } from "../color_scheme";
import { FONT_M, FONT_S } from "../sizes";
import { InputField } from "./input_field";
import { E, ElementAttributeMap } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export let NULLIFIED_INPUT_STYLE = `padding: 0; margin: 0; outline: none; border: 0; font-family: inherit; background-color: initial;`;
// Missing border-color.
export let BASIC_INPUT_STYLE = `${NULLIFIED_INPUT_STYLE} font-size: ${FONT_M}rem; line-height: 140%; color: ${SCHEME.neutral0}; border-bottom: .1rem solid;`;

export interface ValidationResult {
  valid: boolean;
  errorMsg?: string;
}

export class TextInputWithErrorMsg<Request>
  extends EventEmitter
  implements InputField<Request>
{
  public static create<Request>(
    label: string,
    customStyle: string,
    otherInputAttributes: ElementAttributeMap = {},
    fillInRequestFn: (request: Request, value: string) => void,
    validateFn: (value: string) => Promise<ValidationResult> | ValidationResult,
  ): TextInputWithErrorMsg<Request> {
    return new TextInputWithErrorMsg<Request>(
      label,
      customStyle,
      otherInputAttributes,
      fillInRequestFn,
      validateFn,
    );
  }

  private container: HTMLDivElement;
  private input: HTMLInputElement;
  private errorMsg: HTMLDivElement;
  private valid: boolean;

  public constructor(
    label: string,
    customStyle: string,
    otherInputAttributes: ElementAttributeMap,
    private fillInRequestFn: (request: Request, value: string) => void,
    private validateFn: (
      value: string,
    ) => Promise<ValidationResult> | ValidationResult,
  ) {
    super();
    let inputRef = new Ref<HTMLInputElement>();
    let errorMsgRef = new Ref<HTMLDivElement>();
    this.container = E.div(
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
        style: `height: 1rem;`,
      }),
      E.inputRef(inputRef, {
        class: "text-input-input",
        style: `${BASIC_INPUT_STYLE} width: 100%;`,
        ...otherInputAttributes,
      }),
      E.div({
        style: `height: .5rem;`,
      }),
      E.divRef(
        errorMsgRef,
        {
          class: "text-input-error-label",
          style: `align-self: flex-end; font-size: ${FONT_S}rem; color: ${SCHEME.error0};`,
        },
        E.text("1"),
      ),
    );
    this.input = inputRef.val;
    this.errorMsg = errorMsgRef.val;

    this.validate();
    this.input.addEventListener("keydown", (event) => this.keydown(event));
    this.input.addEventListener("input", () => this.validate());
  }

  private keydown(event: KeyboardEvent): void {
    if (event.code !== "Enter") {
      return;
    }
    this.emit("submit");
  }

  private async validate(): Promise<void> {
    this.resetError();
    let result = await this.validateFn(this.input.value);
    if (result.valid) {
      this.valid = true;
    } else {
      if (result.errorMsg) {
        this.input.style.borderColor = SCHEME.error0;
        this.errorMsg.textContent = result.errorMsg;
        this.errorMsg.style.visibility = "visible";
      }
      this.valid = false;
    }
    this.emit("validated");
  }

  private resetError(): void {
    this.input.style.borderColor = SCHEME.neutral1;
    this.errorMsg.style.visibility = "hidden";
  }

  public get body() {
    return this.container;
  }

  public get isValid() {
    return this.valid;
  }

  public fillInRequest(request: Request): void {
    this.fillInRequestFn(request, this.input.value);
  }

  public remove(): void {
    this.body.remove();
  }

  // Visible for testing
  public set value(value: string) {
    this.input.value = value;
  }
  public dispatchInput(): void {
    this.input.dispatchEvent(new Event("input"));
  }
  public dispatchEnter(): void {
    this.input.dispatchEvent(new KeyboardEvent("keydown", { code: "Enter" }));
  }
}
