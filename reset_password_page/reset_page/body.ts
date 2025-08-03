import EventEmitter = require("events");
import { SCHEME } from "../../common/color_scheme";
import { createLockIcon } from "../../common/icons";
import { InputFormPage } from "../../common/input_form_page/body";
import { ValidationResult } from "../../common/input_form_page/input_field";
import { PasswordInputWithErrorMsg } from "../../common/input_form_page/password_input";
import { LOCAL_SESSION_STORAGE } from "../../common/local_session_storage";
import { LOCALIZED_TEXT } from "../../common/locales/localized_text";
import { eFormTitle } from "../../common/page_elements";
import { GAP_1X, ICON_XXL } from "../../common/sizes";
import { SERVICE_CLIENT } from "../../common/web_service_client";
import { MAX_PASSWORD_LENGTH } from "@phading/constants/account";
import { newResetPasswordAndSignInRequest } from "@phading/user_service_interface/web/self/client";
import {
  ResetPasswordAndSignInRequestBody,
  ResetPasswordAndSignInResponse,
} from "@phading/user_service_interface/web/self/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

export interface ResetPage {
  on(event: "tokenExpired", listener: () => void): this;
  on(event: "success", listener: () => void): this;
  on(event: "resetDone", listener: () => void): this;
}

export class ResetPage extends EventEmitter {
  public static create(tokenId: string): ResetPage {
    return new ResetPage(LOCAL_SESSION_STORAGE, SERVICE_CLIENT, tokenId);
  }

  public inputFormPage: InputFormPage<ResetPasswordAndSignInResponse>;
  public newPasswordInput = new Ref<PasswordInputWithErrorMsg>();
  public repeatPasswordInput = new Ref<PasswordInputWithErrorMsg>();
  private request: ResetPasswordAndSignInRequestBody = {};
  private removed = false;

  public constructor(
    private localSessionStorage: LocalSessionStorage,
    private serviceClient: WebServiceClient,
    public tokenId: string,
  ) {
    super();
    this.request.resetToken = tokenId;
    this.inputFormPage = new InputFormPage<ResetPasswordAndSignInResponse>()
      .addLines(
        E.div(
          {
            style: `width: 100%; display: flex; flex-flow: column nowrap; gap: ${GAP_1X}rem;`,
          },
          E.div(
            {
              class: "send-password-reset-page-icon",
              style: `align-self: center; height: ${ICON_XXL}rem;`,
            },
            createLockIcon(SCHEME.primary1),
          ),
          eFormTitle(LOCALIZED_TEXT.resetPasswordTitle),
        ),
        assign(
          this.newPasswordInput,
          new PasswordInputWithErrorMsg(
            LOCALIZED_TEXT.newPasswordLabel,
            "",
            {
              autocomplete: "new-password",
            },
            (value) => this.validateOrTakePasswordInput(value),
          ),
        ).body,
        assign(
          this.repeatPasswordInput,
          new PasswordInputWithErrorMsg(
            LOCALIZED_TEXT.repeatPasswordLabel,
            "",
            {
              autocomplete: "new-password",
            },
            (value) => this.validateRepeatPasswordInput(value),
          ),
        ).body,
      )
      .addButtonsContainerAndPrimaryButton(
        LOCALIZED_TEXT.resetButtonLabel,
        () => this.reset(),
        (error, response) => this.postReset(error, response),
      )
      .addInputs(this.newPasswordInput.val, this.repeatPasswordInput.val)
      .on("primaryDone", () => this.emit("resetDone"));
  }

  private validateOrTakePasswordInput(value: string): ValidationResult {
    if (!value) {
      return { valid: false };
    } else if (value.length > MAX_PASSWORD_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.passwordTooLongError,
      };
    } else {
      this.request.newPassword = value;
      return { valid: true };
    }
  }

  private validateRepeatPasswordInput(value: string): ValidationResult {
    if (!this.request.newPassword || !value) {
      return {
        valid: false,
      };
    } else if (value !== this.request.newPassword) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.repeatPasswordNotMatchError,
      };
    } else {
      return { valid: true };
    }
  }

  private reset(): Promise<ResetPasswordAndSignInResponse> {
    return this.serviceClient.send(
      newResetPasswordAndSignInRequest(this.request),
    );
  }

  private postReset(
    error?: Error,
    response?: ResetPasswordAndSignInResponse,
  ): string {
    if (this.removed) {
      return "";
    }
    if (error) {
      return LOCALIZED_TEXT.resetPasswordGenericError;
    } else if (response.tokenExpired) {
      this.emit("tokenExpired");
      return "";
    } else {
      this.localSessionStorage.save(response.signedSession);
      this.emit("success");
      return "";
    }
  }

  public get body() {
    return this.inputFormPage.body;
  }

  public remove(): void {
    this.removed = true;
    this.inputFormPage.remove();
    this.removeAllListeners();
  }
}
