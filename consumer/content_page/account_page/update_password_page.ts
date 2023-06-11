import EventEmitter = require("events");
import { FilledBlockingButton } from "../../common/blocking_button";
import { SCHEME } from "../../common/color_scheme";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { VerticalTextInputWithErrorMsg } from "../../common/text_input";
import { WEB_SERVICE_CLIENT } from "../../common/web_service_client";
import { MenuItem } from "../menu_item/container";
import { createBackMenuItem } from "../menu_item/factory";
import { CARD_STYLE, PAGE_STYLE } from "./styles";
import { updatePassword } from "@phading/user_service_interface/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

enum InputField {
  CURRENT_PASSWORD,
  NEW_PASSWORD,
  REPEAT_PASSWORD,
}

export interface UpdatePasswordPage {
  on(event: "back", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
}

export class UpdatePasswordPage extends EventEmitter {
  private static PASSWORD_LENGTH_LIMIT = 100;

  public body: HTMLDivElement;
  public backMenuBody: HTMLDivElement;
  // Visible for testing
  public backMenuItem: MenuItem;
  public currentPasswordInput: VerticalTextInputWithErrorMsg<InputField>;
  public newPasswordInput: VerticalTextInputWithErrorMsg<InputField>;
  public repeatPasswordInput: VerticalTextInputWithErrorMsg<InputField>;
  public submitButton: FilledBlockingButton;
  private submitError: HTMLDivElement;
  private validInputs = new Set<InputField>();

  public constructor(private webServiceClient: WebServiceClient) {
    super();
    let currentPasswordInputRef = new Ref<
      VerticalTextInputWithErrorMsg<InputField>
    >();
    let newPasswordInputRef = new Ref<
      VerticalTextInputWithErrorMsg<InputField>
    >();
    let repeatPasswordInputRef = new Ref<
      VerticalTextInputWithErrorMsg<InputField>
    >();
    let submitButtonRef = new Ref<FilledBlockingButton>();
    let submitErrorRef = new Ref<HTMLDivElement>();
    this.body = E.div(
      {
        class: "update-password",
        style: PAGE_STYLE,
      },
      E.div(
        {
          class: "update-password-card",
          style: CARD_STYLE,
        },
        E.div(
          {
            class: "update-password-card-title",
            style: `font-size: 1.6rem; color: ${SCHEME.neutral0}; align-self: center; margin-bottom: 2rem;`,
          },
          E.text(LOCALIZED_TEXT.updatePasswordTitle)
        ),
        assign(
          currentPasswordInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.currentPasswordLabel,
            "",
            {
              type: "password",
              autocomplete: "current-password",
            },
            this.validInputs,
            InputField.CURRENT_PASSWORD
          )
        ).body,
        assign(
          newPasswordInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.newPasswordLabel,
            "",
            {
              type: "password",
              autocomplete: "new-password",
            },
            this.validInputs,
            InputField.NEW_PASSWORD
          )
        ).body,
        assign(
          repeatPasswordInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.repeatNewPasswordLabel,
            "",
            {
              type: "password",
              autocomplete: "new-password",
            },
            this.validInputs,
            InputField.REPEAT_PASSWORD
          )
        ).body,
        assign(
          submitButtonRef,
          FilledBlockingButton.create(
            `align-self: flex-end;`,
            E.text(LOCALIZED_TEXT.updateButtonLabel)
          )
        ).body,
        E.divRef(
          submitErrorRef,
          {
            class: "update-password-submit-error",
            style: `align-self: flex-end; visibility: hidden; font-size: 1.2rem; color: ${SCHEME.error0};`,
          },
          E.text("1")
        )
      )
    );
    this.currentPasswordInput = currentPasswordInputRef.val;
    this.newPasswordInput = newPasswordInputRef.val;
    this.repeatPasswordInput = repeatPasswordInputRef.val;
    this.submitButton = submitButtonRef.val;
    this.submitError = submitErrorRef.val;

    this.backMenuItem = createBackMenuItem();
    this.backMenuBody = this.backMenuItem.body;

    this.refreshSubmitButton();
    this.backMenuItem.on("action", () => this.emit("back"));
    this.currentPasswordInput.on("input", () =>
      this.checkCurrentPasswordInput()
    );
    this.currentPasswordInput.on("enter", () => this.submitButton.click());
    this.newPasswordInput.on("input", () => this.checkNewPasswordInput());
    this.newPasswordInput.on("enter", () => this.submitButton.click());
    this.repeatPasswordInput.on("input", () => this.checkRepeatPasswordInput());
    this.repeatPasswordInput.on("enter", () => this.submitButton.click());
    this.submitButton.on("action", () => this.updatePasswordAction());
    this.submitButton.on("postAction", (e) => this.updatePasswordError(e));
  }

  public static create(): UpdatePasswordPage {
    return new UpdatePasswordPage(WEB_SERVICE_CLIENT);
  }

  private checkCurrentPasswordInput(): void {
    if (this.currentPasswordInput.value.length === 0) {
      this.currentPasswordInput.setAsInvalid();
    } else {
      this.currentPasswordInput.setAsValid();
    }
    this.refreshSubmitButton();
  }

  private checkNewPasswordInput(): void {
    if (this.newPasswordInput.value.length === 0) {
      this.newPasswordInput.setAsInvalid();
    } else if (
      this.newPasswordInput.value.length >
      UpdatePasswordPage.PASSWORD_LENGTH_LIMIT
    ) {
      this.newPasswordInput.setAsInvalid(
        LOCALIZED_TEXT.newPasswordTooLongError
      );
    } else {
      this.newPasswordInput.setAsValid();
      this.checkRepeatPasswordInput();
    }
    this.refreshSubmitButton();
  }

  private checkRepeatPasswordInput(): void {
    if (this.repeatPasswordInput.value !== this.newPasswordInput.value) {
      this.repeatPasswordInput.setAsInvalid(
        LOCALIZED_TEXT.repeatNewPasswordNotMatchError
      );
    } else {
      this.repeatPasswordInput.setAsValid();
    }
    this.refreshSubmitButton();
  }

  private refreshSubmitButton(): void {
    if (
      this.validInputs.has(InputField.CURRENT_PASSWORD) &&
      this.validInputs.has(InputField.NEW_PASSWORD) &&
      this.validInputs.has(InputField.REPEAT_PASSWORD)
    ) {
      this.submitButton.enable();
    } else {
      this.submitButton.disable();
    }
  }

  private async updatePasswordAction(): Promise<void> {
    this.submitError.style.visibility = "hidden";
    await updatePassword(this.webServiceClient, {
      currentPassword: this.currentPasswordInput.input.value,
      newPassword: this.newPasswordInput.input.value,
    });
    this.emit("updated");
  }

  private updatePasswordError(e: Error): void {
    if (e) {
      console.error(e);
      this.submitError.style.visibility = "visible";
      this.submitError.textContent = LOCALIZED_TEXT.updatePasswordError;
    }
  }

  public remove(): void {
    this.body.remove();
    this.backMenuItem.remove();
  }
}
