import EventEmitter = require("events");
import {
  OptionButton,
  OptionInput,
} from "../../common/input_form_page//option_input";
import { InputFormPage } from "../../common/input_form_page/body";
import {
  TextInputWithErrorMsg,
  ValidationResult,
} from "../../common/input_form_page/text_input";
import { LOCAL_SESSION_STORAGE } from "../../common/local_session_storage";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { SERVICE_CLIENT } from "../../common/web_service_client";
import { SWITCH_TEXT_STYLE } from "./styles";
import {
  MAX_NATURAL_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
} from "@phading/constants/account";
import { AccountType } from "@phading/user_service_interface/account_type";
import { newSignUpRequest } from "@phading/user_service_interface/web/self/client";
import {
  SignUpRequestBody,
  SignUpResponse,
} from "@phading/user_service_interface/web/self/interface";
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
  public static create(initAccountType?: AccountType): SignUpPage {
    return new SignUpPage(
      LOCAL_SESSION_STORAGE,
      SERVICE_CLIENT,
      initAccountType,
    );
  }

  public naturalNameInput = new Ref<TextInputWithErrorMsg<SignUpRequestBody>>();
  public usernameInput = new Ref<TextInputWithErrorMsg<SignUpRequestBody>>();
  public passwordInput = new Ref<TextInputWithErrorMsg<SignUpRequestBody>>();
  public repeatPasswordInput = new Ref<
    TextInputWithErrorMsg<SignUpRequestBody>
  >();
  public accountTypeInput = new Ref<
    OptionInput<AccountType, SignUpRequestBody>
  >();
  public switchToSignInButton = new Ref<HTMLDivElement>();
  public inputFormPage: InputFormPage<SignUpRequestBody, SignUpResponse>;
  private password: string;

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private serviceClient: WebServiceClient,
    initAccountType?: AccountType,
  ) {
    super();
    this.inputFormPage = InputFormPage.create(
      LOCALIZED_TEXT.signUpTitle,
      [
        assign(
          this.naturalNameInput,
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
          this.usernameInput,
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
          this.passwordInput,
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
          this.repeatPasswordInput,
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
          this.accountTypeInput,
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
            initAccountType ?? AccountType.CONSUMER,
            (request, value) => {
              request.accountType = value;
            },
          ),
        ).body,
        E.divRef(
          this.switchToSignInButton,
          {
            class: "sign-up-switch-to-sign-in",
            style: SWITCH_TEXT_STYLE,
          },
          E.text(LOCALIZED_TEXT.switchToSignInLink),
        ),
      ],
      [
        this.naturalNameInput.val,
        this.usernameInput.val,
        this.passwordInput.val,
        this.repeatPasswordInput.val,
        this.accountTypeInput.val,
      ],
      LOCALIZED_TEXT.signUpButtonLabel,
      (request) => this.signUp(request),
      (response, error) => this.postSignUp(response, error),
      {},
    );

    this.switchToSignInButton.val.addEventListener("click", () =>
      this.emit("signIn"),
    );
    this.inputFormPage.on("submitError", () => this.emit("signUpError"));
    this.inputFormPage.on("submitted", () => this.emit("signedUp"));
  }

  private checkNaturalNameInput(value: string): ValidationResult {
    if (value.length > MAX_NATURAL_NAME_LENGTH) {
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
    if (value.length > MAX_USERNAME_LENGTH) {
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
    if (value.length > MAX_PASSWORD_LENGTH) {
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

  private signUp(requset: SignUpRequestBody): Promise<SignUpResponse> {
    return this.serviceClient.send(newSignUpRequest(requset));
  }

  private postSignUp(response: SignUpResponse, error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.signUpError;
    } else if (!response.usernameIsAvailable) {
      return LOCALIZED_TEXT.usernameIsUsedError;
    } else {
      this.localSessionStorage.save(response.signedSession);
      return "";
    }
  }

  public get body() {
    return this.inputFormPage.body;
  }

  public remove(): void {
    this.inputFormPage.remove();
  }
}
