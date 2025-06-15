import EventEmitter = require("events");
import { SCHEME } from "../color_scheme";
import { FONT_S } from "../sizes";
import { InputField, ValidationResult } from "./input_field";
import { E } from "@selfage/element/factory";
import { Ref } from "@selfage/ref";

export interface InputWithErrorMsg {
  on(event: "validate", listener: () => void): this;
  on(event: "action", listener: () => void): this;
}

export class InputWithErrorMsg extends EventEmitter implements InputField {
  public body: HTMLElement;
  protected input = new Ref<HTMLInputElement>();
  protected textAreaInput = new Ref<HTMLTextAreaElement>();
  private inputElement: HTMLElement;
  public errorMsg: HTMLElement;
  private validateAndTakeFn: (
    value: string,
  ) => Promise<ValidationResult> | ValidationResult;
  private valid: boolean = false;

  public constructor() {
    super();
  }

  protected construct(
    createBody: (errorMsg: HTMLElement) => HTMLElement,
    validateAndTakeFn: (
      value: string,
    ) => Promise<ValidationResult> | ValidationResult,
  ): void {
    this.errorMsg = E.div(
      {
        class: "input-error-message",
        style: `align-self: flex-end; font-size: ${FONT_S}rem; color: ${SCHEME.error0};`,
      },
      E.text("1"),
    );
    this.body = createBody(this.errorMsg);
    this.inputElement = this.input.val || this.textAreaInput.val;
    this.validateAndTakeFn = validateAndTakeFn;

    this.input.val?.addEventListener("keydown", (event) => this.keydown(event));
    this.input.val?.addEventListener("input", () => this.validate());
    this.textAreaInput.val?.addEventListener("input", () => this.validate());
  }

  private keydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.emit("action");
    }
  }

  public async validate(): Promise<void> {
    this.resetError();
    let value = this.input.val?.value || this.textAreaInput.val?.value || "";
    let result = await this.validateAndTakeFn(value);
    if (result.valid) {
      this.valid = true;
    } else {
      if (result.errorMsg) {
        this.inputElement.style.borderColor = SCHEME.error0;
        this.errorMsg.textContent = result.errorMsg;
        this.errorMsg.style.visibility = "visible";
      }
      this.valid = false;
    }
    this.emit("validate");
  }

  private resetError(): void {
    this.inputElement.style.borderColor = SCHEME.neutral1;
    this.errorMsg.style.visibility = "hidden";
  }

  public get isValid() {
    return this.valid;
  }

  public remove(): void {
    this.body.remove();
  }

  // Visible for testing
  public set value(value: string) {
    if (this.input.val) {
      this.input.val.value = value;
    } else if (this.textAreaInput.val) {
      this.textAreaInput.val.value = value;
    }
  }
  public focus(): void {
    if (this.input.val) {
      this.input.val.focus();
    } else if (this.textAreaInput.val) {
      this.textAreaInput.val.focus();
    }
  }
  public dispatchInput(): void {
    this.inputElement.dispatchEvent(new Event("input"));
  }
  public dispatchEnter(): void {
    this.inputElement.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter" }),
    );
  }
}
