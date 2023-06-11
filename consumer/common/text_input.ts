import EventEmitter = require("events");
import { SCHEME } from "./color_scheme";
import { E, ElementAttributeMap } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export let NULLIFIED_INPUT_STYLE = `padding: 0; margin: 0; outline: none; border: 0; font-family: initial; background-color: initial;`;
// Missing border-color.
export let BASIC_INPUT_STYLE = `${NULLIFIED_INPUT_STYLE} font-size: 1.4rem; line-height: 2rem; color: ${SCHEME.neutral0}; border-bottom: .1rem solid;`;

export declare interface VerticalTextInputWithErrorMsg<InputField> {
  on(event: "enter", listener: () => void): this;
  on(event: "input", listener: () => void): this;
}

export class VerticalTextInputWithErrorMsg<InputField> extends EventEmitter {
  public body: HTMLDivElement;
  // Visible for testing
  public input: HTMLInputElement;
  private errorMsg: HTMLDivElement;

  public constructor(
    label: string,
    customStyle: string,
    otherInputAttributes: ElementAttributeMap,
    private validInputs: Set<InputField>,
    private inputField: InputField
  ) {
    super();
    let inputRef = new Ref<HTMLInputElement>();
    let errorMsgRef = new Ref<HTMLDivElement>();
    this.body = E.div(
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
      E.inputRef(inputRef, {
        class: "text-input-input",
        style: `${BASIC_INPUT_STYLE}`,
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

    this.reset();
    this.input.addEventListener("keydown", (event) => this.keydown(event));
    this.input.addEventListener("input", () => this.emit("input"));
  }

  public static create<InputField>(
    label: string,
    customStyle: string,
    otherInputAttributes: ElementAttributeMap = {},
    validInputs: Set<InputField>,
    inputField: InputField
  ): VerticalTextInputWithErrorMsg<InputField> {
    return new VerticalTextInputWithErrorMsg<InputField>(
      label,
      customStyle,
      otherInputAttributes,
      validInputs,
      inputField
    );
  }

  private keydown(event: KeyboardEvent): void {
    if (event.code !== "Enter") {
      return;
    }
    this.emit("enter");
  }

  private reset(): void {
    this.input.style.borderColor = SCHEME.neutral1;
    this.errorMsg.style.visibility = "hidden";
  }

  public setAsValid(): void {
    this.reset();
    this.validInputs.add(this.inputField);
  }

  public setAsInvalid(errorStr?: string): void {
    if (errorStr) {
      this.input.style.borderColor = SCHEME.error0;
      this.errorMsg.textContent = errorStr;
      this.errorMsg.style.visibility = "visible";
    } else {
      this.reset();
    }
    this.validInputs.delete(this.inputField);
  }

  set value(value: string) {
    this.input.value = value;
  }

  get value(): string {
    return this.input.value;
  }

  public dispatchInput(): void {
    this.input.dispatchEvent(new Event("input"));
  }

  public dispatchEnter(): void {
    this.input.dispatchEvent(new KeyboardEvent("keydown", { code: "Enter" }));
  }

  public remove(): void {
    this.body.remove();
  }
}

export interface VerticalTextInputValue {
  on(event: "click", listener: () => void): this;
}

export class VerticalTextInputValue extends EventEmitter {
  public body: HTMLDivElement;
  private inputValue: HTMLDivElement;

  public constructor(
    label: string,
    value: string,
    customStyle: string,
    customValueStle: string
  ) {
    super();
    let inputValueRef = new Ref<HTMLDivElement>();
    this.body = E.div(
      {
        class: "text-input-value",
        style: `display: flex; flex-flow: column nowrap; ${customStyle}`,
      },
      E.div(
        {
          class: "text-input-value-label",
          style: `font-size: 1.4rem; color: ${SCHEME.neutral0};`,
        },
        E.text(label)
      ),
      E.div({
        style: `height: 1rem;`,
      }),
      E.divRef(
        inputValueRef,
        {
          class: "text-input-value-value",
          style: `font-size: 1.4rem; line-height: 2rem; color: ${SCHEME.neutral0}; border-bottom: .1rem solid ${SCHEME.neutral1}; ${customValueStle}`,
        },
        E.text(value)
      ),
      E.div({
        style: `height: .5rem;`,
      }),
      E.div(
        {
          class: "text-input-value-error-holder",
          style: `visibility: hidden; font-size: 1.2rem;`,
        },
        E.text("1")
      )
    );
    this.inputValue = inputValueRef.val;

    this.inputValue.addEventListener("click", () => this.emit("click"));
  }

  public static create(
    label: string,
    value: string,
    customStyle: string,
    customValueStle: string
  ): VerticalTextInputValue {
    return new VerticalTextInputValue(
      label,
      value,
      customStyle,
      customValueStle
    );
  }

  public setValue(value: string): void {
    this.inputValue.textContent = value;
  }

  public click(): void {
    this.inputValue.click();
  }

  public remove(): void {
    this.body.remove();
  }
}
