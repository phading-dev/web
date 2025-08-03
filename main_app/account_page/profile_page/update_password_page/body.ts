import EventEmitter = require("events");
import { InputFormPage } from "../../../../common/input_form_page/body";
import { ValidationResult } from "../../../../common/input_form_page/input_field";
import { PasswordInputWithErrorMsg } from "../../../../common/input_form_page/password_input";
import { LOCALIZED_TEXT } from "../../../../common/locales/localized_text";
import { PAGE_NAVIGATION_PADDING_BOTTOM } from "../../../../common/navigation_bar";
import { eFormTitle } from "../../../../common/page_elements";
import { SERVICE_CLIENT } from "../../../../common/web_service_client";
import { MAX_PASSWORD_LENGTH } from "@phading/constants/account";
import { newUpdatePasswordRequest } from "@phading/user_service_interface/web/self/client";
import {
  UpdatePasswordRequestBody,
  UpdatePasswordResponse,
} from "@phading/user_service_interface/web/self/interface";
import { E } from "@selfage/element/factory";
import { Ref, assign } from "@selfage/ref";
import { WebServiceClient } from "@selfage/web_service_client";

export interface UpdatePasswordPage {
  on(event: "back", listener: () => void): this;
  on(event: "updated", listener: () => void): this;
}

export class UpdatePasswordPage extends EventEmitter {
  public static create(userEmail: string): UpdatePasswordPage {
    return new UpdatePasswordPage(SERVICE_CLIENT, userEmail);
  }

  public inputFormPage: InputFormPage<UpdatePasswordResponse>;
  public currentPasswordInput = new Ref<PasswordInputWithErrorMsg>();
  public newPasswordInput = new Ref<PasswordInputWithErrorMsg>();
  public newPasswordRepeatInput = new Ref<PasswordInputWithErrorMsg>();
  private request: UpdatePasswordRequestBody = {};

  public constructor(
    private serviceClient: WebServiceClient,
    userEmail: string,
  ) {
    super();
    this.inputFormPage = new InputFormPage({
      customPageStyle: `padding-bottom: ${PAGE_NAVIGATION_PADDING_BOTTOM}rem;`,
    })
      .addLines(
        eFormTitle(LOCALIZED_TEXT.updatePasswordTitle),
        E.input({
          name: "update-password-user-email",
          style: `display: none;`,
          autocomplete: "username email",
          value: userEmail,
        }),
        assign(
          this.currentPasswordInput,
          new PasswordInputWithErrorMsg(
            LOCALIZED_TEXT.currentPasswordLabel,
            "",
            {
              autocomplete: "current-password",
            },
            (value) => this.validateOrTakeCurrentPassword(value),
          ),
        ).body,
        assign(
          this.newPasswordInput,
          new PasswordInputWithErrorMsg(
            LOCALIZED_TEXT.newPasswordLabel,
            "",
            {
              autocomplete: "new-password",
            },
            (value) => this.validateOrTakeNewPassword(value),
          ),
        ).body,
        assign(
          this.newPasswordRepeatInput,
          new PasswordInputWithErrorMsg(
            LOCALIZED_TEXT.repeatNewPasswordLabel,
            "",
            {
              autocomplete: "new-password",
            },
            (value) => this.validateNewPasswordRepeat(value),
          ),
        ).body,
      )
      .addButtonsContainerAndPrimaryButton(
        LOCALIZED_TEXT.updateButtonLabel,
        () => this.updatePassword(),
        (error, response) => this.postUpdatePassword(error, response),
      )
      .addBackButton()
      .addInputs(
        this.newPasswordInput.val,
        this.newPasswordRepeatInput.val,
        this.currentPasswordInput.val,
      )
      .on("primaryDone", () => this.emit("updated"))
      .on("back", () => this.emit("back"));
  }

  private validateOrTakeCurrentPassword(value: string): ValidationResult {
    if (!value) {
      return { valid: false };
    } else {
      this.request.currentPassword = value;
      return { valid: true };
    }
  }

  private validateOrTakeNewPassword(value: string): ValidationResult {
    if (!value) {
      return { valid: false };
    } else if (value.length > MAX_PASSWORD_LENGTH) {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.newPasswordTooLongError,
      };
    } else {
      this.request.newPassword = value;
      return { valid: true };
    }
  }

  private validateNewPasswordRepeat(value: string): ValidationResult {
    if (!this.request.newPassword || !value) {
      return { valid: false };
    }
    if (value === this.request.newPassword) {
      return { valid: true };
    } else {
      return {
        valid: false,
        errorMsg: LOCALIZED_TEXT.repeatPasswordNotMatchError,
      };
    }
  }

  private updatePassword(): Promise<UpdatePasswordResponse> {
    return this.serviceClient.send(newUpdatePasswordRequest(this.request));
  }

  private postUpdatePassword(
    error?: Error,
    response?: UpdatePasswordResponse,
  ): string {
    if (error) {
      return LOCALIZED_TEXT.updateGenericError;
    } else if (response.notAuthenticated) {
      return LOCALIZED_TEXT.incorrectPasswordError;
    } else {
      this.emit("back");
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
