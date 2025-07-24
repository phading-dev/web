import EventEmitter = require("events");
import { createBrandIcon } from "../../../common/icons";
import { InputFormPage } from "../../../common/input_form_page/body";
import { ValidationResult } from "../../../common/input_form_page/input_field";
import { PasswordInputWithErrorMsg } from "../../../common/input_form_page/password_input";
import { TextInputWithErrorMsg } from "../../../common/input_form_page/text_input";
import { LOCALIZED_TEXT } from "../../../common/locales/localized_text";
import { eFormTitle } from "../../../common/page_elements";
import { SERVICE_CLIENT } from "../../../common/web_service_client";
import { SWITCH_TEXT_STYLE } from "../common/styles";
import { newSignInRequest } from "@phading/user_service_interface/web/self/client";
import {
  SignInRequestBody,
  SignInResponse,
} from "@phading/user_service_interface/web/self/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface SignInPage {
  on(event: "auth", listener: (signedSession: string) => void): this;
  on(event: "signUp", listener: () => void): this;
  on(event: "verifyEmail", listener: (email: string) => void): this;
  on(event: "resetPassword", listener: () => void): this;
  on(event: "signInDone", listener: () => void): this;
}

export class SignInPage extends EventEmitter {
  public static create(): SignInPage {
    return new SignInPage(SERVICE_CLIENT);
  }

  public userEmailInput = new Ref<TextInputWithErrorMsg>();
  public passwordInput = new Ref<PasswordInputWithErrorMsg>();
  public resetPasswordButton = new Ref<HTMLDivElement>();
  public switchToSignUpButton = new Ref<HTMLDivElement>();
  public inputFormPage: InputFormPage<SignInResponse>;
  private request: SignInRequestBody = {};

  public constructor(private serviceClient: WebServiceClient) {
    super();
    this.inputFormPage = new InputFormPage<SignInResponse>(
      "",
      [
        createBrandIcon(),
        eFormTitle(LOCALIZED_TEXT.signInTitle),
        assign(
          this.userEmailInput,
          new TextInputWithErrorMsg(
            LOCALIZED_TEXT.emailLabel,
            "",
            {
              type: "email",
              autocomplete: "username email",
            },
            (value) => this.validateOrTakeEmailInput(value),
          ),
        ).body,
        assign(
          this.passwordInput,
          new PasswordInputWithErrorMsg(
            LOCALIZED_TEXT.passwordLabel,
            "",
            {
              autocomplete: "current-password",
            },
            (value) => this.validateOrTakePasswordInput(value),
          ),
        ).body,
        E.divRef(
          this.resetPasswordButton,
          {
            class: "sign-in-reset-password",
            style: SWITCH_TEXT_STYLE,
          },
          E.text(LOCALIZED_TEXT.forgotPasswordLink),
        ),
        E.divRef(
          this.switchToSignUpButton,
          {
            class: "sign-in-switch-to-sign-up",
            style: SWITCH_TEXT_STYLE,
          },
          E.text(LOCALIZED_TEXT.switchToSignUpLink),
        ),
      ],
      LOCALIZED_TEXT.signInButtonLabel,
    )
      .addPrimaryAction(
        () => this.signIn(),
        (response, error) => this.postSignIn(response, error),
      )
      .on("handlePrimarySuccess", (response) =>
        response.needsEmailVerification
          ? this.emit("verifyEmail", this.request.userEmail)
          : this.emit("auth", response.signedSession),
      )
      .on("primaryDone", () => this.emit("signInDone"))
      .addInputs(this.userEmailInput.val, this.passwordInput.val);
    this.resetPasswordButton.val.addEventListener("click", () =>
      this.emit("resetPassword"),
    );
    this.switchToSignUpButton.val.addEventListener("click", () =>
      this.emit("signUp"),
    );
  }

  private validateOrTakeEmailInput(value: string): ValidationResult {
    value = value.trim();
    if (value) {
      this.request.userEmail = value;
      return {
        valid: true,
      };
    } else {
      return {
        valid: false,
      };
    }
  }

  private validateOrTakePasswordInput(value: string): ValidationResult {
    if (value) {
      this.request.password = value;
      return {
        valid: true,
      };
    } else {
      return {
        valid: false,
      };
    }
  }

  private async signIn(): Promise<SignInResponse> {
    return await this.serviceClient.send(newSignInRequest(this.request));
  }

  private postSignIn(response: SignInResponse, error?: Error): string {
    if (error) {
      return LOCALIZED_TEXT.signInError;
    } else if (response.notAuthenticated) {
      return LOCALIZED_TEXT.incorrectCredentialError;
    } else {
      return "";
    }
  }

  public get body() {
    return this.inputFormPage.body;
  }

  public remove(): void {
    this.inputFormPage.remove();
    this.removeAllListeners();
  }
}
