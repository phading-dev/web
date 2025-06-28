import EventEmitter = require("events");
import { SCHEME } from "../color_scheme";
import { SimpleIconButton } from "../icon_button";
import { createEyeIcon, createEyeSlashIcon } from "../icons";
import { COMMON_BASIC_INPUT_STYLE } from "../input_styles";
import { FONT_M, FONT_S, ICON_BUTTON_M, ICON_M } from "../sizes";
import { InputField, ValidationResult } from "./input_field";
import { E, ElementAttributeMap } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export class PasswordInputWithErrorMsg
  extends EventEmitter
  implements InputField
{
  public body: HTMLElement;
  private input = new Ref<HTMLInputElement>();
  private buttonsContainer = new Ref<HTMLDivElement>();
  public showPasswordButton = new Ref<SimpleIconButton>();
  public hidePasswordButton = new Ref<SimpleIconButton>();
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
        class: "password-input",
        style: `display: flex; flex-flow: column nowrap; ${customStyle}`,
      },
      E.div(
        {
          class: "password-input-label",
          style: `font-size: ${FONT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(label),
      ),
      E.div({
        style: `flex: 0 0 auto; height: .5rem;`,
      }),
      E.div(
        {
          class: "password-input-line",
          style: `width: 100%; display: flex; flex-flow: row nowrap; align-items: flex-end;`,
        },
        E.inputRef(this.input, {
          class: "password-input-input",
          style: `${COMMON_BASIC_INPUT_STYLE} width: 100%;`,
          ...otherInputAttributes,
        }),
        E.divRef(
          this.buttonsContainer,
          {
            class: "password-input-buttons",
            style: `border-bottom: .1rem solid;`,
          },
          assign(
            this.showPasswordButton,
            new SimpleIconButton(
              ICON_BUTTON_M,
              ICON_M,
              createEyeIcon(SCHEME.neutral1),
            ),
          ).body,
          assign(
            this.hidePasswordButton,
            new SimpleIconButton(
              ICON_BUTTON_M,
              ICON_M,
              createEyeSlashIcon(SCHEME.neutral1),
            ),
          ).body,
        ),
      ),
      E.div({
        style: `flex: 0 0 auto; height: .5rem;`,
      }),
      E.divRef(
        this.errorMsg,
        {
          class: "password-error-message",
          style: `align-self: flex-end; font-size: ${FONT_S}rem; color: ${SCHEME.error0};`,
        },
        E.text("1"),
      ),
    );
    this.hidePassword();
    this.showPasswordButton.val.on("action", () => this.showPassword());
    this.hidePasswordButton.val.on("action", () => this.hidePassword());
    this.input.val.addEventListener("keydown", (event) => this.keydown(event));
    this.input.val.addEventListener("input", () => this.validate());
  }

  private hidePassword(): void {
    this.input.val.type = "password";
    this.showPasswordButton.val.show();
    this.hidePasswordButton.val.hide();
  }

  private showPassword(): void {
    this.input.val.type = "text";
    this.showPasswordButton.val.hide();
    this.hidePasswordButton.val.show();
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
        this.buttonsContainer.val.style.borderColor = SCHEME.error0;
        this.errorMsg.val.textContent = result.errorMsg;
        this.errorMsg.val.style.visibility = "visible";
      }
      this.valid = false;
    }
    this.emit("validate");
  }

  private resetError(): void {
    this.input.val.style.borderColor = SCHEME.neutral1;
    this.buttonsContainer.val.style.borderColor = SCHEME.neutral1;
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
