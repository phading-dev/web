import EventEmitter = require("events");
import {
  OptionButton,
  OptionInput,
} from "../common/input_form_page//option_input";
import { InputFormPage } from "../common/input_form_page/body";
import {
  TextInputWithErrorMsg,
  ValidationResult,
} from "../common/input_form_page/text_input";
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { LOCALIZED_TEXT } from "../common/locales/localized_text";
import {
  NATURAL_NAME_LENGTH_LIMIT,
  PASSWORD_LENGTH_LIMIT,
  USERNAME_LENGTH_LIMIT,
} from "../common/user_limits";
import { USER_SERVICE_CLIENT } from "../common/web_service_client";
import { SWITCH_TEXT_STYLE } from "./styles";
import { AccountType } from "@phading/user_service_interface/account_type";
import { signUp } from "@phading/user_service_interface/self/frontend/client";
import {
  SignUpRequestBody,
  SignUpResponse,
} from "@phading/user_service_interface/self/frontend/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

export interface SignUpPage {
  on(event: "signIn", listener: () => void): this;
  on(event: "signedUp", listener: () => void): this;
  on(event: "signUpError", listener: () => void): this;
}

export class SignUpPage extends EventEmitter {
  public static create(): SignUpPage {
    return new SignUpPage(LOCAL_SESSION_STORAGE, USER_SERVICE_CLIENT);
  }

