import EventEmitter = require("events");
import { SCHEME } from "../color_scheme";
import { InputField } from "./input_field";
import { BASIC_INPUT_STYLE } from "./text_input";
import { E, ElementAttributeMap } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface ValidationResult {
  valid: boolean;
  errorMsg?: string;
}

export class TextAreaInputWithErrorMsg<Request>
  extends EventEmitter
  implements InputField<Request>
{
  public static create<Request>(
    label: string,
    customStyle: string,
    otherInputAttributes: ElementAttributeMap = {},
    fillInRequestFn: (request: Request, value: string) => void,
    validateFn: (value: string) => Promise<ValidationResult> | ValidationResult
  ): TextAreaInputWithErrorMsg<Request> {
    return new TextAreaInputWithErrorMsg<Request>(
      label,
      customStyle,
      otherInputAttributes,
      fillInRequestFn,
      validateFn
    );
  }

  private container: HTMLDivElement;
  private input: HTMLTextAreaElement;
  private errorMsg: HTMLDivElement;
  private valid: boolean;

  public constructor(
    label: string,
    customStyle: string,
    otherInputAttributes: ElementAttributeMap,
    private fillInRequestFn: (request: Request, value: string) => void,
    private validateFn: (
      value: string
    ) => Promise<ValidationResult> | ValidationResult
  ) {
    super();
    let inputRef = new Ref<HTMLTextAreaElement>();
    let errorMsgRef = new Ref<HTMLDivElement>();
    this.container = E.div(
      {
        class: "text-input",
        style: `display: flex; flex-flow: column nowrap; ${customStyle}`,
      },
      E.div(
        {
          class: "text-input-label",
          style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
        },
        E.text(label)
      ),
      E.div({
        style: `height: 1rem;`,
      }),
      E.textareaRef(inputRef, {
        class: "text-input-input",
        style: `${BASIC_INPUT_STYLE} width: 100%;`,
        rows: "3",
        ...otherInputAttributes,
      }),
      E.div({
        style: `height: .5rem;`,
      }),
      E.divRef(
        errorMsgRef,
        {
          class: "text-input-error-label",
          style: `align-self: flex-end; font-size: 1.2rem; color: ${SCHEME.error0};`,
        },
        E.text("1")
      )
    );
    this.input = inputRef.val;
    this.errorMsg = errorMsgRef.val;

    this.validate();
    this.input.addEventListener("input", () => this.validate());
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
}
