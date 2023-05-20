import EventEmitter = require("events");
import { FilledBlockingButton } from "../common/blocking_button";
import { InputWithError } from "../common/input_with_error";
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { LOCALIZED_TEXT } from "../common/locales/localized_text";
import { BASIC_INPUT_STYLE } from "../common/text_input_styles";
import { WEB_SERVICE_CLIENT } from "../common/web_service_client";
import {
  CARD_STYLE,
  ERROR_LABEL_STYLE,
  INPUT_LABEL_STYLE,
  PAGE_STYLE,
  SWITCH_TEXT_STYLE,
  TITLE_STYLE,
} from "./styles";
import { signUp } from "@phading/user_service_interface/client_requests";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

export enum InputField {
  NATURAL_NAME,
  USERNAME,
  PASSWORD,
  REPEAT_PASSWORD,
}

export interface SignUpPage {
  on(event: "signIn", listener: () => void): this;
  on(event: "signedUp", listener: () => void): this;
}

export class SignUpPage extends EventEmitter {
  public body: HTMLDivElement;
  // Visible for testing
  public naturalNameInputWithError: InputWithError<InputField>;
  public usernameInputWithError: InputWithError<InputField>;
  public passwordInputWithError: InputWithError<InputField>;
  public repeatPasswordInputWithError: InputWithError<InputField>;
  public switchToSignInButton: HTMLDivElement;
  public submitButton: FilledBlockingButton;
  private validInputs = new Set<InputField>();

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private webServiceClient: WebServiceClient
  ) {
    super();
    let naturalNameInputWithErrorRef = new Ref<InputWithError<InputField>>();
    let usernameInputWithErrorRef = new Ref<InputWithError<InputField>>();
    let passwordInputWithErrorRef = new Ref<InputWithError<InputField>>();
    let repeatPasswordInputWithErrorRef = new Ref<InputWithError<InputField>>();
    let switchToSignInButtonRef = new Ref<HTMLDivElement>();
    let submitButtonRef = new Ref<FilledBlockingButton>();
    this.body = E.div(
      {
        class: "sign-up",
        style: PAGE_STYLE,
      },
      E.div(
        {
          class: "sign-up-card",
          style: `${CARD_STYLE} gap: 1.5rem;`,
        },
        E.div(
          {
            class: "sign-up-title",
            style: TITLE_STYLE,
          },
          E.text(LOCALIZED_TEXT.signUpTitle)
        ),
        E.div(
          {
            class: "sign-up-natural-name-label",
            style: INPUT_LABEL_STYLE,
          },
          E.text(LOCALIZED_TEXT.naturalNameLabel)
        ),
        ...assign(
          naturalNameInputWithErrorRef,
          new InputWithError(
            E.input({
              class: "sign-up-natural-name-input",
              style: `${BASIC_INPUT_STYLE}`,
              type: "text",
              autocomplete: "name",
            }),
            E.div(
              {
                class: "sign-up-natural-name-error-label",
                style: ERROR_LABEL_STYLE,
              },
              E.text("1")
            ),
            this.validInputs,
            InputField.NATURAL_NAME
          )
        ).bodies,
        E.div(
          {
            class: "sign-up-username-label",
            style: INPUT_LABEL_STYLE,
          },
          E.text(LOCALIZED_TEXT.usernameLabel)
        ),
        ...assign(
          usernameInputWithErrorRef,
          new InputWithError(
            E.input({
              class: "sign-up-username-input",
              style: `${BASIC_INPUT_STYLE}`,
              type: "text",
              autocomplete: "username",
            }),
            E.div(
              {
                class: "sign-up-username-error-label",
                style: ERROR_LABEL_STYLE,
              },
              E.text("1")
            ),
            this.validInputs,
            InputField.USERNAME
          )
        ).bodies,
        E.div(
          {
            class: "sign-up-password-label",
            style: INPUT_LABEL_STYLE,
          },
          E.text(LOCALIZED_TEXT.passwordLabel)
        ),
        ...assign(
          passwordInputWithErrorRef,
          new InputWithError(
            E.input({
              class: "sign-up-password-input",
              style: `${BASIC_INPUT_STYLE}`,
              type: "password",
              autocomplete: "new-password",
            }),
            E.div(
              {
                class: "sign-up-password-error-label",
                style: ERROR_LABEL_STYLE,
              },
              E.text("1")
            ),
            this.validInputs,
            InputField.PASSWORD
          )
        ).bodies,
        E.div(
          {
            class: "sign-up-repeat-password-label",
            style: INPUT_LABEL_STYLE,
          },
          E.text(LOCALIZED_TEXT.repeatPasswordLabel)
        ),
        ...assign(
          repeatPasswordInputWithErrorRef,
          new InputWithError(
            E.input({
              class: "sign-up-repeat-password-input",
              style: `${BASIC_INPUT_STYLE}`,
              type: "password",
              autocomplete: "new-password",
            }),
            E.div(
              {
                class: "sign-up-repeat-password-error-label",
                style: ERROR_LABEL_STYLE,
              },
              E.text("1")
            ),
            this.validInputs,
            InputField.REPEAT_PASSWORD
          )
        ).bodies,
        E.divRef(
          switchToSignInButtonRef,
          {
            class: "sign-up-switch-to-sign-in",
            style: SWITCH_TEXT_STYLE,
          },
          E.text(LOCALIZED_TEXT.switchToSignInLink)
        ),
        E.div(
          {
            class: "sign-up-submit-button-wrapper",
            style: `align-self: flex-end;`,
          },
          assign(
            submitButtonRef,
            FilledBlockingButton.create(
              E.text(LOCALIZED_TEXT.signUpButtonLabel)
            )
          ).body
        )
      )
    );
    this.naturalNameInputWithError = naturalNameInputWithErrorRef.val;
    this.usernameInputWithError = usernameInputWithErrorRef.val;
    this.passwordInputWithError = passwordInputWithErrorRef.val;
    this.repeatPasswordInputWithError = repeatPasswordInputWithErrorRef.val;
    this.switchToSignInButton = switchToSignInButtonRef.val;
    this.submitButton = submitButtonRef.val;
    this.refreshSubmitButton();

    this.naturalNameInputWithError.input.addEventListener("input", () =>
      this.checkNaturalNameInput()
    );
    this.usernameInputWithError.input.addEventListener("input", () =>
      this.checkUsernameInput()
    );
    this.passwordInputWithError.input.addEventListener("input", () =>
      this.checkPasswordInput()
    );
    this.repeatPasswordInputWithError.input.addEventListener("input", () =>
      this.checkRepeatPasswordInput()
    );
    this.submitButton.on("action", () => this.signUp());
    this.switchToSignInButton.addEventListener("click", () =>
      this.emit("signIn")
    );
  }

  public static create(): SignUpPage {
    return new SignUpPage(LOCAL_SESSION_STORAGE, WEB_SERVICE_CLIENT);
  }

  private checkNaturalNameInput(): void {
    if (this.naturalNameInputWithError.input.value.length > 100) {
      this.naturalNameInputWithError.setInvalidWithError(
        LOCALIZED_TEXT.naturalNameTooLongError
      );
    } else if (this.naturalNameInputWithError.input.value.length === 0) {
      this.naturalNameInputWithError.setInvalidWithError(
        LOCALIZED_TEXT.naturalNameMissingError
      );
    } else {
      this.naturalNameInputWithError.setValid();
    }
    this.refreshSubmitButton();
  }

  private checkUsernameInput(): void {
    if (this.usernameInputWithError.input.value.length > 100) {
      this.usernameInputWithError.setInvalidWithError(
        LOCALIZED_TEXT.usernameTooLongError
      );
    } else if (this.usernameInputWithError.input.value.length === 0) {
      this.usernameInputWithError.setInvalidWithError(
        LOCALIZED_TEXT.usernameMissingError
      );
    } else {
      this.usernameInputWithError.setValid();
    }
    this.refreshSubmitButton();
  }

  private checkPasswordInput(): void {
    if (this.passwordInputWithError.input.value.length > 100) {
      this.passwordInputWithError.setInvalidWithError(
        LOCALIZED_TEXT.passwordTooLongError
      );
    } else if (this.passwordInputWithError.input.value.length === 0) {
      this.passwordInputWithError.setInvalidWithError(
        LOCALIZED_TEXT.passwordMissingError
      );
    } else {
      this.passwordInputWithError.setValid();
    }
    this.refreshSubmitButton();
  }

  private checkRepeatPasswordInput(): void {
    if (
      this.repeatPasswordInputWithError.input.value !==
      this.passwordInputWithError.input.value
    ) {
      this.repeatPasswordInputWithError.setInvalidWithError(
        LOCALIZED_TEXT.repeatPasswordNotMatchError
      );
    } else {
      this.repeatPasswordInputWithError.setValid();
    }
    this.refreshSubmitButton();
  }

  private refreshSubmitButton(): void {
    if (
      this.validInputs.has(InputField.NATURAL_NAME) &&
      this.validInputs.has(InputField.USERNAME) &&
      this.validInputs.has(InputField.PASSWORD) &&
      this.validInputs.has(InputField.REPEAT_PASSWORD)
    ) {
      this.submitButton.enable();
    } else {
      this.submitButton.disable();
    }
  }

  private async signUp(): Promise<void> {
    let response = await signUp(this.webServiceClient, {
      naturalName: this.naturalNameInputWithError.input.value,
      username: this.usernameInputWithError.input.value,
      password: this.passwordInputWithError.input.value,
    });
    this.localSessionStorage.save(response.signedSession);
    this.emit("signedUp");
  }

  public remove(): void {
    this.body.remove();
  }
}
