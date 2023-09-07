import EventEmitter = require("events");
import { FilledBlockingButton } from "../common/blocking_button";
import { SCHEME } from "../common/color_scheme";
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { LOCALIZED_TEXT } from "../common/locales/localized_text";
import { OptionButton, OptionInput } from "../common/option_input";
import { VerticalTextInputWithErrorMsg } from "../common/text_input";
import { USER_SERVICE_CLIENT } from "../common/user_service_client";
import {
  CARD_STYLE,
  PAGE_STYLE,
  SWITCH_TEXT_STYLE,
  TITLE_STYLE,
} from "./styles";
import { signUp } from "@phading/user_service_interface/client_requests";
import { UserType } from "@phading/user_service_interface/user_type";
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
  public naturalNameInput: VerticalTextInputWithErrorMsg<InputField>;
  public usernameInput: VerticalTextInputWithErrorMsg<InputField>;
  public passwordInput: VerticalTextInputWithErrorMsg<InputField>;
  public repeatPasswordInput: VerticalTextInputWithErrorMsg<InputField>;
  public userTypeInput: OptionInput<UserType>;
  public switchToSignInButton: HTMLDivElement;
  public submitButton: FilledBlockingButton;
  private validInputs = new Set<InputField>();
  private submitError: HTMLDivElement;

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private webServiceClient: WebServiceClient
  ) {
    super();
    let naturalNameInputRef = new Ref<
      VerticalTextInputWithErrorMsg<InputField>
    >();
    let usernameInputRef = new Ref<VerticalTextInputWithErrorMsg<InputField>>();
    let passwordInputRef = new Ref<VerticalTextInputWithErrorMsg<InputField>>();
    let repeatPasswordInputRef = new Ref<
      VerticalTextInputWithErrorMsg<InputField>
    >();
    let userTypeInputRef = new Ref<OptionInput<UserType>>();
    let switchToSignInButtonRef = new Ref<HTMLDivElement>();
    let submitButtonRef = new Ref<FilledBlockingButton>();
    let submitErrorRef = new Ref<HTMLDivElement>();
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
        assign(
          naturalNameInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.naturalNameLabel,
            "",
            {
              type: "text",
              autocomplete: "name",
            },
            this.validInputs,
            InputField.NATURAL_NAME
          )
        ).body,
        assign(
          usernameInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.usernameLabel,
            "",
            {
              type: "text",
              autocomplete: "username",
            },
            this.validInputs,
            InputField.USERNAME
          )
        ).body,
        assign(
          passwordInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.passwordLabel,
            "",
            {
              type: "password",
              autocomplete: "new-password",
            },
            this.validInputs,
            InputField.PASSWORD
          )
        ).body,
        assign(
          repeatPasswordInputRef,
          VerticalTextInputWithErrorMsg.create(
            LOCALIZED_TEXT.repeatPasswordLabel,
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
          userTypeInputRef,
          OptionInput.create(
            LOCALIZED_TEXT.chooseUserTypeLabel,
            "",
            [
              OptionButton.create(
                LOCALIZED_TEXT.userTypeConsumerLabel,
                UserType.CONSUMER,
                ""
              ),
              OptionButton.create(
                LOCALIZED_TEXT.userTypePublisherLabel,
                UserType.PUBLISHER,
                ""
              ),
            ],
            0
          )
        ).body,
        E.divRef(
          switchToSignInButtonRef,
          {
            class: "sign-up-switch-to-sign-in",
            style: SWITCH_TEXT_STYLE,
          },
          E.text(LOCALIZED_TEXT.switchToSignInLink)
        ),
        assign(
          submitButtonRef,
          FilledBlockingButton.create(
            `align-self: flex-end;`,
            E.text(LOCALIZED_TEXT.signUpButtonLabel)
          )
        ).body,
        E.divRef(
          submitErrorRef,
          {
            class: "sign-up-error",
            style: `visibility: hidden; align-self: flex-end; font-size: 1.4rem; color: ${SCHEME.error0};`,
          },
          E.text("1")
        )
      )
    );
    this.naturalNameInput = naturalNameInputRef.val;
    this.usernameInput = usernameInputRef.val;
    this.passwordInput = passwordInputRef.val;
    this.repeatPasswordInput = repeatPasswordInputRef.val;
    this.userTypeInput = userTypeInputRef.val;
    this.switchToSignInButton = switchToSignInButtonRef.val;
    this.submitButton = submitButtonRef.val;
    this.submitError = submitErrorRef.val;

    this.refreshSubmitButton();
    this.naturalNameInput.on("input", () => this.checkNaturalNameInput());
    this.naturalNameInput.on("enter", () => this.submitButton.click());
    this.usernameInput.on("input", () => this.checkUsernameInput());
    this.usernameInput.on("enter", () => this.submitButton.click());
    this.passwordInput.on("input", () => this.checkPasswordInput());
    this.passwordInput.on("enter", () => this.submitButton.click());
    this.repeatPasswordInput.on("input", () => this.checkRepeatPasswordInput());
    this.repeatPasswordInput.on("enter", () => this.submitButton.click());
    this.switchToSignInButton.addEventListener("click", () =>
      this.emit("signIn")
    );
    this.submitButton.on("action", () => this.signUp());
    this.submitButton.on("postAction", (error) => this.postSignUp(error));
  }

  public static create(): SignUpPage {
    return new SignUpPage(LOCAL_SESSION_STORAGE, USER_SERVICE_CLIENT);
  }

  private checkNaturalNameInput(): void {
    if (this.naturalNameInput.value.length > 100) {
      this.naturalNameInput.setAsInvalid(
        LOCALIZED_TEXT.naturalNameTooLongError
      );
    } else if (this.naturalNameInput.value.length === 0) {
      this.naturalNameInput.setAsInvalid();
    } else {
      this.naturalNameInput.setAsValid();
    }
    this.refreshSubmitButton();
  }

  private checkUsernameInput(): void {
    if (this.usernameInput.value.length > 100) {
      this.usernameInput.setAsInvalid(LOCALIZED_TEXT.usernameTooLongError);
    } else if (this.usernameInput.value.length === 0) {
      this.usernameInput.setAsInvalid();
    } else {
      this.usernameInput.setAsValid();
    }
    this.refreshSubmitButton();
  }

  private checkPasswordInput(): void {
    if (this.passwordInput.value.length > 100) {
      this.passwordInput.setAsInvalid(LOCALIZED_TEXT.passwordTooLongError);
    } else if (this.passwordInput.value.length === 0) {
      this.passwordInput.setAsInvalid();
    } else {
      this.passwordInput.setAsValid();
    }
    this.refreshSubmitButton();
  }

  private checkRepeatPasswordInput(): void {
    if (this.repeatPasswordInput.value !== this.passwordInput.value) {
      this.repeatPasswordInput.setAsInvalid(
        LOCALIZED_TEXT.repeatPasswordNotMatchError
      );
    } else {
      this.repeatPasswordInput.setAsValid();
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
    this.submitError.style.visibility = "hidden";
    let response = await signUp(this.webServiceClient, {
      naturalName: this.naturalNameInput.value,
      username: this.usernameInput.value,
      password: this.passwordInput.value,
      userType: this.userTypeInput.value,
    });
    if (response.usernameIsNotAvailable) {
      this.usernameInput.setAsInvalid(LOCALIZED_TEXT.usernameIsUsedError);
    } else {
      this.localSessionStorage.save(response.signedSession);
      this.emit("signedUp");
    }
  }

  private postSignUp(error?: Error): void {
    if (error) {
      console.error(error);
      this.submitError.style.visibility = "visible";
      this.submitError.textContent = LOCALIZED_TEXT.signUpError;
    } else {
      this.refreshSubmitButton();
    }
  }

  public remove(): void {
    this.body.remove();
  }
}