  private naturalNameInput_: TextInputWithErrorMsg<SignUpRequestBody>;
  private usernameInput_: TextInputWithErrorMsg<SignUpRequestBody>;
  private passwordInput_: TextInputWithErrorMsg<SignUpRequestBody>;
  private repeatPasswordInput_: TextInputWithErrorMsg<SignUpRequestBody>;
  private accountTypeInput_: OptionInput<AccountType, SignUpRequestBody>;
  private switchToSignInButton_: HTMLDivElement;
  private inputFormPage_: InputFormPage<SignUpRequestBody, SignUpResponse>;
  private password: string;

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private userServiceClient: WebServiceClient,
  ) {
    super();
    let naturalNameInputRef = new Ref<
      TextInputWithErrorMsg<SignUpRequestBody>
    >();
    let usernameInputRef = new Ref<TextInputWithErrorMsg<SignUpRequestBody>>();
    let passwordInputRef = new Ref<TextInputWithErrorMsg<SignUpRequestBody>>();
    let repeatPasswordInputRef = new Ref<
      TextInputWithErrorMsg<SignUpRequestBody>
    >();
    let accountTypeInputRef = new Ref<
      OptionInput<AccountType, SignUpRequestBody>
    >();
    let switchToSignInButtonRef = new Ref<HTMLDivElement>();
    this.inputFormPage_ = InputFormPage.create(
      LOCALIZED_TEXT.signUpTitle,
      [
        assign(
          naturalNameInputRef,
          TextInputWithErrorMsg.create(
            LOCALIZED_TEXT.naturalNameLabel,
            "",
            {
              type: "text",
              autocomplete: "name",
            },
            (request, value) => {
              request.naturalName = value;
            },
            (value) => this.checkNaturalNameInput(value),
          ),
        ).body,
        assign(
          usernameInputRef,
          TextInputWithErrorMsg.create(
            LOCALIZED_TEXT.usernameLabel,
            "",
            {
              type: "text",
              autocomplete: "username",
            },
            (request, value) => {
              request.username = value;
            },
            (value) => this.checkUsernameInput(value),
          ),
        ).body,
        assign(
          passwordInputRef,
          TextInputWithErrorMsg.create(
            LOCALIZED_TEXT.passwordLabel,
            "",
            {
              type: "password",
              autocomplete: "new-password",
            },
            (request, value) => {
              request.password = value;
            },
            (value) => this.checkPasswordInput(value),
          ),
        ).body,
        assign(
          repeatPasswordInputRef,
          TextInputWithErrorMsg.create(
            LOCALIZED_TEXT.repeatPasswordLabel,
            "",
            {
              type: "password",
              autocomplete: "new-password",
            },
            () => {},
            (value) => this.checkRepeatPasswordInput(value),
          ),
        ).body,
        assign(
          accountTypeInputRef,
          OptionInput.create(
            LOCALIZED_TEXT.chooseUserTypeLabel,
            "",
            [
              OptionButton.create(
                LOCALIZED_TEXT.userTypeConsumerLabel,
                AccountType.CONSUMER,
                "",
              ),
              OptionButton.create(
                LOCALIZED_TEXT.userTypePublisherLabel,
                AccountType.PUBLISHER,
                "",
              ),
            ],
            AccountType.CONSUMER,
            (request, value) => {
              request.accountType = value;
            },
          ),
        ).body,
        E.divRef(
          switchToSignInButtonRef,
          {
            class: "sign-up-switch-to-sign-in",
            style: SWITCH_TEXT_STYLE,
          },
          E.text(LOCALIZED_TEXT.switchToSignInLink),
        ),
      ],
      [
        naturalNameInputRef.val,
        usernameInputRef.val,
        passwordInputRef.val,
        repeatPasswordInputRef.val,
        accountTypeInputRef.val,
      ],
      LOCALIZED_TEXT.signUpButtonLabel,
      (request) => this.signUp(request),
      (response, error) => this.postSignUp(response, error),
      {},
    );
    this.naturalNameInput_ = naturalNameInputRef.val;
    this.usernameInput_ = usernameInputRef.val;
    this.passwordInput_ = passwordInputRef.val;
    this.repeatPasswordInput_ = repeatPasswordInputRef.val;
    this.accountTypeInput_ = accountTypeInputRef.val;
    this.switchToSignInButton_ = switchToSignInButtonRef.val;

    this.switchToSignInButton_.addEventListener("click", () =>
      this.emit("signIn"),
    );
    this.inputFormPage.on("submitError", () => this.emit("signUpError"));
    this.inputFormPage.on("submitted", () => this.emit("signedUp"));
  }

  private checkNaturalNameInput(value: string): ValidationResult {
    if (value.length > NATURAL_NAME_LENGTH_LIMIT) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.naturalNameTooLongError,
      };
    } else if (value.length === 0) {
      return { valid: false };
    } else {
      return { valid: true };
    }
  }

  private checkUsernameInput(value: string): ValidationResult {
    if (value.length > USERNAME_LENGTH_LIMIT) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.usernameTooLongError,
      };
    } else if (value.length === 0) {
      return { valid: false };
    } else {
      return { valid: true };
    }
  }

  private checkPasswordInput(value: string): ValidationResult {
    this.password = value;
    if (value.length > PASSWORD_LENGTH_LIMIT) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.passwordTooLongError,
      };
    } else if (value.length === 0) {
      return { valid: false };
    } else {
      return { valid: true };
    }
  }

  private checkRepeatPasswordInput(value: string): ValidationResult {
    if (value !== this.password) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.repeatNewPasswordNotMatchError,
      };
    } else {
      return { valid: true };
    }
  }

  private async signUp(requset: SignUpRequestBody): Promise<SignUpResponse> {
    return await signUp(this.userServiceClient, requset);
  }

  private postSignUp(response: SignUpResponse, error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.signUpError;
    } else if (response.usernameIsNotAvailable) {
      return LOCALIZED_TEXT.usernameIsUsedError;
    } else {
      this.localSessionStorage.save(response.signedSession);
      return "";
    }
  }

  public get body() {
    return this.inputFormPage_.body;
  }

  public remove(): void {
    this.inputFormPage_.remove();
  }

  // Visible for testing
  public get inputFormPage() {
    return this.inputFormPage_;
  }

  public get naturalNameInput() {
    return this.naturalNameInput_;
  }

  public get usernameInput() {
    return this.usernameInput_;
  }

  public get passwordInput() {
    return this.passwordInput_;
  }

  public get repeatPasswordInput() {
    return this.repeatPasswordInput_;
  }

  public get accountTypeInput() {
    return this.accountTypeInput_;
  }

  public get switchToSignInButton() {
    return this.switchToSignInButton_;
  }
}
