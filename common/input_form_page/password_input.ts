import EventEmitter = require("events");
import { IconButton } from "../button";
import { SCHEME } from "../color_scheme";
import { createEyeIcon, createEyeSlashIcon } from "../icons";
import {
  COMMON_BASIC_INPUT_WITHOUT_BORDER_STYLE,
  INPUT_BORDER_RADIUS,
} from "../input_styles";
import {
  BORDER_WIDTH_1,
  FONT_M,
  FONT_S,
  GAP_0_25X,
  ICON_BUTTON_M,
  ICON_L,
  LINE_HEIGHT_M,
  LINE_HEIGHT_S,
} from "../sizes";
import { InputField, ValidationResult } from "./input_field";
import { E, ElementAttributeMap } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";

export class PasswordInputWithErrorMsg
  extends EventEmitter
  implements InputField
{
  public body: HTMLElement;
  private inputContainer = new Ref<HTMLDivElement>();
  private input = new Ref<HTMLInputElement>();
  public showPasswordButton = new Ref<IconButton>();
  public hidePasswordButton = new Ref<IconButton>();
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
        class: "password-input",
        style: `position: relative; display: flex; flex-flow: column nowrap; ${customStyle}`,
      },
      E.div(
        {
          class: "password-input-label",
          style: `font-size: ${FONT_M}rem; line-height: ${LINE_HEIGHT_M}rem; color: ${SCHEME.neutral0};`,
        },
        E.text(label),
      ),
      E.div({
        style: `flex: 0 0 auto; height: ${GAP_0_25X}rem;`,
      }),
      E.divRef(
        this.inputContainer,
        {
          class: "password-input-line",
          style: `width: 100%; box-sizing: border-box; display: flex; flex-flow: row nowrap; align-items: center; border: ${BORDER_WIDTH_1}rem solid; border-radius: ${INPUT_BORDER_RADIUS}rem;`,
        },
        E.inputRef(this.input, {
          class: "password-input-input",
          style: `${COMMON_BASIC_INPUT_WITHOUT_BORDER_STYLE} flex: 1 1 0;`,
          ...otherInputAttributes,
        }),
        E.div(
          {
            class: "password-input-buttons",
            style: `flex: 0 0 auto;`,
          },
          assign(
            this.showPasswordButton,
            new IconButton(
              ICON_BUTTON_M,
              ICON_L,
              createEyeIcon(SCHEME.neutral1),
            ),
          ).body,
          assign(
            this.hidePasswordButton,
            new IconButton(
              ICON_BUTTON_M,
              ICON_L,
              createEyeSlashIcon(SCHEME.neutral1),
            ),
          ).body,
        ),
      ),
      E.divRef(this.errorMsg, {
        class: "password-error-message",
        style: `position: absolute; right: 0; top: 100%; font-size: ${FONT_S}rem; line-height: ${LINE_HEIGHT_S}rem; color: ${SCHEME.error0};`,
      }),
    );
    this.hidePassword();
    this.showPasswordButton.val.addAction(() => this.showPassword());
    this.hidePasswordButton.val.addAction(() => this.hidePassword());
    this.input.val.addEventListener("keydown", (event) => this.keydown(event));
    this.input.val.addEventListener("input", () => this.validateInput());
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
        this.inputContainer.val.style.borderColor = SCHEME.error0;
        this.errorMsg.val.textContent = result.errorMsg;
        this.errorMsg.val.style.display = "block";
      }
      this.valid = false;
    }
  }

  private resetError(): void {
    this.inputContainer.val.style.borderColor = SCHEME.neutral1;
    this.errorMsg.val.style.display = "none";
  }

  public enable(): this {
    this.input.val.disabled = false;
    this.validate();
    return this;
  }

  public disable(): this {
    this.input.val.disabled = true;
    this.inputContainer.val.style.borderColor = SCHEME.neutral2;
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
