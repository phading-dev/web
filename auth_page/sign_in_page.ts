import EventEmitter = require("events");
import { InputFormPage } from "../common/input_form_page/body";
import {
  TextInputWithErrorMsg,
  ValidationResult,
} from "../common/input_form_page/text_input";
import { LOCAL_SESSION_STORAGE } from "../common/local_session_storage";
import { LOCALIZED_TEXT } from "../common/locales/localized_text";
import { USER_SERVICE_CLIENT } from "../common/web_service_client";
import { SWITCH_TEXT_STYLE } from "./styles";
import { signIn } from "@phading/user_service_interface/self/frontend/client";
import {
  SignInRequestBody,
  SignInResponse,
} from "@phading/user_service_interface/self/frontend/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

export interface SignInPage {
  on(event: "signUp", listener: () => void): this;
  on(event: "signedIn", listener: () => void): this;
  on(event: "signInError", listener: () => void): this;
}

export class SignInPage extends EventEmitter {
  public static create(): SignInPage {
    return new SignInPage(LOCAL_SESSION_STORAGE, USER_SERVICE_CLIENT);
  }

  private usernameInput_: TextInputWithErrorMsg<SignInRequestBody>;
  private passwordInput_: TextInputWithErrorMsg<SignInRequestBody>;
  private switchToSignUpButton_: HTMLDivElement;
  private inputFormPage_: InputFormPage<SignInRequestBody, SignInResponse>;

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private userServiceClient: WebServiceClient,
  ) {
    super();
    let usernameInputRef = new Ref<TextInputWithErrorMsg<SignInRequestBody>>();
    let passwordInputRef = new Ref<TextInputWithErrorMsg<SignInRequestBody>>();
    let switchToSignUpButtonRef = new Ref<HTMLDivElement>();
    this.inputFormPage_ = InputFormPage.create(
      LOCALIZED_TEXT.signInTitle,
      [
        assign(
          usernameInputRef,
          TextInputWithErrorMsg.create<SignInRequestBody>(
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
          TextInputWithErrorMsg.create<SignInRequestBody>(
            LOCALIZED_TEXT.passwordLabel,
            "",
            {
              type: "password",
              autocomplete: "current-password",
            },
            (request, value) => {
              request.password = value;
            },
            (value) => this.checkPasswordInput(value),
          ),
        ).body,
        E.divRef(
          switchToSignUpButtonRef,
          {
            class: "sign-in-switch-to-sign-up",
            style: SWITCH_TEXT_STYLE,
          },
          E.text(LOCALIZED_TEXT.switchToSignUpLink),
        ),
      ],
      [usernameInputRef.val, passwordInputRef.val],
      LOCALIZED_TEXT.signInButtonLabel,
      (request) => this.signIn(request),
      (response, error) => this.postSignIn(response, error),
      {},
    );
    this.usernameInput_ = usernameInputRef.val;
    this.passwordInput_ = passwordInputRef.val;
    this.switchToSignUpButton_ = switchToSignUpButtonRef.val;

    this.switchToSignUpButton_.addEventListener("click", () =>
      this.emit("signUp"),
    );
    this.inputFormPage_.on("submitted", () => this.emit("signedIn"));
    this.inputFormPage_.on("submitError", () => this.emit("signInError"));
  }

  private checkUsernameInput(value: string): ValidationResult {
    if (value.length > 0) {
      return {
        valid: true,
      };
    } else {
      return {
        valid: false,
      };
    }
  }

  private checkPasswordInput(value: string): ValidationResult {
    if (value.length > 0) {
      return {
        valid: true,
      };
    } else {
      return {
        valid: false,
      };
    }
  }

  private async signIn(request: SignInRequestBody): Promise<SignInResponse> {
    return await signIn(this.userServiceClient, request);
  }

  private postSignIn(response: SignInResponse, error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.signInError;
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

  // Visible for testing
  public get usernameInput() {
    return this.usernameInput_;
  }

  public get passwordInput() {
    return this.passwordInput_;
  }

  public get switchToSignUpButton() {
    return this.switchToSignUpButton_;
  }

  public get inputFormPage() {
    return this.inputFormPage_;
  }
}
