import EventEmitter = require("events");
import { InputFormPage } from "../../common/input_form_page/body";
import { RadioOptionInput } from "../../common/input_form_page/option_input";
import {
  TextInputWithErrorMsg,
  ValidationResult,
} from "../../common/input_form_page/text_input";
import { LOCAL_SESSION_STORAGE } from "../../common/local_session_storage";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { OptionPill } from "../../common/option_pills";
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
}

export class SignUpPage extends EventEmitter {
  public static create(initAccountType?: AccountType): SignUpPage {
    return new SignUpPage(
      LOCAL_SESSION_STORAGE,
      SERVICE_CLIENT,
      initAccountType,
    );
  }

  public naturalNameInput = new Ref<TextInputWithErrorMsg>();
  public usernameInput = new Ref<TextInputWithErrorMsg>();
  public passwordInput = new Ref<TextInputWithErrorMsg>();
  public repeatPasswordInput = new Ref<TextInputWithErrorMsg>();
  public consumerOption = new Ref<OptionPill<AccountType>>();
  public publisherOption = new Ref<OptionPill<AccountType>>();
  private accountTypeInput = new Ref<RadioOptionInput<AccountType>>();
  public switchToSignInButton = new Ref<HTMLDivElement>();
  public inputFormPage: InputFormPage<SignUpResponse>;
  private request: SignUpRequestBody = {};

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
            (value) => this.validateOrTakeNaturalNameInput(value),
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
            (value) => this.validateOrTakeUsernameInput(value),
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
            (value) => this.validateOrTakePasswordInput(value),
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
            (value) => this.validateRepeatPasswordInput(value),
          ),
        ).body,
        assign(
          this.accountTypeInput,
          RadioOptionInput.create(
            LOCALIZED_TEXT.chooseUserTypeLabel,
            "",
            [
              assign(
                this.consumerOption,
                OptionPill.create(
                  LOCALIZED_TEXT.userTypeConsumerLabel,
                  AccountType.CONSUMER,
                  "",
                ),
              ),
              assign(
                this.publisherOption,
                OptionPill.create(
                  LOCALIZED_TEXT.userTypePublisherLabel,
                  AccountType.PUBLISHER,
                  "",
                ),
              ),
            ],
            initAccountType ?? AccountType.CONSUMER,
            (value) => {
              this.request.accountType = value;
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
      ],
      LOCALIZED_TEXT.signUpButtonLabel,
    );

    this.switchToSignInButton.val.addEventListener("click", () =>
      this.emit("signIn"),
    );
    this.inputFormPage.addPrimaryAction(
      () => this.signUp(),
      (response, error) => this.postSignUp(response, error),
    );
    this.inputFormPage.on("submitted", () => this.emit("signedUp"));
  }

  private validateOrTakeNaturalNameInput(value: string): ValidationResult {
    if (value.length > MAX_NATURAL_NAME_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.naturalNameTooLongError,
      };
    } else if (value.length === 0) {
      return { valid: false };
    } else {
      this.request.naturalName = value;
      return { valid: true };
    }
  }

  private validateOrTakeUsernameInput(value: string): ValidationResult {
    if (value.length > MAX_USERNAME_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.usernameTooLongError,
      };
    } else if (value.length === 0) {
      return { valid: false };
    } else {
      this.request.username = value;
      return { valid: true };
    }
  }

  private validateOrTakePasswordInput(value: string): ValidationResult {
    if (value.length > MAX_PASSWORD_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.passwordTooLongError,
      };
    } else if (value.length === 0) {
      return { valid: false };
    } else {
      this.request.password = value;
      return { valid: true };
    }
  }

  private validateRepeatPasswordInput(value: string): ValidationResult {
    if (
      !this.request.password ||
      this.request.password.length === 0 ||
      value.length === 0
    ) {
      return {
        valid: false,
      };
    } else if (value !== this.request.password) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.repeatNewPasswordNotMatchError,
      };
    } else {
      return { valid: true };
    }
  }

  private signUp(): Promise<SignUpResponse> {
    return this.serviceClient.send(newSignUpRequest(this.request));
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
