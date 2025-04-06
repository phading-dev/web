import EventEmitter = require("events");
import { InputFormPage } from "../../common/input_form_page/body";
import {
  TextInputWithErrorMsg,
  ValidationResult,
} from "../../common/input_form_page/text_input";
import { LOCAL_SESSION_STORAGE } from "../../common/local_session_storage";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { SERVICE_CLIENT } from "../../common/web_service_client";
import { SWITCH_TEXT_STYLE } from "./styles";
import { newSignInRequest } from "@phading/user_service_interface/web/self/client";
import {
  SignInRequestBody,
  SignInResponse,
} from "@phading/user_service_interface/web/self/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

export interface SignInPage {
  on(event: "signUp", listener: () => void): this;
  on(event: "signedIn", listener: () => void): this;
}

export class SignInPage extends EventEmitter {
  public static create(): SignInPage {
    return new SignInPage(LOCAL_SESSION_STORAGE, SERVICE_CLIENT);
  }

  public usernameInput = new Ref<TextInputWithErrorMsg<SignInRequestBody>>();
  public passwordInput = new Ref<TextInputWithErrorMsg<SignInRequestBody>>();
  public switchToSignUpButton = new Ref<HTMLDivElement>();
  public inputFormPage: InputFormPage<SignInRequestBody, SignInResponse>;

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private serviceClient: WebServiceClient,
  ) {
    super();
    this.inputFormPage = InputFormPage.create(
      LOCALIZED_TEXT.signInTitle,
      [
        assign(
          this.usernameInput,
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
          this.passwordInput,
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
          this.switchToSignUpButton,
          {
            class: "sign-in-switch-to-sign-up",
            style: SWITCH_TEXT_STYLE,
          },
          E.text(LOCALIZED_TEXT.switchToSignUpLink),
        ),
      ],
      [this.usernameInput.val, this.passwordInput.val],
      {},
      LOCALIZED_TEXT.signInButtonLabel,
    );

    this.switchToSignUpButton.val.addEventListener("click", () =>
      this.emit("signUp"),
    );
    this.inputFormPage.addPrimaryAction(
      (request) => this.signIn(request),
      (response, error) => this.postSignIn(response, error),
    );
    this.inputFormPage.on("submitted", () => this.emit("signedIn"));
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
    return await this.serviceClient.send(newSignInRequest(request));
  }

  private postSignIn(response?: SignInResponse, error?: Error): string {
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
}
